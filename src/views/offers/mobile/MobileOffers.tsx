"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import MobilePageHeader from "@components/mobile/MobilePageHeader";
import MobileChips from "@components/mobile/MobileChips";
import {
  OfferTile,
  SkeletonCard,
  EmptyState,
  ErrorState,
  type OfferTileData,
} from "@ui";
import { LuFlame } from "react-icons/lu";
import { useWebHome, useWebOffers } from "@hooks/api/useMokafaatQueries";

type Dict = Record<string, any>;

/** صفحة العروض — نسخة الموبايل بأسلوب التطبيق (الاتجاه الحيوي التجاري) */
const MobileOffers: React.FC = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<number | string | null>(null);

  const { data: homeData } = useWebHome();
  const categories: Dict[] = (homeData as Dict)?.data?.categories ?? [];

  const params = useMemo(
    () => ({
      per_page: 20,
      page: 1,
      ...(category ? { category_ids: String(category) } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
    }),
    [category, search],
  );

  const { data, isLoading, isError, refetch } = useWebOffers(params);
  const offers: Dict[] = (data as Dict)?.data?.offers ?? [];

  const chips = [
    { id: null, name: t("home.categories_new.all", "الكل") },
    ...categories.map((c) => ({ id: c.id as number, name: c.name as string })),
  ];

  return (
    <div className="min-h-screen overflow-x-clip bg-mk-bg pb-6 lg:hidden">
      <MobilePageHeader
        title={t("home.navbar.offers", "العروض")}
        subtitle={t("home.offers_new.title", "أحدث وأقوى العروض")}
        eyebrow={
          <>
            <LuFlame size={12} className="text-mk-accent-light" aria-hidden />
            {offers.length > 0
              ? t("ui.results_count", { count: offers.length })
              : t("home.hero_new.tag", "عروض مختارة")}
          </>
        }
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("home.search_new.placeholder", "ابحث عن عرض أو متجر...")}
      >
        <MobileChips chips={chips} active={category} onSelect={setCategory} />
      </MobilePageHeader>

      <div className="px-4 pt-5">
        {isLoading && (
          <div className="grid grid-cols-2 gap-3" role="status" aria-label="loading">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} ratio="aspect-[4/3]" />
            ))}
          </div>
        )}

        {!isLoading && isError && <ErrorState compact onRetry={() => refetch()} />}

        {!isLoading && !isError && offers.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {offers.map((offer) => (
              <OfferTile key={offer.id} offer={offer as OfferTileData} />
            ))}
          </div>
        )}

        {!isLoading && !isError && offers.length === 0 && (
          <EmptyState
            compact
            title={t("home.offers_new.empty", "لا توجد عروض مطابقة")}
            description={t("ui.empty.description", "جرّب تغيير الفلاتر أو عُد لاحقاً.")}
            actionLabel={search || category ? t("ui.clearFilters", "مسح الفلاتر") : undefined}
            onAction={() => {
              setSearch("");
              setCategory(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MobileOffers;
