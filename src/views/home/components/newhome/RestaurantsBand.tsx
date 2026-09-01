"use client";

import { Link } from "@/lib/router-compat";
import { t } from "i18next";
import { CONTAINER } from "./tokens";
import { FOCUS } from "@ui";
import SectionHead from "./SectionHead";
import BrandImage from "./BrandImage";
import Reveal from "./Reveal";
import { merchantUrl } from "@utils/merchantUrl";

interface Restaurant {
  id: number | string;
  slug?: string | null;
  category?: { slug?: string | null } | string | null;
  name: string;
  description?: string | null;
  logo?: string | null;
  cover_image?: string | null;
  discount?: number | string | null;
  branches_count?: number;
  rating?: number;
}

const RestaurantsBand: React.FC<{
  restaurants: Restaurant[];
  title?: string;
  showViewAll?: boolean;
}> = ({ restaurants, title, showViewAll = true }) => {
  if (!restaurants?.length) return null;

  return (
    <section className="mt-12 bg-grad-warm py-[56px]">
      <div className={CONTAINER}>
        <SectionHead
          eyebrow={t("home.restaurants_new.eyebrow", "مطاعم مميزة")}
          eyebrowColor="#D9500B"
          title={title || t("home.restaurants_new.title", "أفضل المطاعم")}
          linkLabel={showViewAll ? t("home.restaurants_new.all_link", "عرض جميع المطاعم") : undefined}
          linkTo={showViewAll ? "/offers" : undefined}
          className="!mb-6"
        />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {restaurants.slice(0, 6).map((restaurant, i) => (
            <Reveal key={restaurant.id} delay={(i % 6) * 50} className="h-full">
            <Link
              to={merchantUrl(restaurant)}
              className={`group mk-lift flex h-full flex-col overflow-hidden rounded-mk-2xl border border-[#F6E5D8] bg-white shadow-mk-card hover:border-[#F3CBB0] hover:!shadow-[0_22px_48px_-18px_rgba(217,80,11,0.45)] ${FOCUS}`}
            >
              <div className="mk-zoom relative aspect-[4/3] w-full overflow-hidden bg-[#F2EFFA]">
                <BrandImage
                  src={restaurant.cover_image || restaurant.logo}
                  name={restaurant.name}
                  objectFit={restaurant.cover_image ? "cover" : "contain"}
                  variant="name"
                  className={`h-full w-full text-[15px] ${restaurant.cover_image ? "" : "p-3"}`}
                  bg="#F2EFFA"
                />
                {restaurant.discount != null && Number(restaurant.discount) > 0 && (
                  <span className="mk-shine absolute top-2.5 start-2.5 rounded-full bg-grad-accent px-3 py-1.5 text-[13px] font-extrabold leading-none text-white shadow-mk-badge">
                    {t("home.restaurants_new.discount", "خصم")}{" "}
                    <span dir="ltr">{Math.round(Number(restaurant.discount))}%</span>
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-3.5">
                <span className="line-clamp-1 text-[14px] font-extrabold text-[#1A1A2E] transition-colors duration-200 group-hover:text-[#D9500B]">
                  {restaurant.name}
                </span>
                <span className="line-clamp-1 text-[11px] text-[#9A99B0]">
                  {restaurant.description || t("home.restaurants_new.cuisine", "مطاعم وكافيهات")}
                </span>
                <div className="mt-auto flex items-center justify-between border-t border-[#F3F0FA] pt-2.5 text-[11.5px] font-semibold text-[#6B6B85]">
                  <span>
                    {restaurant.rating ? `${restaurant.rating} ★` : t("home.restaurants_new.new", "جديد")}
                  </span>
                  <span>
                    {restaurant.branches_count ?? 0} {t("home.restaurants_new.branches", "فرع")}
                  </span>
                </div>
              </div>
            </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RestaurantsBand;
