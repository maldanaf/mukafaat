"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { LuCopy, LuCheck, LuUsers } from "react-icons/lu";
import { usedCountText } from "@utils/usedCount";
import { SmartImage } from "./SmartImage";
import Badge from "./Badge";
import { FOCUS, pick } from "./tokens";

export interface CouponTileData {
  id: number | string;
  coupon_code?: string | null;
  code?: string | null;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  terms?: string | null;
  image?: string | null;
  discount_percentage?: number | string | null;
  copies_count?: number | string | null;
  merchant?: { name?: string | null; logo?: string | null } | null;
}

interface Props {
  coupon: CouponTileData;
  /** فهرس داخل القائمة — يُستخدم للون الشريحة الدوّار */
  index?: number;
  /** card = كرت بشريط لون وكود بخط منقّط · row = صف مضغوط داخل الرئيسية */
  layout?: "card" | "row";
  /** عدّاد النسخ بعد أي زيادة تفاؤلية محلية */
  copiesCount?: number;
  copied?: boolean;
  onCopy?: (code: string) => void;
  className?: string;
}

/**
 * كرت الكوبون الموحّد — نفس كرت التطبيق: شعار التاجر + نسبة الخصم +
 * عدّاد الاستخدام + كود بخط منقّط وزر نسخ بهدف لمس ≥44px.
 */
const CouponTile: React.FC<Props> = ({
  coupon,
  index = 0,
  layout = "card",
  copiesCount,
  copied = false,
  onCopy,
  className = "",
}) => {
  const { t } = useTranslation();
  const color = pick(index);
  const code = coupon.coupon_code ?? coupon.code ?? "";
  const name = coupon.merchant?.name ?? coupon.title ?? coupon.name ?? "";
  const note = coupon.description ?? coupon.terms ?? "";
  const pct = Number(coupon.discount_percentage ?? 0);
  const uses = Number(copiesCount ?? coupon.copies_count ?? 0) || 0;

  const logo = (size: string) => (
    <span className={`${size} shrink-0 overflow-hidden rounded-mk-md bg-mk-tint2`}>
      <SmartImage
        src={coupon.image || coupon.merchant?.logo}
        name={name}
        alt=""
        className="h-full w-full text-[16px]"
      />
    </span>
  );

  const usesRow = uses > 0 && (
    <p className="m-0 mt-1 flex items-center gap-1 text-[11px] font-medium text-mk-faint">
      <LuUsers size={12} aria-hidden />
      {usedCountText(uses)}
    </p>
  );

  if (layout === "row") {
    return (
      <div
        className={`flex items-center gap-3 rounded-mk-lg border border-mk-border bg-white p-3 shadow-mk-card ${className}`}
      >
        {logo("h-12 w-12")}
        <div className="min-w-0 flex-1">
          <p className="mk-clamp-1 m-0 text-[13.5px] font-bold text-mk-text">{name}</p>
          <p className="mk-clamp-1 m-0 text-[11.5px] text-mk-faint">{note}</p>
          {usesRow}
        </div>
        {code && onCopy && (
          <button
            type="button"
            onClick={() => onCopy(code)}
            aria-label={`${t("home.coupons_new.copy", "نسخ")} ${code}`}
            className={`flex min-h-[44px] shrink-0 items-center gap-1 rounded-mk-sm px-3 text-[11.5px] font-bold text-white transition-colors ${FOCUS}`}
            style={{ background: copied ? "#12A06A" : color.c }}
          >
            {copied ? <LuCheck size={14} aria-hidden /> : <LuCopy size={14} aria-hidden />}
            <span className="font-mono">
              {copied ? t("home.coupons_new.copied", "تم النسخ") : code}
            </span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-mk-lg border border-mk-border bg-white shadow-mk-card ${className}`}
    >
      <div aria-hidden className="h-1 w-full" style={{ background: color.c }} />
      <div className="flex items-center gap-3 p-3">
        {logo("h-14 w-14")}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {pct > 0 && (
              <Badge tone="solid-accent" size="sm">
                {Math.round(pct)}%
              </Badge>
            )}
            <span className="mk-clamp-1 text-[13.5px] font-bold text-mk-text">{name}</span>
          </div>
          <p className="mk-clamp-1 m-0 mt-0.5 text-[11.5px] text-mk-faint">{note}</p>
          {usesRow}
        </div>
      </div>
      {code && onCopy && (
        <button
          type="button"
          onClick={() => onCopy(code)}
          aria-label={`${t("home.coupons_new.copy", "نسخ")} ${code}`}
          className={`flex min-h-[48px] w-full items-center justify-between gap-2 border-t border-dashed border-mk-border-strong bg-mk-tint3 px-4 ${FOCUS}`}
        >
          <span className="font-mono text-[13.5px] font-bold tracking-widest text-mk-deep">
            {code}
          </span>
          <span
            className="flex items-center gap-1 rounded-mk-sm px-3 py-1.5 text-[11.5px] font-bold text-white transition-colors"
            style={{ background: copied ? "#12A06A" : color.c }}
          >
            {copied ? <LuCheck size={14} aria-hidden /> : <LuCopy size={14} aria-hidden />}
            {copied ? t("home.coupons_new.copied", "تم النسخ") : t("home.coupons_new.copy", "نسخ")}
          </span>
        </button>
      )}
    </div>
  );
};

export default CouponTile;
