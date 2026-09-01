"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "@/lib/router-compat";
import { useLoadMoreOnScroll } from "@hooks/useLoadMoreOnScroll";
import { Helmet } from "@/lib/helmet-compat";
import { useTranslation } from "react-i18next";
import { FiFilter, FiGrid, FiList, FiSearch, FiX } from "react-icons/fi";
import { offerCategories, type Offer } from "@data/offers";
import {
  CONTAINER,
  PageHero,
  Button,

  EmptyState,
  ErrorState,
  SkeletonGrid,
  Skeleton,
  FOCUS,
} from "@ui";
import GetStartedSection from "@views/home/components/GetStartedSection";
import FilterSidebar, { type FilterState } from "../components/FilterSidebar";
import OfferCard from "../components/OfferCard";
import MerchantCard, { type MerchantSummary } from "../components/MerchantCard";
import OfferCardHorizontal from "../components/OfferCardHorizontal";
import CategoryCard from "@components/CategoryCard";
import { PinnedChipsBar, pick } from "@ui";
import usePinnedUnderHeader from "@hooks/usePinnedUnderHeader";
import {
  useWebHome,
  useFilters,
  useWebOffers,
  useMerchants,
} from "@hooks/api/useMokafaatQueries";
import { mapApiOffersToModels } from "@network/mappers/offersMapper";
import { API_BASE_URL } from "@config/api";
import { buildWebOffersParams } from "@utils/webFilters";
import { buildOfferUrl } from "@utils/offerUrl";

function buildCategoryIconUrl(
  icon: string | undefined,
  fallback: string,
): string {
  if (!icon || typeof icon !== "string") return fallback;
  let url = icon.trim();
  if (url.includes("/storage/https://")) {
    const i = url.indexOf("/storage/https://");
    url =
      url.substring(0, i + "/storage".length) +
      url.substring(i + "/storage/https://".length);
  }
  if (url && !url.startsWith("http")) {
    url = url.startsWith("/")
      ? `${API_BASE_URL}${url}`
      : `${API_BASE_URL}/storage/${url}`;
  }
  return url || fallback;
}

/** شريحة فلتر مطبَّق مع زر إزالة — شكل واحد لكل أنواع الفلاتر */
const FilterChip: React.FC<{ label: string; onRemove: () => void }> = ({
  label,
  onRemove,
}) => (
  <span className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-mk-tint px-3 text-[12px] font-semibold text-mk-primary">
    <span className="max-w-[190px] truncate">{label}</span>
    <button
      type="button"
      onClick={onRemove}
      aria-label={`${label} ×`}
      className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-white/70"
    >
      <FiX size={13} aria-hidden />
    </button>
  </span>
);

