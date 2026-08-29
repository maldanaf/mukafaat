"use client";

import { t } from "i18next";
import { Link } from "@/lib/router-compat";
import { CONTAINER, OfferTile, SectionHeader, SmartImage } from "@ui";
import { buildOfferUrl } from "@utils/offerUrl";
import type { LayoutSection, WebDisplayStyle } from "./types";

interface Props {
  section: LayoutSection;
}

/** أعمدة الشبكة لكل شكل عرض */
const GRID_CLASS: Record<string, string> = {
  grid_4: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
  grid_3: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
};

/**
 * قسم «عروض تصنيف» يضيفه الأدمن من شاشة «بناء واجهة الموقع».
 * العناصر تصل جاهزة داخل `layout` فلا حاجة لطلب إضافي،
 * والشكل (شبكة ٤/٣ أعمدة، شريط أفقي، قائمة) يختاره الأدمن.
 */
const CategoryOffersSection: React.FC<Props> = ({ section }) => {
  const offers = section.items ?? [];
  if (!offers.length) return null;

  const style = (section.display_style as WebDisplayStyle) || "grid_4";
  const title = section.title || t("homeBuilder.categoryOffers", "عروض مختارة");
  const viewAllHref = section.category_slug
    ? `/offers/${section.category_slug}`
    : section.category_id
      ? `/offers?category=${section.category_id}`
      : "/offers";

  const head = (
    <SectionHeader
      title={title}
      linkTo={section.show_view_all ? viewAllHref : undefined}
      linkLabel={section.show_view_all ? t("homeBuilder.viewAll", "عرض الكل") : undefined}
    />
  );

  if (style === "carousel") {
    return (
      <section className={`${CONTAINER} pt-11`}>
        {head}
        <div className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2">
          {offers.map((offer) => (
            <div key={offer.id} className="w-[260px] shrink-0 snap-start">
              <OfferTile offer={offer} highlight />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (style === "list") {
    return (
      <section className={`${CONTAINER} pt-11`}>
        {head}
        <div className="flex flex-col gap-3">
          {offers.map((offer) => (
            <Link
              key={offer.id}
              to={buildOfferUrl(offer as any)}
              className="group mk-lift flex items-center gap-4 rounded-mk-xl border border-[#EFEDF7] bg-white p-3 shadow-mk-card hover:border-[#DED7F2]"
            >
              <div className="mk-zoom h-[76px] w-[110px] shrink-0 overflow-hidden rounded-mk-md bg-[#F2EFFA]">
                <SmartImage
                  src={offer.image}
                  name={offer.name ?? ""}
                  className="h-full w-full"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-[15px] font-extrabold text-[#1A1A2E] transition-colors duration-200 group-hover:text-[#400198]">
                  {offer.name}
                </p>
                <p className="line-clamp-1 text-[12px] text-[#9A99B0]">
                  {offer.merchant?.name || offer.category?.name || ""}
                </p>
              </div>
              {Number(offer.discount_percent ?? 0) > 0 && (
                <span
                  dir="ltr"
                  className="mk-shine shrink-0 rounded-full bg-grad-accent px-3 py-1.5 text-[13px] font-extrabold text-white shadow-mk-badge"
                >
                  {Math.round(Number(offer.discount_percent))}%
                </span>
              )}
            </Link>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={`${CONTAINER} pt-11`}>
      {head}
      <div className={GRID_CLASS[style] ?? GRID_CLASS.grid_4}>
        {offers.map((offer) => (
          <OfferTile key={offer.id} offer={offer} highlight />
        ))}
      </div>
    </section>
  );
};

export default CategoryOffersSection;
