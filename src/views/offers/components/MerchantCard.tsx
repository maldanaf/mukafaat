"use client";

import React from "react";
import { Link } from "@/lib/router-compat";
import { FiMapPin, FiTag } from "react-icons/fi";
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
  category?: string | null;
  rating?: number;
  /** أعلى خصم دائم لدى المتجر — بطل الكرت */
  max_discount?: number | null;
  discounts_count?: number;
  is_open_now?: boolean;
  is_temporarily_closed?: boolean;
  is_coming_soon?: boolean;
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
        <Ratio ratio={16 / 10}>
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

        {/* الشعار فوق الغلاف */}
        {logo && (
          <span className="absolute bottom-3 start-3 z-[2] flex h-12 w-12 items-center justify-center overflow-hidden rounded-mk-md border-2 border-white bg-white shadow-md">
            <SmartImage src={logo} alt="" className="h-full w-full object-contain" />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-1 text-[15px] font-extrabold text-mk-text-strong">
          {merchant.name}
        </h3>

        {merchant.city && (
          <span className="inline-flex items-center gap-1 text-[12.5px] text-mk-muted">
            <FiMapPin size={13} aria-hidden />
            {merchant.city}
          </span>
        )}

        <div className="mt-auto pt-2">
          {hasDiscount ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mk-tint2 px-3 py-1.5 text-[12px] font-extrabold text-mk-primary">
              <FiTag size={13} aria-hidden />
              {extraCount > 0
                ? t("merchantCard.more_discounts", {
                    count: extraCount,
                    defaultValue: `و{{count}} خصومات أخرى`,
                  })
                : t("merchantCard.view_discounts", "اعرض الخصومات")}
            </span>
          ) : (
            <span className="text-[12px] font-semibold text-mk-faint">
              {t("merchantCard.no_discounts", "تصفّح المتجر")}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default MerchantCard;
