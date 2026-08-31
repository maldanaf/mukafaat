"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "@/lib/router-compat";
import { useLoadMoreOnScroll } from "@hooks/useLoadMoreOnScroll";
import { useTranslation } from "react-i18next";
import { Helmet } from "@/lib/helmet-compat";
import { IoCalendarOutline, IoFlashOutline } from "react-icons/io5";
import { HeartIcon } from "@ui";
import { FaTag, FaPercent, FaUtensils } from "react-icons/fa";
import { FiFilter, FiGrid, FiList, FiSearch } from "react-icons/fi";
import { copon1, copon2, copon3, copon4, cutCopon } from "@assets";
import CouponsHero from "./components/CouponsHero";
import { CONTAINER, Button, EmptyState, SkeletonGrid, StatChips, FOCUS } from "@ui";
import {
  VIVID_CARD,
  DiscountBadge,
  Ribbon,
  CornerButton,
  Chip,
  ChipBar,
  ResultsCount,
  TOOLBAR_CARD,
  TOOLBAR_FIELD,
} from "@views/offers/components/CatalogKit";
import GetStartedSection from "@views/home/components/GetStartedSection";
import CouponModal, {
  type CouponWithIcon,
} from "@views/home/components/CouponModal";
import { LoadingSpinner } from "@components/LoadingSpinner";
import {
  useWebCoupons,
  useWebCouponsHome,
} from "@hooks/api/useMokafaatQueries";
import { mapApiCouponsToModels } from "@network/mappers/couponsMapper";
import { stripHtml } from "@utils/stripHtml";
import { usedCountText } from "@utils/usedCount";
import { useIsRTL } from "@hooks";
import { useUserStore } from "@stores/userStore";
import { useFavorites, useFavoriteToggle } from "@hooks/api/useMokafaatQueries";
import { normalizeFavoritesList } from "@utils/favorites";
import { toast } from "react-toastify";
import CategoryCard from "@components/CategoryCard";
import { PinnedChipsBar, pick } from "@ui";
import usePinnedUnderHeader from "@hooks/usePinnedUnderHeader";
import { buildWebCouponsParams } from "@utils/webFilters";
import { IoMdClose } from "react-icons/io";
import MobileCoupons from "./mobile/MobileCoupons";

type CouponDisplay = {
  id: string;
  storeName: string;
  storeCategory: string;
  logo: string;
  discount: string;
  offer: string;
  uses: number;
  expiry: string;
  rating: number;
  views: number;
  downloads: number;
  visits: number;
  couponCode: string;
};

