"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import CurrencyIcon from "@components/CurrencyIcon";

interface Props {
  /** السعر النهائي المطلوب دفعه */
  price?: number | string | null;
  /** السعر قبل الخصم — يُشطب إن كان أكبر من النهائي */
  priceBefore?: number | string | null;
  size?: "sm" | "md" | "lg";
  /** على خلفية داكنة */
  dark?: boolean;
  /** «مجاناً» عندما السعر صفر */
  freeLabel?: string;
  className?: string;
  /** ترتيب رأسي (السعر المشطوب فوق) بدل الأفقي */
  stacked?: boolean;
  /** إظهار شارة «وفّر ‎%‎» بجانب السعر (الاتجاه الحيوي) */
  showSaving?: boolean;
  /** نص الشارة قبل النسبة — «وفّر» افتراضاً */
  savingLabel?: string;
}

const SIZES = {
  sm: { now: "text-[17px]", old: "text-[12px]", icon: 14 },
  md: { now: "text-[21px]", old: "text-[13px]", icon: 17 },
  lg: { now: "text-[29px]", old: "text-[15px]", icon: 24 },
} as const;

const num = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const fmt = (value: number): string =>
  Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.00$/, "");

/**
 * سعر موحّد مع شطب السعر قبل الخصم — نفس منطق كروت التطبيق:
 * السعر القديم يُشطب فقط عندما يكون أعلى فعلياً من السعر الحالي.
 */
const PriceTag: React.FC<Props> = ({
  price,
  priceBefore,
  size = "md",
  dark = false,
  freeLabel,
  className = "",
  stacked = false,
  showSaving = false,
  savingLabel,
}) => {
  const { t } = useTranslation();
  const s = SIZES[size];
  const now = num(price);
  const before = num(priceBefore);
  const showOld = before !== null && now !== null && before > now;

  if (now === null && before === null) return null;

  const isFree = now === 0 && !!freeLabel;

  /** نسبة التوفير — تُحسب من الفارق بين السعرين */
  const savingPercent =
    showSaving && showOld && (before as number) > 0
      ? Math.round((((before as number) - (now as number)) / (before as number)) * 100)
      : 0;

  return (
    <span
      className={`flex ${stacked ? "flex-col items-start gap-0.5" : "flex-wrap items-center gap-2"} ${className}`}
    >
      {isFree ? (
        <span className={`font-bold ${s.now} ${dark ? "text-white" : "text-mk-green"}`}>
          {freeLabel}
        </span>
      ) : (
        <span
          className={`inline-flex items-center gap-1 font-extrabold tracking-[-0.01em] ${s.now} ${
            dark ? "text-white" : "text-mk-text"
          }`}
          dir="ltr"
        >
          {fmt(now ?? before ?? 0)}
          <CurrencyIcon
            className={dark ? "text-white" : "text-mk-text-strong"}
            size={s.icon}
          />
        </span>
      )}

      {showOld && (
        <span
          className={`inline-flex items-center gap-0.5 font-semibold line-through decoration-mk-red/70 decoration-[1.5px] ${s.old} ${
            dark ? "text-white/60" : "text-mk-faint"
          }`}
          dir="ltr"
        >
          {fmt(before as number)}
          <CurrencyIcon
            className={dark ? "text-white/60" : "text-mk-faint"}
            size={Math.round(s.icon * 0.72)}
          />
        </span>
      )}

      {savingPercent > 0 && (
        <span
          className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10.5px] font-extrabold leading-none ${
            dark ? "bg-white/15 text-white" : "bg-mk-warm-tint text-mk-accent-dark"
          }`}
        >
          {savingLabel ?? t("ui.save", "وفّر")} <span dir="ltr">{savingPercent}%</span>
        </span>
      )}
    </span>
  );
};

export default PriceTag;
