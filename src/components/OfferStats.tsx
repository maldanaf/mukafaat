"use client";

import React from "react";
import StatChips from "@ui/StatChips";

interface Props {
  views?: number | null;
  favorites?: number | null;
  shares?: number | null;
  className?: string;
  /** أُبقيت للتوافق مع الاستخدامات القديمة */
  iconSize?: string;
  textSize?: string;
  gap?: string;
}

/**
 * إحصائيات العرض (مشاهدات / مفضلة / مشاركات).
 * أصبحت غلافاً فوق `StatChips` في نظام التصميم حتى يكون شكل العدّادات
 * في الموقع مطابقاً لـ `StatsCounters` في التطبيق (شرائح ملوّنة).
 * أي عدّاد غير موجود في مخرجات الـ API لا يُعرض إطلاقاً.
 */
const OfferStats: React.FC<Props> = ({
  views,
  favorites,
  shares,
  className = "",
  textSize,
}) => (
  <StatChips
    views={views}
    favorites={favorites}
    shares={shares}
    compact={textSize === "text-[11px]" || textSize === "text-xs"}
    className={className}
  />
);

export default OfferStats;
