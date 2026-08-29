"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import CurrencyIcon from "@components/CurrencyIcon";
import {
  formatPrice,
  type PlanPricing,
} from "@utils/subscriptionPricing";

interface Props {
  pricing: PlanPricing;
  /** اسم مستوى العضوية (اختياري) — يظهر داخل شارة الخصم */
  tierName?: string | null;
  /** dark = على خلفية داكنة (صفحات الاشتراك)، light = بطاقات بيضاء */
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: { price: "text-lg", icon: 16, old: "text-xs" },
  md: { price: "text-2xl", icon: 20, old: "text-sm" },
  lg: { price: "text-3xl", icon: 24, old: "text-sm" },
} as const;

/**
 * سعر الباقة مع شطب السعر القديم عند وجود خصم مستوى العضوية
 * (خصم التجديد أو خصم الاشتراك الجديد) — يتحمّل غياب كل الحقول الجديدة.
 */
const PlanPriceTag: React.FC<Props> = ({
  pricing,
  tierName,
  variant = "light",
  size = "md",
  className = "",
}) => {
  const { t } = useTranslation();
  const s = SIZES[size];
  const dark = variant === "dark";

  const discountLabel =
    pricing.tierType === "renewal"
      ? t("home.subscription.tierDiscountRenewal")
      : t("home.subscription.tierDiscountNew");

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {pricing.hasDiscount && (
        <span
          className={`flex items-center gap-1 line-through ${s.old} ${
            dark ? "text-white/50" : "text-mk-faint"
          }`}
        >
          {formatPrice(pricing.original)}
          <CurrencyIcon
            className={dark ? "text-white/50" : "text-mk-faint"}
            size={12}
          />
        </span>
      )}

      <span
        className={`flex items-center gap-1 font-bold ${s.price} ${
          dark ? "text-white" : "text-mk-text"
        }`}
      >
        {formatPrice(pricing.final)}
        <CurrencyIcon
          className={dark ? "text-white" : "text-mk-text"}
          size={s.icon}
        />
      </span>

      {pricing.tierPercent > 0 && (
        <span
          className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            dark
              ? "bg-emerald-400/20 text-emerald-200"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {tierName
            ? t("home.subscription.tierBadge", {
                tier: tierName,
                percent: formatPrice(pricing.tierPercent),
              })
            : `${discountLabel} ${formatPrice(pricing.tierPercent)}%`}
        </span>
      )}
    </div>
  );
};

export default PlanPriceTag;
