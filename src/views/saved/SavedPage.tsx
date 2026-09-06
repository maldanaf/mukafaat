"use client";

import React, { useState, useMemo } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useUserStore } from "@stores/userStore";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@hooks";
import { IoTrashOutline } from "react-icons/io5";
import { useFavorites, useFavoriteToggle } from "@hooks/api/useMokafaatQueries";
import {
  normalizeFavoritesList,
  type NormalizedFavorite,
} from "@utils/favorites";
import { toast } from "react-toastify";
import {
  EmptyState,
  ErrorState,
  PageHero,
  PriceTag,
  Skeleton,
  SkeletonGrid,
  StatChips,
  SmartImage,
  Ratio,
  HeartIcon,
  FOCUS,
} from "@ui";
import {
  VIVID_CARD,
  VIVID_MEDIA,
  VIVID_SCRIM,
  Ribbon,
  CornerButton,
  Chip,
  ChipBar,
  ResultsCount,
  PanelHero,
  type RibbonTone,
} from "@views/offers/components/CatalogKit";
import { useHydrated } from "@hooks/useHydrated";

const SavedPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isRTL = useIsRTL();
  const token = useUserStore((s) => s.token);
  const {
    data: favoritesData,
    isLoading,
    isError,
    refetch,
  } = useFavorites();
  const toggleMutation = useFavoriteToggle();

  const [filter, setFilter] = useState<
    "all" | "offer" | "card" | "coupon" | "merchant" | "booking"
  >("all");

  const items = useMemo(
    () => normalizeFavoritesList(favoritesData ?? null),
    [favoritesData],
  );
  const filteredItems = useMemo(
    () =>
      filter === "all" ? items : items.filter((item) => item.type === filter),
    [items, filter],
  );

  const handleRemove = (item: NormalizedFavorite) => {
    toggleMutation.mutate(
      { favorable_type: item.favorable_type, favorable_id: item.favorable_id },
      {
        onSuccess: () => {
          refetch();
          toast.success(
            t("cards.t_347f37", "تمت إزالته من المفضلة"),
          );
        },
        onError: () => toast.error(t("saved.t_348424", "فشل في التحديث")),
      },
    );
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "offer":
        return t("saved.types.offer");
      case "card":
        return t("saved.types.card");
      case "coupon":
        return t("saved.types.coupon");
      case "booking":
        return t("saved.types.booking");
      case "merchant":
        return t("saved.types.merchant", "متجر");
      default:
        return t("saved.types.item");
    }
  };

  /** لون شارة النوع — من نغمات الاتجاه البصري الجديد */
  const getTypeTone = (type: string): RibbonTone => {
    switch (type) {
      case "offer":
        return "hot";
      case "card":
        return "vip";
      case "coupon":
        return "new";
      case "booking":
        return "ending";
      case "merchant":
        return "free";
      default:
        return "muted";
    }
  };

  const getItemPath = (item: NormalizedFavorite): string | null => {
    const idStr = String(item.favorable_id);
    switch (item.type) {
      case "offer": {
        const cat = item.categorySlug || item.category || "offers";
        const merchant = item.merchantSlug || item.companyId;
        const offer = item.itemSlug || idStr;
        if (merchant) return `/offers/${cat}/${merchant}/${offer}`;
        return null;
      }
      case "card": {
        const merchant = item.merchantSlug || item.companyId;
        const card = item.itemSlug || idStr;
        if (merchant) return `/cards/${merchant}/${card}`;
        return null;
      }
      case "booking": {
        const type = item.bookingType || "hotel";
        const slug = item.itemSlug || idStr;
        return `/bookings/${type}/${slug}`;
      }
      case "coupon":
        return `/coupons?coupon=${idStr}`;
      case "merchant": {
        const merchant =
          item.itemSlug || item.merchantSlug || item.companyId || idStr;
        return `/offers/all/${merchant}`;
      }
      default:
        return null;
    }
  };

  const handleItemClick = (item: NormalizedFavorite) => {
    const path = getItemPath(item);
    if (path) navigate(path);
  };

  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <div className="px-4 py-8" role="status" aria-label="loading">
        <Skeleton className="mb-6 h-24 w-full rounded-mk-lg" />
        <SkeletonGrid
          count={4}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
        />
      </div>
    );
  }

  if (!token) {
    return (
      <div
        className="min-h-screen bg-mk-tint3 pt-24 pb-28 flex items-center justify-center px-4"
        style={{ marginTop: "77px" }}
      >
        <EmptyState
          className="max-w-md"
          icon={<HeartIcon size={28} />}
          title={t("ui.loginRequired.title", t("orders.t_4f66ec", "تسجيل الدخول مطلوب"))}
          description={
            t("saved.t_dc2e4a", "سجّل دخولك لعرض المفضلة")
          }
          actionLabel={t("ui.loginRequired.cta", t("orders.t_8c6117", "تسجيل الدخول"))}
          actionTo="/login?returnUrl=/saved"
        />
      </div>
    );
  }

  const filterOptions = [
    { key: "all" as const, label: t("saved.filters.all"), count: items.length },
    {
      key: "offer" as const,
      label: t("saved.filters.offers"),
      count: items.filter((i) => i.type === "offer").length,
    },
    {
      key: "card" as const,
      label: t("saved.filters.cards"),
      count: items.filter((i) => i.type === "card").length,
    },
    {
      key: "coupon" as const,
      label: t("saved.filters.coupons", "الكوبونات"),
      count: items.filter((i) => i.type === "coupon").length,
    },
    {
      key: "merchant" as const,
      label: t("saved.filters.stores", "المتاجر"),
      count: items.filter((i) => i.type === "merchant").length,
    },
    {
      key: "booking" as const,
      label: t("saved.filters.bookings", "الحجوزات"),
      count: items.filter((i) => i.type === "booking").length,
    },
  ];

  return (
    <div
      className="min-h-screen bg-mk-tint3 pt-8 pb-28"
      style={{ marginTop: "77px" }}
    >
      <div className="container mx-auto px-4">
        {/* ترويسة الصفحة — تدرّج بنفسجي + وصف + مسار تنقّل */}
        <PanelHero
          className="mb-6"
          eyebrow={t("saved.eyebrow", "مكتبتك")}
          title={t("saved.title")}
          subtitle={t("saved.subtitle", { count: items.length })}
          crumbs={[
            { label: t("home.navbar.home", "الرئيسية"), to: "/" },
            { label: t("saved.title") },
          ]}
          icon={<HeartIcon size={24} filled />}
        />

        {isLoading ? (
          <SkeletonGrid
            count={8}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
          />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <>
            {/* شريط الفلاتر — شرائح قابلة للتمرير + عدّاد النتائج */}
            <div className="mb-6 flex flex-col gap-3 rounded-mk-lg border border-mk-border bg-white p-3.5 shadow-mk-card">
              <ChipBar label={t("ui.filters", "الفلاتر")}>
                {filterOptions.map((opt) => (
                  <Chip
                    key={opt.key}
                    active={filter === opt.key}
                    count={opt.count}
                    onClick={() => setFilter(opt.key)}
                  >
                    {opt.label}
                  </Chip>
                ))}
              </ChipBar>
              <ResultsCount
                count={filteredItems.length}
                label={t("saved.results_suffix", "عنصر محفوظ")}
              />
            </div>

            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {filteredItems.map((item) => {
                  const path = getItemPath(item);
                  const isClickable = path != null;
                  const label = item.title[isRTL ? "ar" : "en"];
                  return (
                    <div
                      key={item.id}
                      role={isClickable ? "button" : undefined}
                      tabIndex={isClickable ? 0 : undefined}
                      onClick={() => isClickable && handleItemClick(item)}
                      onKeyDown={(e) => {
                        if (isClickable && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          handleItemClick(item);
                        }
                      }}
                      className={`${VIVID_CARD} ${FOCUS} ${isClickable ? "cursor-pointer" : ""}`}
                    >
                      <div className={VIVID_MEDIA}>
                        <Ratio ratio="aspect-[16/10]">
                          <SmartImage src={item.image} name={label} alt={label} variant="name" />
                        </Ratio>
                        <span aria-hidden className={VIVID_SCRIM} />

                        <span className="absolute start-2.5 top-2.5 z-[2]">
                          <Ribbon tone={getTypeTone(item.type)}>{getTypeLabel(item.type)}</Ribbon>
                        </span>

                        <CornerButton
                          className="absolute end-2 top-2 z-[2] hover:text-mk-red"
                          label={t("saved.remove", "إزالة من المفضلة")}
                          disabled={toggleMutation.isPending}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemove(item);
                          }}
                        >
                          <IoTrashOutline className="h-4 w-4 text-mk-red" />
                        </CornerButton>
                      </div>

                      <div className="flex flex-1 flex-col gap-2 p-4">
                        <h3 className="mk-clamp-2 m-0 text-[15px] font-extrabold leading-snug text-mk-text">
                          {label}
                        </h3>

                        {(item.price != null || item.originalPrice != null) && (
                          <PriceTag
                            price={item.price}
                            priceBefore={item.originalPrice}
                            size="lg"
                            stacked
                          />
                        )}

                        <StatChips
                          compact
                          views={item.viewsCount}
                          favorites={item.favoritesCount}
                          shares={item.sharesCount}
                        />

                        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-mk-divider pt-3">
                          <span className="text-[11px] text-mk-faint">
                            {t("saved.saved_since")}{" "}
                            {new Date(item.savedAt).toLocaleDateString(isRTL ? "ar-SA" : "en-US")}
                          </span>
                          {isClickable && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-mk-tint px-3 py-1.5 text-[12px] font-extrabold text-mk-primary transition-colors group-hover/vivid:bg-mk-primary group-hover/vivid:text-white">
                              {t("saved.view_details", t("saved.t_932d8a", "عرض التفاصيل"))}
                              <span aria-hidden className="rtl:-scale-x-100">
                                &#8594;
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={<HeartIcon size={28} />}
                title={
                  filter === "all"
                    ? t("saved.empty.title")
                    : t("saved.empty.title_filtered", {
                        type: getTypeLabel(filter),
                      })
                }
                description={t("saved.empty.description")}
                actionLabel={t("saved.empty.browse_offers")}
                actionTo="/offers"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SavedPage;
