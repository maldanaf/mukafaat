"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { LuEye, LuCopy, LuShoppingBag } from "react-icons/lu";
import { HeartIcon, ShareIcon, type MkIcon } from "./icons";
import { MK } from "./tokens";

interface Props {
  views?: number | string | null;
  favorites?: number | string | null;
  shares?: number | string | null;
  /** عدّاد نسخ الكوبون (يظهر بدل المشاركات في الكوبونات) */
  copies?: number | string | null;
  /** عدّاد عمليات الشراء (بطاقات الشحن) */
  purchases?: number | string | null;
  /** نسخة أصغر داخل الكروت الضيّقة */
  compact?: boolean;
  className?: string;
  /** بلا خلفية للشريحة — أيقونة + رقم فقط */
  plain?: boolean;
}

/** 1500 → 1.5k حتى لا يكسر الرقم الطويل الصف */
const fmt = (value: number): string => {
  if (value < 1000) return String(value);
  const k = value / 1000;
  return `${k.toFixed(k >= 10 ? 0 : 1)}k`;
};

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/**
 * صف عدّادات العنصر (مشاهدات / مفضلة / مشاركات) بنفس شكل
 * `StatsCounters` في التطبيق: شريحة ملوّنة شفافة + أيقونة + رقم.
 * أي عدّاد غير موجود في رد الـ API لا يُعرض إطلاقاً (لا أصفار وهمية).
 */
const StatChips: React.FC<Props> = ({
  views,
  favorites,
  shares,
  copies,
  purchases,
  compact = false,
  className = "",
  plain = false,
}) => {
  const { t } = useTranslation();

  const items: {
    key: string;
    value: number | null;
    Icon: MkIcon;
    color: string;
    label: string;
  }[] = [
    {
      key: "views",
      value: toNumber(views),
      Icon: LuEye,
      color: "#6B7280",
      label: t("offerCard.viewsLabel", "مشاهدات"),
    },
    {
      key: "favorites",
      value: toNumber(favorites),
      Icon: HeartIcon,
      color: MK.red,
      label: t("offerCard.favorites", "مفضلة"),
    },
    {
      key: "shares",
      value: toNumber(shares),
      Icon: ShareIcon,
      color: MK.primary,
      label: t("offerCard.shares", "مشاركات"),
    },
    {
      key: "copies",
      value: toNumber(copies),
      Icon: LuCopy,
      color: MK.amber,
      label: t("couponCard.copies", "مرات النسخ"),
    },
    {
      key: "purchases",
      value: toNumber(purchases),
      Icon: LuShoppingBag,
      color: MK.green,
      label: t("cardTile.purchases", "عملية شراء"),
    },
  ].filter((item) => item.value !== null);

  // الصف كله لا يظهر إلا إذا كان أحد الأرقام أكبر من صفر —
  // كرت بلا أي نشاط يبقى نظيفاً بلا أصفار.
  if (items.length === 0) return null;
  if (items.every((item) => (item.value as number) <= 0)) return null;

  return (
    <div
      className={`flex flex-wrap items-center ${compact ? "gap-1.5" : "gap-2"} ${className}`}
    >
      {items.map(({ key, value, Icon, color, label }) => (
        <span
          key={key}
          title={label}
          aria-label={`${label}: ${value}`}
          className={`inline-flex items-center gap-1 rounded-full font-bold ${
            compact ? "px-1.5 py-0.5 text-[10.5px]" : "px-2 py-1 text-[11.5px]"
          }`}
          style={
            plain
              ? { color }
              : { color, backgroundColor: `${color}17` }
          }
        >
          <Icon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} size={compact ? 12 : 14} />
          {fmt(value as number)}
        </span>
      ))}
    </div>
  );
};

export default StatChips;