const CouponsPage = () => {
  const { t, i18n } = useTranslation();
  const langBase = i18n.language?.split("-")[0] || "en";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRTL = useIsRTL();
  const isAuthenticated = useUserStore((s) => !!s.token);
  const { data: favoritesData } = useFavorites();
  const toggleFavorite = useFavoriteToggle();
  const favoritesList = useMemo(
    () => normalizeFavoritesList(favoritesData ?? null),
    [favoritesData],
  );

  const isCouponFavorite = (couponId: string) =>
    favoritesList.some(
      (f) =>
        f.favorable_type === "coupon" &&
        String(f.favorable_id) === String(couponId),
    );

  const handleFavoriteClick = (e: React.MouseEvent, couponId: string) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate(
        `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`,
      );
      return;
    }
    const isFavorite = isCouponFavorite(couponId);
    toggleFavorite.mutate(
      { favorable_type: "coupon", favorable_id: couponId },
      {
        onSuccess: () => {
          toast.success(
            isFavorite
              ? t("couponModal.removedFromFavorites")
              : t("couponModal.addedToFavorites"),
          );
        },
        onError: () => toast.error(t("couponModal.errorGeneric")),
      },
    );
  };

  const [search, setSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedFilter, setSelectedFilter] = useState<"latest" | "top_used">(
    "latest",
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  /** صف التصنيفات يتحوّل لشريط شرائح مثبّت تحت الهيدر عند تجاوزه */
  const categoriesRef = useRef<HTMLElement | null>(null);
  const categoriesPinned = usePinnedUnderHeader(categoriesRef);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponWithIcon | null>(
    null,
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const defaultCouponFilters = useMemo(
    () => ({
      merchantIds: [] as string[],
      couponTypes: [] as Array<"percentage" | "fixed">,
    }),
    [],
  );
  const [draftCouponFilters, setDraftCouponFilters] = useState<{
    sortBy?: "newest" | "most_used" | "highest_discount";
    merchantIds: string[];
    couponTypes: Array<"percentage" | "fixed">;
    discountMin?: number;
  }>(defaultCouponFilters);
  const [appliedCouponFilters, setAppliedCouponFilters] = useState<{
    sortBy?: "newest" | "most_used" | "highest_discount";
    merchantIds: string[];
    couponTypes: Array<"percentage" | "fixed">;
    discountMin?: number;
  }>(defaultCouponFilters);
  const perPage = 12;

  const { data: couponsHomeResponse, isLoading: isLoadingCoupons } =
    useWebCouponsHome();

  const homeData = useMemo(() => {
    if (!couponsHomeResponse) return null;
    const res = couponsHomeResponse as Record<string, unknown>;
    return (res?.data as Record<string, unknown>) ?? res;
  }, [couponsHomeResponse]);

  const categoriesList = useMemo(() => {
    if (!homeData) return [];
    const list = homeData.categories as
      | Array<Record<string, unknown>>
      | undefined;
    return Array.isArray(list) ? list : [];
  }, [homeData]);

  const merchantsList = useMemo(() => {
    if (!homeData) return [];
    const list = homeData.merchants as
      | Array<Record<string, unknown>>
      | undefined;
    return Array.isArray(list) ? list : [];
  }, [homeData]);

  const categoriesCarouselItems = useMemo(() => {
    const normalized = categoriesList
      .map((c) => {
        const id = c?.id != null ? String(c.id) : "";
        const name =
          (c?.name as string | undefined) ??
          (c?.title as string | undefined) ??
          "";
        const icon =
          (c?.icon as string | undefined) ??
          (c?.image as string | undefined) ??
          (c?.logo as string | undefined) ??
          "";
        if (!id || !name) return null;
        return { id, name, icon };
      })
      .filter(Boolean) as Array<{ id: string; name: string; icon: string }>;

    // Match CardsCategorySection behavior: reverse items for RTL
    return isRTL ? [...normalized].reverse() : normalized;
  }, [categoriesList, isRTL]);

  const listParams = useMemo(
    () =>
      buildWebCouponsParams({
        categoryIds: selectedCategoryId ? [selectedCategoryId] : undefined,
        search,
        perPage,
        page: currentPage,
        sortBy:
          appliedCouponFilters.sortBy ??
          (selectedFilter === "top_used" ? "most_used" : "newest"),
        merchantIds:
          appliedCouponFilters.merchantIds.length > 0
            ? appliedCouponFilters.merchantIds
            : undefined,
        couponTypes:
          appliedCouponFilters.couponTypes.length > 0
            ? appliedCouponFilters.couponTypes
            : undefined,
        discountMin: appliedCouponFilters.discountMin,
      }),
    [
      selectedCategoryId,
      search,
      perPage,
      currentPage,
      selectedFilter,
      appliedCouponFilters,
    ],
  );

  const { data: couponsListRes, isLoading: isLoadingList } =
    useWebCoupons(listParams);

  const allCouponsRaw = useMemo(() => {
    const root = (couponsListRes as Record<string, unknown>) ?? {};
    const data =
      (root.data as Record<string, unknown>) ??
      (root as Record<string, unknown>);
    const list = (data.coupons ?? data.data ?? data) as unknown;
    return Array.isArray(list) ? (list as Array<Record<string, unknown>>) : [];
  }, [couponsListRes]);

  const pagination = useMemo(() => {
    const root = (couponsListRes as Record<string, unknown>) ?? {};
    const data =
      (root.data as Record<string, unknown>) ??
      (root as Record<string, unknown>);
    const pg =
      (data.pagination as Record<string, unknown> | undefined) ??
      (data.meta as Record<string, unknown> | undefined) ??
      (data as Record<string, unknown>);
    return {
      // لا نرجع للحالة المحلية — يجب أن نعرف الصفحة من الـAPI فعلياً
      currentPage: Number(pg?.current_page ?? pg?.page ?? 0) || 0,
      lastPage: Number(pg?.last_page ?? pg?.pages ?? 1) || 1,
      total: Number(pg?.total ?? 0) || 0,
    };
  }, [couponsListRes]);

  const couponModels = useMemo(() => {
    const withTitle = (allCouponsRaw as Array<Record<string, unknown>>).map(
      (c) => ({
        ...c,
        title: c.name ?? c.title,
        // نمرّر أسماء بديلة ليستفيد منها الـ mapper لو احتاج
        couponCode: c.coupon_code,
        storeUrl: c.store_url,
      }),
    );
    return mapApiCouponsToModels(withTitle);
  }, [allCouponsRaw]);

  // Note: server-side filtering is used; raw-by-id map is no longer required here.

  const couponsWithIcons = useMemo((): CouponWithIcon[] => {
    return couponModels.map((coupon) => {
      let icon = <FaTag className="text-2xl" />;
      if (coupon.discountPercentage) {
        icon = <FaPercent className="text-2xl" />;
      } else if (
        coupon.category?.includes("مطاعم") ||
        coupon.title.includes("وجبة")
      ) {
        icon = <FaUtensils className="text-2xl" />;
      }
      return { ...coupon, icon };
    });
  }, [couponModels]);

  const apiCouponsAsDisplay = useMemo((): CouponDisplay[] => {
    const pickLogo = (raw: Record<string, unknown> | undefined): string => {
      if (!raw) return "";
      const direct =
        (raw.image as string | undefined) || (raw.logo as string | undefined);
      if (direct) return String(direct);
      const merchant = raw.merchant as Record<string, unknown> | undefined;
      const merchantLogo = merchant?.logo as string | undefined;
      return merchantLogo ? String(merchantLogo) : "";
    };

    // عدّاد الاستخدام = عدد مرات نسخ الكود (copies_count) — هو ما يزيده
    // POST /web/coupons/{id}/copy، وusage_count يبقى بديلاً للمخرجات القديمة.
    const pickUses = (raw: Record<string, unknown> | undefined): number => {
      const v =
        raw?.copies_count ?? raw?.usage_count ?? raw?.uses ?? raw?.used_count ?? 0;
      const n = typeof v === "number" ? v : parseInt(String(v ?? "0"), 10);
      return Number.isFinite(n) ? n : 0;
    };

    const pickExpiry = (
      raw: Record<string, unknown> | undefined,
      fallback: string,
    ): string => {
      const v = raw?.end_date ?? raw?.expires_at ?? raw?.expiry;
      if (!v) return fallback;
      const d = new Date(String(v));
      if (Number.isNaN(d.getTime())) return fallback;
      const locale =
        langBase === "ar"
          ? "ar-SA"
          : langBase === "ur"
            ? "ur-PK"
            : langBase === "hi"
              ? "hi-IN"
              : "en-US";
      return d.toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    };

    return (allCouponsRaw as Array<Record<string, unknown>>).map((raw) => {
      const merchant = raw.merchant as Record<string, unknown> | undefined;
      const category = raw.category as Record<string, unknown> | undefined;
      const storeName =
        (merchant?.name as string) ?? (raw.name as string) ?? "";
      const storeCategory = (category?.name as string) ?? "";
      const logoUrl = pickLogo(raw);
      const uses = pickUses(raw);
      const expiry = pickExpiry(raw, "");
      // شارة الخصم: display_value يغطّي النسبة والمبلغ الثابت معاً
      const displayValue =
        typeof raw.display_value === "string" ? raw.display_value.trim() : "";
      const discountPct =
        raw.discount_percentage != null
          ? Number(raw.discount_percentage)
          : null;
      const discount =
        displayValue || (discountPct != null ? `${discountPct}%` : "");
      const offer = (raw.name as string) ?? (raw.description as string) ?? "";

      return {
        id: String(raw.id ?? ""),
        storeName,
        storeCategory,
        logo: logoUrl || "copon1",
        discount,
        offer,
        uses,
        expiry,
        rating: Number(raw.rating ?? 5),
        views: Number(raw.views_count ?? 0),
        downloads: Number(raw.shares_count ?? 0),
        visits: uses,
        couponCode: String(raw.coupon_code ?? ""),
      };
    });
  }, [allCouponsRaw, langBase]);

  const getCouponImage = (logoName: string) => {
    if (logoName.startsWith("http")) return logoName;
    switch (logoName) {
      case "copon1":
        return copon1;
      case "copon2":
        return copon2;
      case "copon3":
        return copon3;
      case "copon4":
        return copon4;
      default:
        return copon1;
    }
  };

  // Server-side filtering & pagination (WEB):
  // listParams includes category_ids + search + sort_by + page/per_page
  const totalPages = Math.max(1, pagination.lastPage);

  // 🔁 Load-more accumulation
  const [accumulatedCoupons, setAccumulatedCoupons] = useState<CouponDisplay[]>([]);
  // نراكم أيضاً نماذج المودال (CouponWithIcon) حتى يفتح "عرض الكوبون" لكل الصفحات.
  const [accumulatedWithIcons, setAccumulatedWithIcons] = useState<
    CouponWithIcon[]
  >([]);
  // مهم: التوقيع لا يتضمّن رقم الصفحة — نُصفّر التراكم فقط عند تغيّر الفلاتر
  // الفعلية (تصنيف/بحث/فرز/تجار/نوع/حد الخصم) لا عند "عرض المزيد".
  const filterSig = useMemo(
    () =>
      JSON.stringify({
        category: selectedCategoryId,
        search,
        sortBy:
          appliedCouponFilters.sortBy ??
          (selectedFilter === "top_used" ? "most_used" : "newest"),
        merchantIds: appliedCouponFilters.merchantIds,
        couponTypes: appliedCouponFilters.couponTypes,
        discountMin: appliedCouponFilters.discountMin,
      }),
    [selectedCategoryId, search, selectedFilter, appliedCouponFilters],
  );
  const prevSigRef = useRef<string>("");
  const lastIncorporatedPageRef = useRef<number>(0);
  const responsePage = pagination.currentPage || 0;
  const hasResponse = !!couponsListRes;

  // reset عند تغيير الفلتر (وأيضاً الرجوع للصفحة الأولى)
  useEffect(() => {
    if (prevSigRef.current !== filterSig) {
      prevSigRef.current = filterSig;
      lastIncorporatedPageRef.current = 0;
      setAccumulatedCoupons([]);
      setAccumulatedWithIcons([]);
      setCurrentPage(1);
    }
  }, [filterSig]);

  // دمج بيانات الصفحة لما تصل (إلحاق append لا استبدال)
  useEffect(() => {
    if (!hasResponse) return;
    if (responsePage <= lastIncorporatedPageRef.current) return;
    lastIncorporatedPageRef.current = responsePage;
    setAccumulatedCoupons((prev) =>
      responsePage === 1 ? apiCouponsAsDisplay : [...prev, ...apiCouponsAsDisplay],
    );
    setAccumulatedWithIcons((prev) =>
      responsePage === 1 ? couponsWithIcons : [...prev, ...couponsWithIcons],
    );
  }, [hasResponse, apiCouponsAsDisplay, couponsWithIcons, responsePage]);

  const paginated = accumulatedCoupons;
  const hasMore = currentPage < totalPages;
  const isLoadingMore = currentPage > lastIncorporatedPageRef.current;
  const loadMoreRef = useLoadMoreOnScroll({
    hasMore,
    loading: isLoadingMore,
    loadMore: () => setCurrentPage((p) => p + 1),
  });

  const openCouponModal = useCallback(
    (displayCoupon: CouponDisplay) => {
      const withIcon =
        accumulatedWithIcons.find(
          (c) => String(c.id) === String(displayCoupon.id),
        ) ??
        couponsWithIcons.find(
          (c) => String(c.id) === String(displayCoupon.id),
        );
      if (withIcon) {
        setSelectedCoupon(withIcon);
        // Update URL with coupon ID for sharing
        const url = new URL(window.location.href);
        url.searchParams.set("coupon", String(displayCoupon.id));
        window.history.replaceState({}, "", url.toString());
      }
    },
    [accumulatedWithIcons, couponsWithIcons],
  );

  const closeCouponModal = useCallback(() => {
    setSelectedCoupon(null);
    // Remove coupon param from URL
    const url = new URL(window.location.href);
    url.searchParams.delete("coupon");
    window.history.replaceState({}, "", url.toString());
  }, []);

  // Auto-open modal if ?coupon=ID is in URL
  useEffect(() => {
    const couponId = searchParams.get("coupon");
    const pool =
      accumulatedWithIcons.length > 0 ? accumulatedWithIcons : couponsWithIcons;
    if (couponId && pool.length > 0 && !selectedCoupon) {
      const match = pool.find((c) => String(c.id) === couponId);
      if (match) setSelectedCoupon(match);
    }
  }, [searchParams, accumulatedWithIcons, couponsWithIcons, selectedCoupon]);

  const getLogoUrlForModal = (coupon: { id: number }) => {
    const d = accumulatedCoupons.find(
      (x) => String(x.id) === String(coupon.id),
    );
    return d ? getCouponImage(d.logo) : "";
  };

  return (
    <>
      <Helmet>
        <title>{t("coupons.title")}</title>
        <link rel="canonical" href="https://mukafaat.com.sa/coupons" />
      </Helmet>

      {/* نسخة الموبايل */}
      <MobileCoupons />

      {/* نسخة الديسكتوب */}
      <div className="hidden lg:block">
      <CouponsHero />

      {isLoadingCoupons ? (
        <div className={`${CONTAINER} py-10`}>
          <SkeletonGrid count={8} className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" />
        </div>
      ) : (
        <>
          {/* Filter Sidebar (WEB Coupons) */}
          {isFilterOpen && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setIsFilterOpen(false)}
            />
          )}
          <div
            className={`fixed top-0 h-full w-full md:w-1/2 lg:w-1/3 xl:w-1/4 bg-white z-[9999] transition-all duration-300 ease-in-out shadow-2xl ${
              isFilterOpen
                ? isRTL
                  ? "right-0 translate-x-0"
                  : "left-0 translate-x-0"
                : isRTL
                  ? "-right-full translate-x-full"
                  : "-left-full -translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between py-4 px-6 border-b border-mk-border">
              <h2 className="text-lg font-semibold text-mk-text">
                {t("coupons.filter_sidebar_title")}
              </h2>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="text-mk-faint hover:text-mk-muted transition-colors duration-200 bg-mk-tint2 rounded-full p-2"
              >
                <IoMdClose size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pb-24 h-[calc(100vh-160px)]">
              <div className="space-y-6">
                {/* Sort */}
                <div>
                  <p className="text-sm font-semibold text-mk-text mb-3">
                    {t("coupons.sort_by")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { key: "newest", label: t("coupons.sort_newest") },
                        {
                          key: "most_used",
                          label: t("coupons.sort_most_used"),
                        },
                        {
                          key: "highest_discount",
                          label: t("coupons.sort_highest_discount"),
                        },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() =>
                          setDraftCouponFilters((p) => ({
                            ...p,
                            sortBy: opt.key,
                          }))
                        }
                        className={`px-4 py-2 rounded-mk-sm text-sm font-medium transition-colors border ${
                          draftCouponFilters.sortBy === opt.key
                            ? "bg-mk-tint text-mk-primary border-mk-border-strong"
                            : "bg-white text-mk-text-strong border-mk-border hover:bg-mk-tint3"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Coupon Types */}
                <div className="border-t border-mk-border pt-5">
                  <p className="text-sm font-semibold text-mk-text mb-3">
                    {t("coupons.coupon_type")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        {
                          key: "percentage",
                          label: t("coupons.type_percentage"),
                        },
                        { key: "fixed", label: t("coupons.type_fixed") },
                      ] as const
                    ).map((opt) => {
                      const selected = draftCouponFilters.couponTypes.includes(
                        opt.key,
                      );
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() =>
                            setDraftCouponFilters((p) => ({
                              ...p,
                              couponTypes: selected
                                ? p.couponTypes.filter((x) => x !== opt.key)
                                : [...p.couponTypes, opt.key],
                            }))
                          }
                          className={`px-4 py-2 rounded-mk-sm text-sm font-medium transition-colors border ${
                            selected
                              ? "bg-mk-tint text-mk-primary border-mk-border-strong"
                              : "bg-white text-mk-text-strong border-mk-border hover:bg-mk-tint3"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Discount min */}
                <div className="border-t border-mk-border pt-5">
                  <p className="text-sm font-semibold text-mk-text mb-3">
                    {t("coupons.min_discount_pct")}
                  </p>
                  <input
                    type="number"
                    min={0}
                    value={draftCouponFilters.discountMin ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDraftCouponFilters((p) => ({
                        ...p,
                        discountMin: v === "" ? undefined : Number(v),
                      }));
                    }}
                    className="w-full px-4 py-3 rounded-mk-md border border-mk-border focus:outline-none focus:ring-2 focus:ring-[#400198]/30"
                    placeholder={t("coupons.min_discount_placeholder")}
                  />
                </div>

                {/* Merchants */}
                {merchantsList.length > 0 && (
                  <div className="border-t border-mk-border pt-5">
                    <p className="text-sm font-semibold text-mk-text mb-3">
                      {t("coupons.merchants")}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {merchantsList.map((m) => {
                        const id = m?.id != null ? String(m.id) : undefined;
                        const name = String(m?.name ?? "").trim();
                        if (!id || !name) return null;
                        const selected =
                          draftCouponFilters.merchantIds.includes(id);
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() =>
                              setDraftCouponFilters((p) => ({
                                ...p,
                                merchantIds: selected
                                  ? p.merchantIds.filter((x) => x !== id)
                                  : [...p.merchantIds, id],
                              }))
                            }
                            className={`px-3 py-2 rounded-mk-sm text-sm font-medium transition-colors border ${
                              selected
                                ? "bg-mk-tint text-mk-primary border-mk-border-strong"
                                : "bg-white text-mk-text-strong border-mk-border hover:bg-mk-tint3"
                            }`}
                          >
                            {name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-mk-border p-6">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDraftCouponFilters(defaultCouponFilters);
                    setAppliedCouponFilters(defaultCouponFilters);
                    setSelectedFilter("latest");
                    setCurrentPage(1);
                  }}
                  className="flex-1 px-4 py-2 bg-mk-tint2 text-mk-text-strong rounded-mk-sm font-medium hover:bg-mk-border-strong/60 transition-colors"
                >
                  {t("cardsPage.reset")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedCouponFilters(draftCouponFilters);
                    setCurrentPage(1);
                    setIsFilterOpen(false);
                  }}
                  className="flex-1 px-4 py-2 bg-[#fd671a] text-white rounded-mk-sm font-medium hover:bg-[#D9500B] transition-colors"
                >
                  {t("cardsPage.apply")}
                </button>
              </div>
            </div>
          </div>

          {/* التصنيفات — صف أفقي واحد بنفس تخطيط الرئيسية وصفحة البطاقات.
              كان كاروسيل Owl بحاوية مزدوجة وهامش علوي سالب، فكانت أسهمه
              تطفو فوق الهيرو ويختلّ محاذاته مع شريط الأدوات والشبكة. */}
          {categoriesCarouselItems.length > 0 && (
            <section ref={categoriesRef} className="mx-auto w-full max-w-site px-4 pb-4 pt-8 sm:px-6">
              <div className="mk-scroll-x -mx-1 gap-3 px-1 py-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId("");
                    setCurrentPage(1);
                  }}
                  className="w-[124px] shrink-0 sm:w-[140px]"
                >
                  <CategoryCard
                    icon="https://api.iconify.design/mdi:shape-outline.svg?color=%23400198"
                    title={t("coupons.all_categories")}
                    alt={t("coupons.all_categories")}
                    selected={!selectedCategoryId}
                  />
                </button>

                {categoriesCarouselItems.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      setCurrentPage(1);
                    }}
                    className="w-[124px] shrink-0 sm:w-[140px]"
                  >
                    <CategoryCard
                      icon={
                        cat.icon ||
                        "https://api.iconify.design/mdi:shape-outline.svg?color=%23400198"
                      }
                      title={cat.name}
                      alt={cat.name}
                      selected={selectedCategoryId === cat.id}
                    />
                  </button>
                ))}
              </div>
            </section>
          )}

          <PinnedChipsBar
            pinned={categoriesPinned}
            title={t("coupons.all_categories", "التصنيفات")}
            items={[
              {
                id: "all",
                name: t("coupons.all_categories"),
                active: !selectedCategoryId,
                onClick: () => {
                  setSelectedCategoryId("");
                  setCurrentPage(1);
                },
              },
              ...categoriesCarouselItems.map((cat, i) => ({
                id: cat.id,
                name: cat.name,
                image: cat.icon || null,
                color: pick(i + 1).c,
                active: selectedCategoryId === cat.id,
                onClick: () => {
                  setSelectedCategoryId(cat.id);
                  setCurrentPage(1);
                },
              })),
            ]}
          />

          <section className="mx-auto w-full max-w-site px-4 pb-10 pt-2 sm:px-6 portfolio-mobile">
            {/* شريط الأدوات — ترتيب + بحث + فلاتر + نمط العرض */}
            <div className={`${TOOLBAR_CARD} mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between`}>
              <ChipBar label={t("ui.filters", "الفلاتر")} className="lg:flex-1">
                <Chip
                  active={selectedFilter === "latest"}
                  onClick={() => {
                    setSelectedFilter("latest");
                    setCurrentPage(1);
                  }}
                >
                  {t("coupons.latest")}
                </Chip>
                <Chip
                  active={selectedFilter === "top_used"}
                  onClick={() => {
                    setSelectedFilter("top_used");
                    setCurrentPage(1);
                  }}
                >
                  {t("coupons.filters.most_visited")}
                </Chip>
              </ChipBar>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* البحث */}
                <label className="relative flex min-w-[200px] flex-1 items-center lg:max-w-[280px]">
                  <FiSearch aria-hidden className="pointer-events-none absolute start-3.5 text-mk-faint" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    aria-label={t("coupons.search_placeholder")}
                    placeholder={t("coupons.search_placeholder")}
                    className={`${TOOLBAR_FIELD} w-full ps-10 pe-4`}
                  />
                </label>

                {/* الفلاتر */}
                <Button
                  variant="outline"
                  size="md"
                  icon={<FiFilter />}
                  onClick={() => {
                    setDraftCouponFilters(appliedCouponFilters);
                    setIsFilterOpen(true);
                  }}
                >
                  {t("coupons.filter")}
                </Button>

                {/* نمط العرض */}
                <div className="flex items-center gap-1 rounded-mk-md border border-mk-border-2 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    aria-label={t("ui.gridView", "عرض شبكي")}
                    aria-pressed={viewMode === "grid"}
                    className={`flex h-10 w-10 items-center justify-center rounded-mk-sm transition-colors ${FOCUS} ${
                      viewMode === "grid"
                        ? "bg-mk-primary text-white"
                        : "text-mk-muted hover:bg-mk-tint2"
                    }`}
                  >
                    <FiGrid size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    aria-label={t("ui.listView", "عرض قائمة")}
                    aria-pressed={viewMode === "list"}
                    className={`flex h-10 w-10 items-center justify-center rounded-mk-sm transition-colors ${FOCUS} ${
                      viewMode === "list"
                        ? "bg-mk-primary text-white"
                        : "text-mk-muted hover:bg-mk-tint2"
                    }`}
                  >
                    <FiList size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* عدّاد النتائج + شرائح الفلاتر المطبّقة */}
            <div className="mb-6 text-sm text-mk-muted">
              <ResultsCount
                count={pagination.total || paginated.length}
                label={t("coupons.coupons_suffix")}
              />

              <div className="flex flex-wrap gap-2 mt-3">
                {(() => {
                  const effectiveSort =
                    appliedCouponFilters.sortBy ??
                    (selectedFilter === "top_used" ? "most_used" : "newest");
                  const hasAny =
                    effectiveSort !== "newest" ||
                    appliedCouponFilters.merchantIds.length > 0 ||
                    appliedCouponFilters.couponTypes.length > 0 ||
                    appliedCouponFilters.discountMin != null;

                  const sortLabel =
                    effectiveSort === "most_used"
                      ? t("coupons.sort_most_used")
                      : effectiveSort === "highest_discount"
                        ? t("coupons.sort_highest_discount")
                        : t("coupons.sort_newest");

                  return (
                    <>
                      {effectiveSort !== "newest" && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-mk-tint text-mk-primary rounded-full text-xs font-medium">
                          {sortLabel}
                          <button
                            type="button"
                            onClick={() => {
                              setAppliedCouponFilters((p) => ({
                                ...p,
                                sortBy: undefined,
                              }));
                              setSelectedFilter("latest");
                              setCurrentPage(1);
                            }}
                            className="ml-1 hover:bg-mk-border-strong rounded-full p-0.5"
                          >
                            ×
                          </button>
                        </span>
                      )}

                      {appliedCouponFilters.couponTypes.map((ct) => (
                        <span
                          key={ct}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium"
                        >
                          {ct === "percentage"
                            ? t("coupons.type_percentage")
                            : t("coupons.type_fixed")}
                          <button
                            type="button"
                            onClick={() => {
                              setAppliedCouponFilters((p) => ({
                                ...p,
                                couponTypes: p.couponTypes.filter(
                                  (x) => x !== ct,
                                ),
                              }));
                              setCurrentPage(1);
                            }}
                            className="ml-1 hover:bg-orange-200 rounded-full p-0.5"
                          >
                            ×
                          </button>
                        </span>
                      ))}

                      {appliedCouponFilters.merchantIds.map((id) => {
                        const label =
                          merchantsList.find(
                            (m) => String(m?.id) === String(id),
                          )?.name ?? id;
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                          >
                            {String(label)}
                            <button
                              type="button"
                              onClick={() => {
                                setAppliedCouponFilters((p) => ({
                                  ...p,
                                  merchantIds: p.merchantIds.filter(
                                    (x) => x !== id,
                                  ),
                                }));
                                setCurrentPage(1);
                              }}
                              className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}

                      {appliedCouponFilters.discountMin != null && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-mk-tint2 text-mk-text-strong rounded-full text-xs font-medium">
                          {t("coupons.discount_min_tag", {
                            min: appliedCouponFilters.discountMin,
                          })}
                          <button
                            type="button"
                            onClick={() => {
                              setAppliedCouponFilters((p) => ({
                                ...p,
                                discountMin: undefined,
                              }));
                              setCurrentPage(1);
                            }}
                            className="ml-1 hover:bg-mk-border-strong/60 rounded-full p-0.5"
                          >
                            ×
                          </button>
                        </span>
                      )}

                      {hasAny && (
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedCouponFilters(defaultCouponFilters);
                            setDraftCouponFilters(defaultCouponFilters);
                            setSelectedFilter("latest");
                            setCurrentPage(1);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium hover:bg-red-200 transition-colors"
                        >
                          {t("coupons.clear_all")}
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Coupons Display — الهيكل يظهر للتحميل الأول فقط، أما «عرض
                المزيد» فيُبقي النتائج الحالية ظاهرة */}
            {isLoadingList && paginated.length === 0 ? (
              <SkeletonGrid
                count={8}
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
                    : "space-y-4"
                }
              />
            ) : paginated.length > 0 ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                    : "space-y-4"
                }
              >
                {paginated.map((coupon) => {
                  const isFav = isCouponFavorite(coupon.id);
                  /* شارة الخصم: نسبة مئوية → شارة متدرّجة، وأي صيغة أخرى
                     (مبلغ ثابت مثلاً) → شارة نصية بلا علامة «٪» */
                  const pctMatch = /^\s*(\d+(?:\.\d+)?)\s*%\s*$/.exec(coupon.discount || "");
                  const discountBadge = pctMatch ? (
                    <DiscountBadge percent={Number(pctMatch[1])} size="md" className="absolute end-3 top-3" />
                  ) : coupon.discount ? (
                    <span className="absolute end-3 top-3">
                      <Ribbon tone="hot">{coupon.discount}</Ribbon>
                    </span>
                  ) : null;
                  const favButton = (
                    <CornerButton
                      className="relative shrink-0 hover:text-mk-red"
                      label={
                        isFav
                          ? t("couponModal.removeFavorite")
                          : t("couponModal.addFavorite")
                      }
                      pressed={isFav}
                      disabled={toggleFavorite.isPending}
                      onClick={(e) => handleFavoriteClick(e, coupon.id)}
                    >
                      <HeartIcon size={15} filled={isFav} className={isFav ? "text-mk-red" : ""} />
                    </CornerButton>
                  );
                  const showButton = (
                    <span className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[linear-gradient(135deg,#FD671A,#E2560D)] px-4 text-[13px] font-extrabold text-white shadow-[0_10px_24px_-10px_rgba(226,86,13,0.95)] transition-transform group-hover/vivid:-translate-y-0.5">
                      {t("coupons.show_coupon")}
                      {coupon.couponCode && (
                        <span
                          dir="ltr"
                          className="rounded-full bg-white/20 px-2 py-1 font-mono text-[11.5px] tracking-widest"
                        >
                          {coupon.couponCode.slice(0, 3)}···
                        </span>
                      )}
                    </span>
                  );

                  return (
                  <div
                    key={coupon.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openCouponModal(coupon)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openCouponModal(coupon);
                      }
                    }}
                    className={`${VIVID_CARD} ${FOCUS} cursor-pointer ${
                      viewMode === "list" ? "!flex-row items-stretch" : ""
                    }`}
                  >
                    {viewMode === "list" ? (
                      /* ===== عرض القائمة ===== */
                      <>
                        <div className="relative flex w-[230px] min-w-[230px] flex-col justify-center gap-2 bg-[linear-gradient(150deg,#1B1150,#400198_60%,#6703EB)] p-4">
                          {discountBadge}
                          <span className="h-14 w-14 overflow-hidden rounded-mk-md bg-white/95 p-1.5">
                            <img
                              src={getCouponImage(coupon.logo)}
                              alt={coupon.storeName}
                              className="h-full w-full object-contain"
                            />
                          </span>
                          <span className="mk-clamp-1 text-[14px] font-extrabold text-white">
                            {stripHtml(coupon.storeName)}
                          </span>
                          <span className="mk-clamp-1 text-[11.5px] text-white/70">
                            {stripHtml(coupon.storeCategory)}
                          </span>
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-4">
                          <div className="min-w-0">
                            <h3 className="mk-clamp-2 m-0 mb-2 text-[15px] font-extrabold text-mk-text">
                              {stripHtml(coupon.offer)}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2">
                              <StatChips
                                compact
                                views={coupon.views}
                                shares={coupon.downloads}
                                copies={coupon.uses}
                              />
                              {coupon.rating > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#FDF4DE] px-2 py-1 text-[11px] font-bold text-[#8A6209]">
                                  ★ {coupon.rating}
                                </span>
                              )}
                              {coupon.uses > 0 && (
                                <Ribbon tone="muted" icon={<IoFlashOutline aria-hidden />}>
                                  {usedCountText(coupon.uses)}
                                </Ribbon>
                              )}
                              {coupon.expiry && (
                                <Ribbon tone="ending" icon={<IoCalendarOutline aria-hidden />}>
                                  {coupon.expiry}
                                </Ribbon>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-mk-border-strong pt-3">
                            {showButton}
                            {favButton}
                          </div>
                        </div>
                      </>
                    ) : (
                      /* ===== عرض الشبكة ===== */
                      <>
                        {/* ترويسة ملوّنة: شعار التاجر + شارة الخصم البارزة */}
                        <div className="relative flex items-center gap-3 bg-[linear-gradient(150deg,#1B1150,#400198_60%,#6703EB)] p-4 pb-6">
                          <span className="h-14 w-14 shrink-0 overflow-hidden rounded-mk-md bg-white/95 p-1.5">
                            <img
                              src={getCouponImage(coupon.logo)}
                              alt={coupon.storeName}
                              className="h-full w-full object-contain"
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="mk-clamp-1 block text-[14.5px] font-extrabold text-white">
                              {stripHtml(coupon.storeName)}
                            </span>
                            <span className="mk-clamp-1 block text-[11.5px] text-white/70">
                              {stripHtml(coupon.storeCategory)}
                            </span>
                          </span>
                          {discountBadge}
                        </div>

                        {/* حافة القصّ المسنّنة */}
                        <div aria-hidden className="relative -mt-3 h-5 w-full">
                          <img
                            src={cutCopon}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="flex flex-1 flex-col gap-2.5 p-4 pt-1">
                          <h4 className="mk-clamp-2 m-0 text-[15px] font-extrabold leading-snug text-mk-text">
                            {stripHtml(coupon.offer)}
                          </h4>

                          <div className="flex flex-wrap items-center gap-2">
                            <StatChips
                              compact
                              views={coupon.views}
                              shares={coupon.downloads}
                              copies={coupon.uses}
                            />
                            {coupon.rating > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#FDF4DE] px-2 py-1 text-[11px] font-bold text-[#8A6209]">
                                ★ {coupon.rating}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            {coupon.expiry && (
                              <Ribbon tone="ending" icon={<IoCalendarOutline aria-hidden />}>
                                {coupon.expiry}
                              </Ribbon>
                            )}
                            {coupon.uses > 0 && (
                              <Ribbon tone="muted" icon={<IoFlashOutline aria-hidden />}>
                                {usedCountText(coupon.uses)}
                              </Ribbon>
                            )}
                          </div>

                          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-mk-border-strong pt-3">
                            {showButton}
                            {favButton}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title={
                  search ? t("coupons.no_results", { search }) : t("coupons.no_coupons")
                }
                description=""
              />
            )}

            {/* Load More + Infinite Scroll */}
            {hasMore && (
              <div className="mt-10 flex flex-col items-center justify-center gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  loading={isLoadingMore}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  {isLoadingMore ? t("ui.loading", "جارٍ التحميل…") : t("ui.showMore", "عرض المزيد")}
                </Button>
                <div ref={loadMoreRef} className="h-px w-full" aria-hidden="true" />
              </div>
            )}
          </section>
        </>
      )}

      <GetStartedSection className="mt-16 mb-28" />
      </div>

      {selectedCoupon && (
        <CouponModal
          coupon={selectedCoupon}
          onClose={closeCouponModal}
          getLogoUrl={getLogoUrlForModal}
        />
      )}
    </>
  );
};

export default CouponsPage;
