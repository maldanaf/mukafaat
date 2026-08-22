"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import { LuChevronRight, LuChevronLeft } from "react-icons/lu";
import { t } from "i18next";
import { CONTAINER, pick } from "./tokens";
import SectionHead from "./SectionHead";
import BrandImage from "./BrandImage";
import { buildOfferUrl } from "@utils/offerUrl";
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
}

interface Props {
  offers: Offer[];
  categories: CategoryItem[];
  activeCategory: number | string | null;
  onSelect: (id: number | string | null) => void;
}

const PER_PAGE = 5;

const percentOf = (offer: Offer): number => {
  const raw = Number(offer.discount_percent ?? 0);
  if (raw > 0) return Math.round(raw);
  const before = Number(offer.price_before ?? 0);
  const after = Number(offer.price_after ?? 0);
  if (before > 0 && after > 0 && after < before) {
    return Math.round(((before - after) / before) * 100);
  }
  return 0;
};

const expiryLabel = (endDate?: string | null): string => {
  if (!endDate) return "";
  const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  if (Number.isNaN(days)) return "";
  if (days < 0) return t("home.offers_new.ended", "انتهى");
  if (days === 0) return t("home.offers_new.today", "ينتهي اليوم");
  return `${t("home.offers_new.ends_in", "ينتهي بعد")} ${days} ${t("home.offers_new.days", "يوم")}`;
};

/** أحدث وأقوى العروض — تبويبات التصنيف + شبكة بطاقات */
const OffersGrid: React.FC<Props> = ({ offers, categories, activeCategory, onSelect }) => {
  const [page, setPage] = useState(0);

  const tabs = [{ id: null, name: t("home.categories_new.all", "الكل") }, ...categories.slice(0, 5).map((c) => ({ id: c.id, name: c.name }))];

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

  return (
    <section className={`${CONTAINER} pt-11`}>
      <SectionHead
        eyebrow={t("home.offers_new.eyebrow", "مختارة لك")}
        title={t("home.offers_new.title", "أحدث وأقوى العروض")}
        linkLabel={t("home.offers_new.all_link", "عرض جميع العروض")}
        linkTo="/offers"
      />

      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const active = activeCategory === tab.id;
            return (
              <button
                key={String(tab.id ?? "all")}
                onClick={() => onSelect(tab.id as number | string | null)}
                className={`h-[38px] rounded-full border px-[18px] text-[13px] font-semibold transition-colors ${
                  active
                    ? "border-[#4C1D95] bg-[#4C1D95] text-white"
                    : "border-[#E9E4F5] bg-white text-[#4A4459] hover:border-[#C9BCEC]"
                }`}
              >
                {tab.name}
              </button>
            );
          })}
        </div>

        {pages.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => (p + pages.length - 1) % pages.length)}
              aria-label="prev-offers"
              className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-[#E9E4F5] bg-white text-[#4C1D95] transition-all hover:border-[#C9BCEC] hover:bg-[#F6F3FC]"
            >
              <LuChevronRight size={18} />
            </button>
            <span className="min-w-[42px] text-center text-[12.5px] font-semibold text-[#8B84A0]" dir="ltr">
              {current + 1} / {pages.length}
            </span>
            <button
              onClick={() => setPage((p) => (p + 1) % pages.length)}
              aria-label="next-offers"
              className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-[#E9E4F5] bg-white text-[#4C1D95] transition-all hover:border-[#C9BCEC] hover:bg-[#F6F3FC]"
            >
              <LuChevronLeft size={18} />
            </button>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-[18px] border border-[#EDE9F7] bg-white p-8 text-center text-[14px] text-[#6B6480]">
          {t("home.offers_new.empty", "لا توجد عروض في هذا التصنيف حالياً.")}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {filtered.map((offer, i) => {
            const color = pick(i + 1);
            const percent = percentOf(offer);
            return (
              <Link
                key={offer.id}
                to={buildOfferUrl(offer)}
                className="overflow-hidden rounded-[18px] border border-[#EDE9F7] bg-white transition-shadow hover:shadow-[0_12px_30px_rgba(46,16,101,0.10)]"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-[#EDE9F7] bg-[#F6F3FC]">
                  <BrandImage
                    src={offer.image}
                    name={offer.name ?? ""}
                    variant="name"
                    className="h-full w-full text-[26px]"
                    bg="#F6F3FC"
                  />
                  {offer.merchant?.name && (
                    <span className="absolute bottom-2 start-2 rounded-lg bg-white/95 px-2.5 py-1 text-[12px] font-bold text-[#2E1065]">
                      {offer.merchant.name}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="line-clamp-1 text-[14px] font-semibold text-[#17122A]">
                      {offer.name}
                    </span>
                    {percent > 0 && (
                      <span className="text-[20px] font-bold" style={{ color: color.c }}>
                        {percent}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[12px] text-[#8B84A0]">
                    <span className="line-clamp-1">{offer.category?.name ?? ""}</span>
                    <span className="shrink-0">{expiryLabel(offer.end_date)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default OffersGrid;
