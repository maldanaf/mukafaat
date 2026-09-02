"use client";

import React from "react";
import { Link } from "@/lib/router-compat";
import { FiMapPin, FiTag } from "react-icons/fi";
import { MdVerified } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { SmartImage, Ratio, FOCUS } from "@ui";
import { API_BASE_URL } from "@config/api";
import { VIVID_CARD, VIVID_MEDIA, VIVID_SCRIM } from "./CatalogKit";
import { merchantUrl } from "@utils/merchantUrl";

export interface MerchantSummary {
  id: number | string;
  slug?: string | null;
  name: string;
  description?: string | null;
  logo?: string | null;
  cover_image?: string | null;
  city?: string | null;
  category?: string | { name?: string; slug?: string | null } | null;
  rating?: number;
  /** أعلى خصم دائم لدى المتجر — بطل الكرت */
  max_discount?: number | null;
  discounts_count?: number;
  is_open_now?: boolean;
  is_temporarily_closed?: boolean;
  is_coming_soon?: boolean;
  /** موثّق ⇒ علامة زرقاء بجوار الاسم */
  is_verified?: boolean;
}

const absolute = (path?: string | null): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
};

/**
 * كرت متجر لصفحة التصنيف.
 *
 * الخصم الدائم هو أبرز ما فيه: اعتماد المنصة على الاتفاقيات مع المتاجر
 * لا على العروض المؤقّتة، فالنسبة تتصدّر الكرت لا السعر.
 */
const MerchantCard: React.FC<{ merchant: MerchantSummary }> = ({ merchant }) => {
  const { t } = useTranslation();

  const href = merchantUrl(merchant);
  const cover = absolute(merchant.cover_image) ?? absolute(merchant.logo);
  const logo = absolute(merchant.logo);

  const discount = Number(merchant.max_discount ?? 0);
  const hasDiscount = Number.isFinite(discount) && discount > 0;
  const extraCount = Math.max(0, (merchant.discounts_count ?? 0) - 1);

  return (
    <Link to={href} className={`${VIVID_CARD} ${FOCUS}`}>
      <div className={VIVID_MEDIA}>
        <Ratio ratio="aspect-[2/1]">
          {cover ? (
            <SmartImage src={cover} alt={merchant.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-mk-tint2">
              <FiTag className="text-mk-faint" size={28} aria-hidden />
            </div>
          )}
        </Ratio>
        <span className={VIVID_SCRIM} aria-hidden />

        {/* شارة الخصم الدائم — أكبر عنصر على الكرت */}
        {hasDiscount && (
          <span className="absolute end-3 top-3 z-[2] flex flex-col items-center rounded-mk-md bg-[linear-gradient(135deg,#400198_0%,#6703EB_100%)] px-3 py-1.5 leading-none text-white shadow-[0_10px_24px_-8px_rgba(64,1,152,0.9)] ring-1 ring-white/25">
            <span className="text-[19px] font-extrabold" dir="ltr">
              {Number.isInteger(discount) ? discount : discount.toFixed(2).replace(/\.?0+$/, "")}%
            </span>
            <span className="text-[9.5px] font-bold opacity-95">
              {t("merchantCard.permanent", "خصم دائم")}
            </span>
          </span>
        )}

        {/* قريباً — يسبق كل شيء لأنه يغيّر توقّع المستخدم من الكرت */}
        {merchant.is_coming_soon && (
          <span className="absolute start-3 top-3 z-[2] rounded-full bg-[linear-gradient(135deg,#FFA23A_0%,#FD671A_100%)] px-3 py-1 text-[11px] font-extrabold text-white shadow-[0_8px_20px_-8px_rgba(253,103,26,0.95)] ring-1 ring-white/25">
            {t("merchantCard.coming_soon", "قريباً")}
          </span>
        )}

      </div>

      {/*
        الشعار في صفّ الاسم لا عائماً على الغلاف: كان يجلس أسفل اليسار
        بينما الاسم يمين، فيبدو الكرت مائلاً بلا محور بصري.
      */}
      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-start gap-2.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-mk-sm border border-mk-border bg-white">
            {logo ? (
              <SmartImage src={logo} alt="" className="h-full w-full object-contain" />
            ) : (
              <FiTag className="text-mk-faint" size={16} aria-hidden />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <h3 className="m-0 flex items-center gap-1 text-[14.5px] font-extrabold leading-snug text-mk-text-strong">
              <span className="line-clamp-1">{merchant.name}</span>
              {merchant.is_verified && (
                <MdVerified
                  className="shrink-0 text-[#1D9BF0]"
                  size={15}
                  aria-label={t("merchantCard.verified", "متجر موثّق")}
                  title={t("merchantCard.verified", "متجر موثّق")}
                />
              )}
            </h3>

            <span className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-mk-muted">
              {merchant.city ? (
                <>
                  <FiMapPin size={12} aria-hidden />
                  {merchant.city}
                </>
              ) : (
                <>
                  {typeof merchant.category === "string"
                    ? merchant.category
                    : merchant.category?.name}
                </>
              )}
            </span>
          </div>
        </div>

        {/* التذييل ثابت الارتفاع فتستوي الكروت في الصف */}
        <div className="mt-3 flex items-center gap-2 border-t border-mk-border pt-2.5">
          {hasDiscount ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mk-tint2 px-2.5 py-1 text-[11.5px] font-extrabold text-mk-primary">
              <FiTag size={12} aria-hidden />
              {extraCount > 0
                ? t("merchantCard.more_discounts", {
                    count: extraCount,
                    defaultValue: `و{{count}} خصومات أخرى`,
                  })
                : t("merchantCard.view_discounts", "اعرض الخصومات")}
            </span>
          ) : (
            <span className="text-[11.5px] font-bold text-mk-faint">
              {t("merchantCard.no_discounts", "تصفّح المتجر")}
            </span>
          )}

          <span className="ms-auto text-[11.5px] font-extrabold text-mk-primary transition-transform duration-200 group-hover/vivid:-translate-x-0.5">
            ←
          </span>
        </div>
      </div>
    </Link>
  );
};

export default MerchantCard;
