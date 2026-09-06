"use client";

import { Link } from "@/lib/router-compat";
import { useState } from "react";
import { t } from "i18next";
import { CONTAINER } from "./tokens";
import { FOCUS } from "@ui";
import SectionHead from "./SectionHead";
import BrandImage from "./BrandImage";
import Reveal from "./Reveal";
import { merchantUrl } from "@utils/merchantUrl";
import MerchantCoverFallback from "@ui/MerchantCoverFallback";
import ComingSoonModal from "@components/ComingSoonModal";

/** اسم تصنيف المتجر حين يصل ككائن أو نصّ */
function categoryNameOf(r: Restaurant): string {
  const c = r.category as { name?: string; slug?: string } | string | null | undefined;
  if (!c) return "";
  return typeof c === "string" ? c : String(c.name ?? "");
}

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
  reviews_count?: number;
  is_coming_soon?: boolean;
}

const RestaurantsBand: React.FC<{
  restaurants: Restaurant[];
  title?: string;
  showViewAll?: boolean;
}> = ({ restaurants, title, showViewAll = true }) => {
  // متجر «قريباً» لا تُفتح صفحته — نافذة الترقّب بدلها
  const [pending, setPending] = useState<Restaurant | null>(null);

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
            {(() => {
              const shellCls = `group mk-lift flex h-full w-full flex-col overflow-hidden rounded-mk-2xl border border-[#F6E5D8] bg-white text-start shadow-mk-card hover:border-[#F3CBB0] hover:!shadow-[0_22px_48px_-18px_rgba(217,80,11,0.45)] ${FOCUS}`;
              const inner = (
              <>
              <div className="mk-zoom relative aspect-[4/3] w-full overflow-hidden bg-[#F2EFFA]">
                {restaurant.cover_image || restaurant.logo ? (
                  <BrandImage
                    src={restaurant.cover_image || restaurant.logo}
                    name={restaurant.name}
                    objectFit={restaurant.cover_image ? "cover" : "contain"}
                    variant="name"
                    className={`h-full w-full text-[15px] ${restaurant.cover_image ? "" : "p-3"}`}
                    bg="#F2EFFA"
                  />
                ) : (
                  // بلا صورة: لون هادئ خاص بالمتجر بدل بديل رمادي مكرّر
                  <MerchantCoverFallback name={restaurant.name} />
                )}

                {/* شريط «قريباً» المائل — نفس نمط بطاقات المتاجر */}
                {restaurant.is_coming_soon && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -start-[52px] top-[16px] z-[3] w-[190px] -rotate-45 bg-[linear-gradient(135deg,#FFA23A_0%,#FD671A_100%)] py-1 text-center text-[12px] font-extrabold text-white shadow-[0_8px_20px_-8px_rgba(0,0,0,0.55)] rtl:rotate-45"
                  >
                    {t("merchantCard.coming_soon", "قريباً")}
                  </span>
                )}
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
                {/* التصنيف الحقيقي إن وُجد — لا نصّ ثابت يوهم بأنه بيانات */}
                {(restaurant.description || categoryNameOf(restaurant)) && (
                  <span className="line-clamp-1 text-[11px] text-[#9A99B0]">
                    {restaurant.description || categoryNameOf(restaurant)}
                  </span>
                )}
                {/*
                  التقييم وعدد الفروع يظهران حين يوجدان فعلاً.
                  كانا يعرضان «جديد» و«٠ فرع» لكل متجر لأن الخادم لم
                  يرسلهما أصلاً — رقمٌ مختلق أسوأ من سطر غائب.
                */}
                {(Number(restaurant.rating) > 0 ||
                  Number(restaurant.branches_count) > 0) && (
                  <div className="mt-auto flex items-center justify-between border-t border-[#F3F0FA] pt-2.5 text-[11.5px] font-semibold text-[#6B6B85]">
                    {Number(restaurant.rating) > 0 ? (
                      <span dir="ltr">{restaurant.rating} ★</span>
                    ) : (
                      <span />
                    )}
                    {Number(restaurant.branches_count) > 0 && (
                      <span>
                        {restaurant.branches_count}{" "}
                        {t("home.restaurants_new.branches", "فرع")}
                      </span>
                    )}
                  </div>
                )}
              </div>
              </>
              );
              return restaurant.is_coming_soon ? (
                <button type="button" onClick={() => setPending(restaurant)} className={shellCls}>
                  {inner}
                </button>
              ) : (
                <Link to={merchantUrl(restaurant)} className={shellCls}>
                  {inner}
                </Link>
              );
            })()}
            </Reveal>
          ))}
        </div>
      </div>

      <ComingSoonModal
        isOpen={pending !== null}
        onClose={() => setPending(null)}
        merchant={pending}
      />
    </section>
  );
};

export default RestaurantsBand;
