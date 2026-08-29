"use client";

import { useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import MobilePageHeader from "@components/mobile/MobilePageHeader";
import {
  SmartImage,
  Ratio,
  PriceTag,
  SkeletonCard,
  EmptyState,
  ErrorState,
  Badge,
  FOCUS,
} from "@ui";
import { LuCreditCard } from "react-icons/lu";
import { useWebCards } from "@hooks/api/useMokafaatQueries";

type Dict = Record<string, any>;

/** صفحة البطاقات الرقمية — نسخة الموبايل (الاتجاه الحيوي التجاري) */
const MobileCards: React.FC = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const params = useMemo(
    () => ({ per_page: 30, page: 1, ...(search.trim() ? { search: search.trim() } : {}) }),
    [search],
  );

  const { data, isLoading, isError, refetch } = useWebCards(params);
  const cards: Dict[] = (data as Dict)?.data?.cards ?? (data as Dict)?.data?.data ?? [];

  /** نسبة الخصم إن وُجد سعر قبل الخصم */
  const discountOf = (card: Dict): number => {
    const before = Number(card?.price_before ?? 0);
    const after = Number(card?.price ?? 0);
    if (before > 0 && after > 0 && after < before) {
      return Math.round(((before - after) / before) * 100);
    }
    return 0;
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-mk-bg pb-6 lg:hidden">
      <MobilePageHeader
        title={t("home.navbar.cards", "البطاقات الرقمية")}
        subtitle={t("home.services_new.cards.body", "بطاقات ألعاب وترفيه وتسوق تصلك فوراً")}
        eyebrow={
          <>
            <LuCreditCard size={12} className="text-mk-accent-light" aria-hidden />
            {cards.length > 0
              ? t("ui.results_count", { count: cards.length })
              : t("home.hero_new.tag", "عروض مختارة")}
          </>
        }
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("home.search_new.placeholder", "ابحث عن بطاقة...")}
      />

      <div className="px-4 pt-5">
        {isLoading && (
          <div className="grid grid-cols-2 gap-3" role="status" aria-label="loading">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {!isLoading && isError && <ErrorState compact onRetry={() => refetch()} />}

        {!isLoading && !isError && cards.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {cards.map((card) => {
              const percent = discountOf(card);
              return (
                <Link
                  key={card.id}
                  to={`/cards/${card.slug ?? card.id}`}
                  className={`mk-lift mk-zoom flex flex-col overflow-hidden rounded-mk-lg border border-mk-border bg-white shadow-mk-card active:scale-[0.98] ${FOCUS}`}
                >
                  <div className="relative border-b border-mk-border bg-mk-tint2">
                    <Ratio ratio="aspect-[16/10]">
                      <SmartImage
                        src={card.image}
                        name={card.title ?? card.name ?? ""}
                        alt={card.title ?? card.name ?? ""}
                        variant="name"
                        bg="#F2EFFA"
                      />
                    </Ratio>
                    {percent > 0 && (
                      <span className="absolute start-2 top-2">
                        <Badge tone="grad-accent" size="sm">
                          {percent}%
                        </Badge>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5 p-2.5">
                    <span className="mk-clamp-2 text-[12.5px] font-bold leading-snug text-mk-text">
                      {card.title ?? card.name}
                    </span>
                    {card.price != null && Number(card.price) > 0 && (
                      <PriceTag
                        size="sm"
                        className="mt-auto"
                        price={card.price}
                        priceBefore={card.price_before}
                      />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {!isLoading && !isError && cards.length === 0 && (
          <EmptyState
            compact
            title={t("ui.empty.cards", "لا توجد بطاقات متاحة حالياً.")}
            description={t("ui.empty.description", "جرّب تغيير الفلاتر أو عُد لاحقاً.")}
            actionLabel={search ? t("ui.clearFilters", "مسح الفلاتر") : undefined}
            onAction={() => setSearch("")}
          />
        )}
      </div>
    </div>
  );
};

export default MobileCards;
