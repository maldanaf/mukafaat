"use client";

import React from "react";
import { Link } from "@/lib/router-compat";
import { LuLayoutGrid } from "react-icons/lu";

interface CategoryCardProps {
  icon: string;
  title: string;
  alt: string;
  categoryKey?: string;
  /** عند true يظهر الكارد بحالة محدّد (حد وألوان أوضح) */
  selected?: boolean;
  /** وجهة بديلة — الافتراضي `/offers/{categoryKey}` */
  to?: string;
  /** تصفية في المكان بدل التنقّل (صفحة المتاجر) */
  onClick?: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  icon,
  title,
  alt,
  categoryKey,
  selected = false,
  to,
  onClick,
}) => {
  const cardContent = (
    <div
      className={`bg-white rounded-xl py-4 px-4 flex flex-col items-center transition-all duration-300 cursor-pointer group border ${
        selected
          ? "border-[#400198] shadow-md shadow-[#400198]/20 scale-[1.02]"
          : "border-gray-100 hover:scale-105"
      }`}
      style={
        selected
          ? {
              boxShadow:
                "0 10px 15px -3px rgba(68, 7, 152, 0.2), 0 4px 6px -2px rgba(68, 7, 152, 0.1)",
            }
          : {
              boxShadow:
                "0 10px 15px -3px rgba(68, 7, 152, 0.1), 0 4px 6px -2px rgba(68, 7, 152, 0.05)",
            }
      }
      onMouseEnter={(e) => {
        if (selected) return;
        e.currentTarget.style.boxShadow =
          "0 25px 50px -12px rgba(68, 7, 152, 0.25), 0 0 0 1px rgba(68, 7, 152, 0.05)";
      }}
      onMouseLeave={(e) => {
        if (selected) {
          e.currentTarget.style.boxShadow =
            "0 10px 15px -3px rgba(68, 7, 152, 0.2), 0 4px 6px -2px rgba(68, 7, 152, 0.1)";
          return;
        }
        e.currentTarget.style.boxShadow =
          "0 10px 15px -3px rgba(68, 7, 152, 0.1), 0 4px 6px -2px rgba(68, 7, 152, 0.05)";
      }}
    >
      {/* Icon container - ألوان أوضح عند التحديد */}
      <div
        className={`w-14 h-14 mb-4 flex items-center justify-center rounded-full transition-all duration-300 ${
          selected
            ? "bg-gradient-to-br from-[#400198]/20 to-[#400198]/30"
            : "bg-gradient-to-br from-mk-tint3 to-mk-tint group-hover:from-mk-tint group-hover:to-mk-border-strong"
        }`}
      >
        {/* أيقونة بديلة حين لا صورة للتصنيف — أوضح من صورة مكسورة */}
        {icon ? (
          <img
            src={icon}
            alt={alt}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
            className={`w-8 h-8 object-contain transition-transform duration-300 ${
              selected ? "opacity-100" : "filter group-hover:scale-110"
            }`}
          />
        ) : (
          <LuLayoutGrid
            size={26}
            className={selected ? "text-[#400198]" : "text-mk-muted"}
            aria-hidden
          />
        )}
      </div>

      {/* Title */}
      <span
        className={`text-[14px] font-semibold text-center transition-colors duration-300 leading-tight ${
          selected
            ? "text-[#400198]"
            : "text-gray-800 group-hover:text-mk-primary"
        }`}
      >
        {title}
      </span>

      {/* Bottom accent - يظهر عند التحديد أو الـ hover */}
      <div
        className={`w-8 h-1 bg-gradient-to-r from-mk-primary-soft to-mk-primary rounded-full mt-3 transition-opacity duration-300 ${
          selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      />
    </div>
  );

  // تصفية في المكان — صفحة المتاجر تُصفّي بلا تنقّل
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="w-full text-start">
        {cardContent}
      </button>
    );
  }

  // If categoryKey is provided, wrap with Link for navigation
  if (to || categoryKey) {
    return <Link to={to ?? `/offers/${categoryKey}`}>{cardContent}</Link>;
  }

  // Otherwise, return the card content without navigation
  return cardContent;
};

export default CategoryCard;
