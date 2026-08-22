"use client";

import { Link } from "@/lib/router-compat";
import { t } from "i18next";
import { CONTAINER } from "./tokens";
import SectionHead from "./SectionHead";
import BrandImage from "./BrandImage";

interface Restaurant {
  id: number | string;
  slug?: string | null;
  name: string;
  description?: string | null;
  logo?: string | null;
  cover_image?: string | null;
  discount?: number | string | null;
  branches_count?: number;
  rating?: number;
}

const RestaurantsBand: React.FC<{ restaurants: Restaurant[] }> = ({ restaurants }) => {
  if (!restaurants?.length) return null;

  return (
    <section className="mt-11 bg-[#FFF7F1] py-[52px]">
      <div className={CONTAINER}>
        <SectionHead
          eyebrow={t("home.restaurants_new.eyebrow", "مطاعم مميزة")}
          eyebrowColor="#C2410C"
          title={t("home.restaurants_new.title", "أفضل المطاعم")}
          linkLabel={t("home.restaurants_new.all_link", "عرض جميع المطاعم")}
          linkTo="/offers"
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {restaurants.slice(0, 6).map((restaurant) => (
            <Link
              key={restaurant.id}
              to={`/offers?merchant=${restaurant.id}`}
              className="overflow-hidden rounded-[18px] border border-[#EDE9F7] bg-white transition-shadow hover:shadow-[0_12px_30px_rgba(46,16,101,0.10)]"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F6F3FC]">
                <BrandImage
                  src={restaurant.cover_image || restaurant.logo}
                  name={restaurant.name}
                  objectFit={restaurant.cover_image ? "cover" : "contain"}
                  variant="name"
                  className={`h-full w-full text-[15px] ${restaurant.cover_image ? "" : "p-3"}`}
                  bg="#F6F3FC"
                />
                {restaurant.discount != null && Number(restaurant.discount) > 0 && (
                  <span className="absolute top-2 end-2 rounded-full bg-[#E2680F] px-2 py-0.5 text-[10.5px] font-bold text-white">
                    {t("home.restaurants_new.discount", "خصم")} {Math.round(Number(restaurant.discount))}%
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1.5 p-3">
                <span className="line-clamp-1 text-[13.5px] font-bold text-[#17122A]">
                  {restaurant.name}
                </span>
                <span className="line-clamp-1 text-[11px] text-[#8B84A0]">
                  {restaurant.description || t("home.restaurants_new.cuisine", "مطاعم وكافيهات")}
                </span>
                <div className="flex items-center justify-between border-t border-[#F3F0FA] pt-2 text-[11px] text-[#6B6480]">
                  <span>
                    {restaurant.rating ? `${restaurant.rating} ★` : t("home.restaurants_new.new", "جديد")}
                  </span>
                  <span>
                    {restaurant.branches_count ?? 0} {t("home.restaurants_new.branches", "فرع")}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RestaurantsBand;