const CategoryOffersPage = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeSubSlug = searchParams.get("subcategory") || "";
  const { t, i18n } = useTranslation();
  const langBase = i18n.language?.split("-")[0] || "en";

  const [search, setSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<FilterState | null>(
    null,
  );
  const perPage = 12;

  const { data: webHomeResponse, isLoading: isWebHomeLoading } = useWebHome();

  /** هيكل تحميل الصفحة بنفس أبعاد الأقسام (بلا قفزات تخطيط) */
  const CategoryPageSkeleton = () => (
    <div className="min-h-screen bg-mk-bg">
      <div className="bg-[linear-gradient(150deg,#1B1150_0%,#400198_55%,#6703EB_100%)] py-10">
        <div className={CONTAINER}>
          <Skeleton className="h-9 w-64 bg-white/20" />
          <Skeleton className="mt-3 h-4 w-80 bg-white/15" />
        </div>
      </div>
      <div className={`${CONTAINER} py-8`}>
        <Skeleton className="mb-6 h-[68px] w-full rounded-mk-lg" />
        <SkeletonGrid count={8} className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" />
      </div>
    </div>
  );

  // استخراج categoryId من API قبل أي استخدام (مطلوب لـ useFilters)
  const categoryId = useMemo(() => {
    if (!category || !webHomeResponse) return null;
    const res = webHomeResponse as Record<string, unknown>;
    const data = res?.data as Record<string, unknown> | undefined;
    const cats = data?.categories as Array<Record<string, unknown>> | undefined;
    const apiCat = Array.isArray(cats)
      ? cats.find((c) => String(c?.slug ?? "") === category)
      : undefined;
    return typeof apiCat?.id === "number" ? apiCat.id : null;
  }, [category, webHomeResponse]);

  const { data: filtersResponse } = useFilters(categoryId);
  const filterOptions = useMemo(() => {
    if (!filtersResponse)
      return { sortOptions: [], subcategories: [], offerTypes: [], brands: [] };
    const res = filtersResponse as Record<string, unknown>;
    const data = res?.data as Record<string, unknown> | undefined;
    const inner = data?.data as Record<string, unknown> | undefined;
    if (!inner)
      return { sortOptions: [], subcategories: [], offerTypes: [], brands: [] };
    return {
      sortOptions:
        (inner.sort_options as Array<{ key: string; name: string }>) ?? [],
      subcategories:
        (inner.subcategories as Array<{ id: number; name: string }>) ?? [],
      offerTypes:
        (inner.offer_types as Array<{ id: number; name: string }>) ?? [],
      brands: (inner.brands as Array<{ id: number; name: string }>) ?? [],
    };
  }, [filtersResponse]);

  // Category info: from API categories or fallback to offerCategories
  // العرض في الـ breadcrumb والهيدر يكون دائماً الـ name وليس الـ slug
  const categoryInfo = useMemo(() => {
    const fallback = offerCategories.find((cat) => cat.key === category);
    if (!webHomeResponse) return fallback ?? null;
    const res = webHomeResponse as Record<string, unknown>;
    const data = res?.data as Record<string, unknown> | undefined;
    const cats = data?.categories as Array<Record<string, unknown>> | undefined;
    const apiCat = Array.isArray(cats)
      ? cats.find((c) => String(c?.slug ?? "") === category)
      : undefined;
    if (!apiCat) return fallback ?? null;
    const nameAr = String(
      apiCat.name_ar ?? apiCat.name ?? apiCat.title ?? "",
    ).trim();
    const nameEn = String(
      apiCat.name_en ?? apiCat.name ?? apiCat.title ?? "",
    ).trim();
    const ar = nameAr || (fallback?.ar as string) || "";
    const en = nameEn || (fallback?.en as string) || "";
    const iconRaw = apiCat.image ?? apiCat.image_url;
    const icon = buildCategoryIconUrl(
      typeof iconRaw === "string" ? iconRaw : undefined,
      fallback?.icon ?? "",
    );
    return {
      key: category!,
      id: typeof apiCat.id === "number" ? apiCat.id : undefined,
      ar,
      en,
      icon,
      color: fallback?.color ?? "#400198",
    };
  }, [category, webHomeResponse]);

  // مزامنة الـ URL `?subcategory=<slug>` مع `appliedFilters.subcategoryIds`
  // single-select: لو القيمة موجودة بالـ URL نطبّقها كفلتر واحد، وإلا نمسحه
  useEffect(() => {
    // نحتاج أولاً قائمة subcategories لنحول slug → id
    if (!webHomeResponse) return;
    const res = webHomeResponse as Record<string, unknown>;
    const data = res?.data as Record<string, unknown> | undefined;
    const cats = data?.categories as Array<Record<string, unknown>> | undefined;
    const mainCat = cats?.find((c) => String(c?.slug ?? "") === category);
    const subs = (mainCat?.subcategories as Array<{ id: number; slug?: string }>) ?? [];
    const matched = activeSubSlug
      ? subs.find((s) => String(s?.slug ?? "") === activeSubSlug)
      : null;

    let didChange = false;
    setAppliedFilters((prev) => {
      const base = prev ?? {
        sortBy: "nearest" as const,
        subcategoryIds: [],
        offerTypeIds: [],
        brandIds: [],
        priceRange: {},
      };
      const ids = matched?.id ? [matched.id] : [];
      // تجنّب re-render لو نفس الـids
      if (
        base.subcategoryIds.length === ids.length &&
        base.subcategoryIds.every((id, i) => id === ids[i])
      ) {
        return prev;
      }
      didChange = true;
      return { ...base, subcategoryIds: ids };
    });
    // فقط لو الـsubcategory فعلاً تغيرت — لا نريد reset عند background refetch
    if (didChange) setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubSlug, webHomeResponse, category]);

  // التصنيفات الفرعية للتصنيف الحالي من API (data.categories[].subcategories)
  const apiSubcategories = useMemo(() => {
    if (!category || !webHomeResponse) return [];
    const res = webHomeResponse as Record<string, unknown>;
    const data = res?.data as Record<string, unknown> | undefined;
    const cats = data?.categories as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(cats)) return [];
    const mainCat = cats.find((c) => String(c?.slug ?? "") === category);
    const sub = mainCat?.subcategories as
      | Array<{
          id?: number;
          name?: string;
          slug?: string;
          image?: string | null;
        }>
      | undefined;
    if (!Array.isArray(sub) || sub.length === 0) return [];
    const fallbackIcon = (categoryInfo?.icon as string) ?? "";
    return sub
      .map((s) => {
        const icon = buildCategoryIconUrl(
          typeof s.image === "string" ? s.image : undefined,
          fallbackIcon,
        );
        return {
          id: s.id ?? 0,
          name: String(s.name ?? ""),
          slug: String(s.slug ?? ""),
          icon,
        };
      })
      .filter((s) => s.name && s.slug);
  }, [category, webHomeResponse, categoryInfo?.icon]);

  // Restaurants from API (offers grouped by merchant) or fallback to static data
  // Note: This page now uses server-side filtering via /api/web/offers.

  // قائمة العروض المسطحة للتصنيف (عروض فقط بدون تجميع حسب متجر)
  const webOffersParams = useMemo(
    () =>
      buildWebOffersParams({
        categoryIds: categoryId != null ? [categoryId] : undefined,
        search,
        sortBy:
          appliedFilters?.sortBy && appliedFilters.sortBy !== "nearest"
            ? appliedFilters.sortBy
            : undefined,
        subcategoryIds: appliedFilters?.subcategoryIds,
        brandIds: appliedFilters?.brandIds,
        offerTypeIds: appliedFilters?.offerTypeIds,
        priceMin: appliedFilters?.priceRange?.min,
        priceMax: appliedFilters?.priceRange?.max,
        perPage,
        page: currentPage,
      }),
    [categoryId, search, appliedFilters, perPage, currentPage],
  );

  const {
    data: webOffersRes,
    isLoading: isOffersLoading,
    isError: isOffersError,
    refetch: refetchOffers,
  } = useWebOffers(webOffersParams, { enabled: categoryId != null });

  /**
   * متاجر التصنيف — هي ما تعرضه الصفحة الآن بدل العروض.
   *
   * اعتماد المنصة على الخصومات الدائمة المتّفق عليها مع المتاجر، فصار
   * المتجر هو وحدة التصفّح: التصنيف يعرض متاجره، والمتجر يعرض خصوماته
   * ثم عروضه.
   */
  const {
    data: merchantsRes,
    isLoading: isMerchantsLoading,
    isError: isMerchantsError,
    refetch: refetchMerchants,
  } = useMerchants(
    { category_id: categoryId, per_page: 50, search: search || undefined },
    { enabled: categoryId != null },
  );

  const merchants: MerchantSummary[] = useMemo(() => {
    const root = (merchantsRes as Record<string, unknown>) ?? {};
    const data = (root.data as Record<string, unknown>) ?? root;
    const list = (data.merchants ?? data.data ?? data) as unknown;
    return Array.isArray(list) ? (list as MerchantSummary[]) : [];
  }, [merchantsRes]);

  function extractOffersArray(res: unknown): Array<Record<string, unknown>> {
    const root = (res as Record<string, unknown>) ?? {};
    const data =
      (root.data as Record<string, unknown>) ??
      (root as Record<string, unknown>);
    const offers = (data.offers ?? data.data ?? data) as unknown;
    return Array.isArray(offers)
      ? (offers as Array<Record<string, unknown>>)
      : [];
  }

  function extractPagination(res: unknown): {
    currentPage: number;
    lastPage: number;
    total: number;
  } {
    const root = (res as Record<string, unknown>) ?? {};
    const data =
      (root.data as Record<string, unknown>) ??
      (root as Record<string, unknown>);
    const pg =
      (data.pagination as Record<string, unknown> | undefined) ??
      (data.meta as Record<string, unknown> | undefined) ??
      (data as Record<string, unknown>);
    const currentPage = Number(pg?.current_page ?? pg?.page ?? 1) || 1;
    const lastPage = Number(pg?.last_page ?? pg?.pages ?? 1) || 1;
    const total = Number(pg?.total ?? 0) || 0;
    return { currentPage, lastPage, total };
  }

  const pageOffers = useMemo(
    () => mapApiOffersToModels(extractOffersArray(webOffersRes)),
    [webOffersRes],
  );

  const pagination = useMemo(
    () => extractPagination(webOffersRes),
    [webOffersRes],
  );

  // 🔁 Accumulate offers across pages (load-more / infinite scroll)
  const [accumulatedOffers, setAccumulatedOffers] = useState<typeof pageOffers>([]);
  const filterSignature = useMemo(
    () => JSON.stringify({ categoryId, search, appliedFilters }),
    [categoryId, search, appliedFilters],
  );
  const prevSigRef = useRef<string>("");
  /** صف التصنيفات الفرعية يتحوّل لشريط شرائح مثبّت تحت الهيدر عند تجاوزه */
  const subcategoriesRef = useRef<HTMLDivElement | null>(null);
  const subcategoriesPinned = usePinnedUnderHeader(subcategoriesRef);
  const lastIncorporatedPageRef = useRef<number>(0);
  const responsePage = pagination.currentPage || 0;
  const hasResponse = !!webOffersRes;

  // إعادة الضبط فقط عند تغيير الفلتر
  useEffect(() => {
    if (prevSigRef.current !== filterSignature) {
      prevSigRef.current = filterSignature;
      lastIncorporatedPageRef.current = 0;
      setAccumulatedOffers([]);
    }
  }, [filterSignature]);

  // دمج بيانات الصفحة لما تصل من الـAPI
  useEffect(() => {
    if (!hasResponse) return;
    if (responsePage <= lastIncorporatedPageRef.current) return;
    lastIncorporatedPageRef.current = responsePage;
    setAccumulatedOffers((prev) =>
      responsePage === 1 ? pageOffers : [...prev, ...pageOffers],
    );
  }, [hasResponse, pageOffers, responsePage]);

  const filteredOffers = accumulatedOffers;
  const hasMore = currentPage < (pagination.lastPage || 1);
  const isLoadingMore = currentPage > lastIncorporatedPageRef.current;

  const loadMoreRef = useLoadMoreOnScroll({
    hasMore,
    loading: isLoadingMore,
    loadMore: () => setCurrentPage((p) => p + 1),
  });

  const handleApplyFilters = (filters: FilterState) => {
    setAppliedFilters(filters);
    setCurrentPage(1);
  };

  /** هل يوجد أي فلتر مطبَّق؟ (يظهر زر «مسح الكل») */
  const hasActiveFilters = Boolean(
    appliedFilters &&
      (appliedFilters.sortBy !== "nearest" ||
        appliedFilters.subcategoryIds.length > 0 ||
        appliedFilters.offerTypeIds.length > 0 ||
        appliedFilters.brandIds.length > 0 ||
        appliedFilters.priceRange.min != null ||
        appliedFilters.priceRange.max != null),
  );

  if (!categoryInfo) {
    // أثناء التنقل بين التصنيفات قد تتأخر بيانات web/home أو categoryInfo لحظياً
    if (isWebHomeLoading || !webHomeResponse) {
      return <CategoryPageSkeleton />;
    }
    return (
      <div className={`${CONTAINER} flex min-h-[60vh] items-center justify-center py-16`}>
        <EmptyState
          title={t("categoryOffers.not_found")}
          description=""
          actionLabel={t("offerDetail.back_to_offers")}
          actionTo="/offers"
          className="w-full max-w-lg"
        />
      </div>
    );
  }

  const categoryDisplayName =
    langBase === "ar" ? categoryInfo.ar : categoryInfo.en;

  const totalPages = pagination.lastPage || 1;
  const paginatedOffers = filteredOffers;

  const handleOfferClick = (offer: Offer) => {
    navigate(buildOfferUrl({ ...offer, categorySlug: category }));
  };

  return (
    <>
      <Helmet>
        <title>
          {(categoryDisplayName || t("categoryOffers.category_fallback")) +
            " - " +
            t("offerDetail.offers_brand")}
        </title>
        <link
          rel="canonical"
          href={`https://mukafaat.com.sa/offers/${category}`}
        />
      </Helmet>

      {/* ترويسة الصفحة — نفس هيدر التطبيق: تدرّج بنفسجي + رجوع + مسار */}
      <PageHero
        backTo="/offers"
        crumbs={[
          { label: t("propertyDetail.breadcrumb.home"), to: "/" },
          { label: t("home.navbar.offers"), to: "/offers" },
          {
            label: categoryDisplayName || t("categoryOffers.category_fallback"),
          },
        ]}
        icon={
          categoryInfo?.icon ? (
            <img
              src={categoryInfo.icon as string}
              alt=""
              className="h-7 w-7 object-contain"
            />
          ) : undefined
        }
        title={categoryDisplayName || t("categoryOffers.category_fallback")}
        subtitle={
          categoryDisplayName
            ? t("categoryOffers.discover_in_category", { name: categoryDisplayName })
            : t("categoryOffers.discover_default")
        }
      />

      <section className={`${CONTAINER} bg-mk-bg py-6 md:py-9`}>
        {/* التصنيفات الفرعية من API - فوق شريط البحث والفلتر */}
        {apiSubcategories.length > 0 && (
          <div ref={subcategoriesRef} className="relative z-[1] mb-6">
            {/* التصنيفات الفرعية — single-select عبر URL */}
            <div className="flex flex-wrap justify-center gap-2">
              {apiSubcategories.map((sub) => {
                const isSelected = activeSubSlug === sub.slug;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      // اضغط نفسه مرة ثانية → إزالة الفلتر؛ غير ذلك انتقل لرابطه
                      const url = isSelected
                        ? `/offers/${category}`
                        : `/offers/${category}?subcategory=${encodeURIComponent(sub.slug)}`;
                      navigate(url);
                      setCurrentPage(1);
                    }}
                    className={`rounded-mk-md transition-all focus:outline-none focus:ring-2 focus:ring-[#400198]/30 min-w-[120px] ${
                      isSelected ? "" : "hover:bg-mk-tint3/80"
                    }`}
                  >
                    <CategoryCard
                      icon={sub.icon}
                      title={sub.name}
                      alt={sub.name}
                      selected={isSelected}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {apiSubcategories.length > 0 && (
          <PinnedChipsBar
            pinned={subcategoriesPinned}
            title={categoryDisplayName}
            items={apiSubcategories.map((sub, i) => ({
              id: sub.id,
              name: sub.name,
              image: sub.icon,
              color: pick(i).c,
              active: activeSubSlug === sub.slug,
              onClick: () => {
                navigate(
                  activeSubSlug === sub.slug
                    ? `/offers/${category}`
                    : `/offers/${category}?subcategory=${encodeURIComponent(sub.slug)}`,
                );
                setCurrentPage(1);
              },
            }))}
          />
        )}


        {/* شريط الأدوات — كرت أبيض واحد يجمع العدد والبحث والفلاتر */}
        <div className="mb-6 flex flex-col gap-3 rounded-mk-lg border border-mk-border bg-white p-3.5 shadow-mk-card lg:flex-row lg:items-center lg:justify-between">
          <p className="m-0 flex items-baseline gap-2 text-[13px] text-mk-muted">
            <span className="text-[26px] font-bold leading-none text-mk-primary">
              {pagination.total || filteredOffers.length}
            </span>
            {t("categoryOffers.offers_suffix")}
          </p>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* البحث */}
            <label className="relative flex min-w-[200px] flex-1 items-center lg:max-w-[320px]">
              <FiSearch
                aria-hidden
                className="pointer-events-none absolute start-3.5 text-mk-faint"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label={t("ui.searchPlaceholder", "ابحث…")}
                placeholder={t("categoryOffers.search_in", { name: categoryDisplayName })}
                className={`h-12 w-full rounded-mk-md border border-mk-border-2 bg-mk-tint3 ps-10 pe-4 text-[13.5px] text-mk-text outline-none transition-colors placeholder:text-mk-faint focus:border-mk-primary ${FOCUS}`}
              />
            </label>

            {/* الفلاتر */}
            <Button
              variant="outline"
              size="md"
              icon={<FiFilter />}
              onClick={() => setIsFilterOpen(true)}
            >
              {t("cardsPage.filter")}
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

        {/* شرائح الفلاتر المطبّقة */}
        {appliedFilters && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {appliedFilters.sortBy !== "nearest" && (
              <FilterChip
                label={
                  filterOptions.sortOptions.find((o) => o.key === appliedFilters.sortBy)?.name ??
                  appliedFilters.sortBy
                }
                onRemove={() =>
                  handleApplyFilters({ ...appliedFilters, sortBy: "nearest" as const })
                }
              />
            )}
            {appliedFilters.subcategoryIds.map((id) => (
              <FilterChip
                key={`sub-${id}`}
                label={
                  (apiSubcategories.find((sc) => sc.id === id) ??
                    filterOptions.subcategories.find((sc) => sc.id === id))?.name ?? String(id)
                }
                onRemove={() =>
                  handleApplyFilters({
                    ...appliedFilters,
                    subcategoryIds: appliedFilters.subcategoryIds.filter((v) => v !== id),
                  })
                }
              />
            ))}
            {appliedFilters.offerTypeIds.map((id) => (
              <FilterChip
                key={`type-${id}`}
                label={filterOptions.offerTypes.find((o) => o.id === id)?.name ?? String(id)}
                onRemove={() =>
                  handleApplyFilters({
                    ...appliedFilters,
                    offerTypeIds: appliedFilters.offerTypeIds.filter((v) => v !== id),
                  })
                }
              />
            ))}
            {appliedFilters.brandIds.map((id) => (
              <FilterChip
                key={`brand-${id}`}
                label={filterOptions.brands.find((b) => b.id === id)?.name ?? String(id)}
                onRemove={() =>
                  handleApplyFilters({
                    ...appliedFilters,
                    brandIds: appliedFilters.brandIds.filter((v) => v !== id),
                  })
                }
              />
            ))}
            {(appliedFilters.priceRange.min != null || appliedFilters.priceRange.max != null) && (
              <FilterChip
                label={
                  appliedFilters.priceRange.min != null && appliedFilters.priceRange.max != null
                    ? t("categoryOffers.price_range", {
                        min: appliedFilters.priceRange.min,
                        max: appliedFilters.priceRange.max,
                      })
                    : appliedFilters.priceRange.min != null
                      ? t("categoryOffers.price_min", { min: appliedFilters.priceRange.min })
                      : t("categoryOffers.price_max", { max: appliedFilters.priceRange.max! })
                }
                onRemove={() => handleApplyFilters({ ...appliedFilters, priceRange: {} })}
              />
            )}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() =>
                  handleApplyFilters({
                    sortBy: "nearest",
                    subcategoryIds: [],
                    offerTypeIds: [],
                    brandIds: [],
                    priceRange: {},
                  })
                }
                className={`inline-flex min-h-[36px] items-center gap-1 rounded-full bg-[#FDE9EB] px-3 text-[12px] font-semibold text-mk-red transition-colors hover:brightness-95 ${FOCUS}`}
              >
                {t("cardsPage.clearAll")}
              </button>
            )}
          </div>
        )}

        {/* النتائج: تحميل ← خطأ ← فراغ ← شبكة/قائمة.
            الهيكل للتحميل الأول فقط حتى لا تختفي النتائج عند «عرض المزيد» */}
        {isMerchantsLoading && merchants.length === 0 ? (
          <SkeletonGrid
            count={8}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
          />
        ) : isMerchantsError ? (
          <ErrorState onRetry={() => refetchMerchants()} />
        ) : merchants.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 grid-view">
            {merchants.map((m) => (
              <MerchantCard key={m.id} merchant={m} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={
              search
                ? t("categoryOffers.no_results", { search })
                : t("merchantCard.empty", "لا توجد متاجر في هذا التصنيف بعد")
            }
            description=""
            actionLabel={hasActiveFilters ? t("cardsPage.clearAll") : undefined}
            onAction={
              hasActiveFilters
                ? () =>
                    handleApplyFilters({
                      sortBy: "nearest",
                      subcategoryIds: [],
                      offerTypeIds: [],
                      brandIds: [],
                      priceRange: {},
                    })
                : undefined
            }
          />
        )}

        {/* Load More + Infinite Scroll Sentinel */}
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

      <GetStartedSection className="mt-16 mb-28" />

      {/* Filter Sidebar */}
      <FilterSidebar
        categoryId={categoryId}
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApplyFilters={handleApplyFilters}
        appliedFilters={appliedFilters}
      />
    </>
  );
};

export default CategoryOffersPage;
