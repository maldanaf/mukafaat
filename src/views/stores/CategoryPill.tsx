"use client";

import React from "react";
import { Link } from "@/lib/router-compat";
import { LuLayoutGrid } from "react-icons/lu";
import { SmartImage, FOCUS, paletteFor } from "@ui";

export interface CategoryPillItem {
  id: number | string;
  name: string;
  slug?: string | null;
  image?: string | null;
  color?: string | null;
  merchants_count?: number;
}

/**
 * شريحة تصنيف.
 *
 * كانت كرتاً أبيض ١٤٨×١٤٠ بكسل يحمل أيقونة رمادية صغيرة واسماً — يأكل
 * ١٥٦ بكسل من ارتفاع الصفحة مقابل معلومة سطر واحد، ويبدو كل تصنيف
 * كسابقه لأن لون التصنيف لم يكن يُستعمل.
 *
 * الشريحة الآن أفقية بارتفاع النصف تقريباً، تحمل لون التصنيف في خلفية
 * أيقونته وحدّه عند التفعيل، وتعرض عدد متاجره — فتُميَّز التصنيفات
 * بلمحة ويبقى المحتوى هو البطل.
 */
const CategoryPill: React.FC<{
  item: CategoryPillItem;
  to: string;
  active: boolean;
  /** الشريحة الأولى «الكل» — بلا صورة وبلون الهوية */
  isAll?: boolean;
}> = ({ item, to, active, isAll = false }) => {
  const { c: color } = paletteFor(item.color, item.id);
  const tone = isAll ? "#400198" : color;

  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={`group flex h-[52px] shrink-0 items-center gap-2.5 rounded-full border ps-1.5 pe-4 transition-all duration-200 hover:-translate-y-0.5 ${FOCUS}`}
      style={
        active
          ? {
              borderColor: tone,
              backgroundColor: `${tone}12`,
              boxShadow: `0 10px 24px -14px ${tone}`,
            }
          : { borderColor: "#ECE9F5", backgroundColor: "#FFFFFF" }
      }
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full transition-colors"
        style={{ backgroundColor: active ? tone : `${tone}18` }}
      >
        {item.image && !isAll ? (
          <SmartImage
            src={item.image}
            alt=""
            className={`h-5 w-5 object-contain transition-transform duration-200 group-hover:scale-110 ${
              active ? "brightness-0 invert" : ""
            }`}
          />
        ) : (
          <LuLayoutGrid
            size={17}
            style={{ color: active ? "#FFFFFF" : tone }}
            aria-hidden
          />
        )}
      </span>

      <span className="flex min-w-0 flex-col leading-tight">
        <span
          className="whitespace-nowrap text-[13.5px] font-extrabold"
          style={{ color: active ? tone : "#2B1B5E" }}
        >
          {item.name}
        </span>
        {item.merchants_count != null && item.merchants_count > 0 && (
          <span
            className="text-[11px] font-bold opacity-75"
            style={{ color: active ? tone : "#6B6880" }}
          >
            {item.merchants_count}
          </span>
        )}
      </span>
    </Link>
  );
};

export default CategoryPill;
