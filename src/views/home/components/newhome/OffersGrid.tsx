"use client";

import { useEffect, useMemo, useState } from "react";
import { LuChevronRight, LuChevronLeft } from "react-icons/lu";
import { t } from "i18next";
import { CONTAINER } from "./tokens";
import SectionHead from "./SectionHead";
import Reveal from "./Reveal";
import { EmptyState, OfferTile, FOCUS, type OfferTileData } from "@ui";
import type { CategoryItem } from "./CategoriesBand";

interface Offer {
  id: number | string;
  slug?: string;
  name?: string;
  image?: string | null;
  discount_percent?: number | string | null;
  price_before?: number | string | null;
  price_after?: number | string | null;
  end_date?: string | null;
  category?: { id: number; name: string } | null;
  merchant?: { id: number; name: string; logo?: string | null } | null;
  /** إحصائيات العرض — تُعرض عند توفرها في مخرجات الـ API */
  views_count?: number | null;
  favorites_count?: number | null;
  shares_count?: number | null;
}

interface Props {
  /** عنوان القسم من لوحة التحكم «بناء واجهة الموقع» (فارغ = العنوان الافتراضي) */
  title?: string;
  /** إظهار رابط «عرض الكل» — يتحكم فيه الأدمن */
  showViewAll?: boolean;
  offers: Offer[];
  categories: CategoryItem[];
  activeCategory: number | string | null;
  onSelect: (id: number | string | null) => void;
}

const PER_PAGE = 5;

/** أحدث وأقوى العروض — تبويبات التصنيف + شبكة بطاقات */
const OffersGrid: React.FC<Props> = ({
  offers,
  categories,
  activeCategory,
  onSelect,
  title,
  showViewAll = true,
}) => {
  const [page, setPage] = useState(0);

  const tabs = [
    { id: null, name: t("home.categories_new.all", "الكل") },
    ...categories.slice(0, 5).map((c) => ({ id: c.id, name: c.name })),
  ];

  /** كل عروض التصنيف الحالي مقسّمة إلى بلوكات من ٥ */
  const pages = useMemo(() => {
    const list =
      activeCategory === null
        ? offers
        : offers.filter((offer) => offer.category?.id === activeCategory);
    const chunks: Offer[][] = [];
    for (let i = 0; i < list.length; i += PER_PAGE) {
      chunks.push(list.slice(i, i + PER_PAGE));
    }
    return chunks;
  }, [offers, activeCategory]);

  // تغيير التصنيف يعيدنا للبلوك الأول
  useEffect(() => setPage(0), [activeCategory]);

  const current = Math.min(page, Math.max(pages.length - 1, 0));
  const filtered = pages[current] ?? [];

  const ARROW = `flex h-11 w-11 items-center justify-center rounded-full border border-[#ECE9F5] bg-white text-[#400198] shadow-[0_4px_14px_rgba(46,16,101,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#C9BCEC] hover:bg-[#F2EFFA] ${FOCUS}`;

  return (
    <section className={`${CONTAINER} pt-12 sm:pt-14`} id="offers">
      <SectionHead
        eyebrow={t("home.offers_new.eyebrow", "مختارة لك")}
        title={title || t("home.offers_new.title", "أحدث وأقوى العروض")}
        subtitle={t(
          "home.offers_new.subtitle",
          "أقوى الخصومات المتاحة الآن لدى شركائنا — محدّثة يومياً.",
        )}
        linkLabel={showViewAll ? t("home.offers_new.all_link", "عرض جميع العروض") : undefined}
        linkTo={showViewAll ? "/offers" : undefined}
        className="!mb-6"
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="mk-scroll-x -mx-1 flex-1 gap-2 px-1 py-1">
          {tabs.map((tab) => {
            const active = activeCategory === tab.id;
            return (
              <button
                key={String(tab.id ?? "all")}
                onClick={() => onSelect(tab.id as number | string | null)}
                aria-pressed={active}
                className={`h-11 rounded-full border px-5 text-[13.5px] font-extrabold transition-all duration-200 ease-out ${FOCUS} ${
                  active
                    ? "border-transparent bg-grad-brand text-white shadow-mk-glow"
                    : "border-[#ECE9F5] bg-white text-[#4A4A63] hover:-translate-y-0.5 hover:border-[#C9BCEC] hover:text-[#400198] hover:shadow-[0_10px_22px_-14px_rgba(46,16,101,0.6)]"
                }`}
              >
                {tab.name}
              </button>
            );
          })}
        </div>

        {pages.length > 1 && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setPage((p) => (p + pages.length - 1) % pages.length)}
              aria-label={t("home.common.prev", "السابق")}
              className={ARROW}
            >
              <LuChevronLeft size={18} className="rtl:-scale-x-100" aria-hidden />
            </button>
            <span
              className="min-w-[46px] text-center text-[12.5px] font-bold text-[#9A99B0]"
              dir="ltr"
            >
              {current + 1} / {pages.length}
            </span>
            <button
              onClick={() => setPage((p) => (p + 1) % pages.length)}
              aria-label={t("home.common.next", "التالي")}
              className={ARROW}
            >
              <LuChevronRight size={18} className="rtl:-scale-x-100" aria-hidden />
            </button>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={t("ui.empty.offers", "لا توجد عروض مطابقة حالياً.")}
          description=""
          actionLabel={t("home.offers_new.all_link", "عرض جميع العروض")}
          actionTo="/offers"
          compact
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {filtered.map((offer, i) => (
            <Reveal key={offer.id} delay={i * 60} className="h-full">
              <OfferTile offer={offer as OfferTileData} highlight />
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
};

export default OffersGrid;
