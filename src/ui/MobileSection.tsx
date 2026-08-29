"use client";

import React from "react";
import { Link } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { FOCUS } from "./tokens";

interface SectionProps {
  title?: string;
  /** رابط «الكل» على يسار/يمين الترويسة حسب الاتجاه */
  to?: string;
  linkLabel?: string;
  children?: React.ReactNode;
  className?: string;
  /** إزالة الحشوة الأفقية (للصفوف الممرَّرة أفقياً التي تحشو نفسها) */
  flush?: boolean;
}

/**
 * قسم في نسخة الموبايل — إيقاع رأسي واحد (mt-7) وترويسة موحّدة
 * «العنوان … الكل ›»، والسهم يتبع اتجاه الصفحة تلقائياً.
 */
const MobileSection: React.FC<SectionProps> = ({
  title,
  to,
  linkLabel,
  children,
  className = "",
  flush = false,
}) => {
  const { t } = useTranslation();

  return (
    <section className={`mt-7 ${className}`}>
      {title && (
        <div className="mb-3 flex items-center justify-between gap-3 px-4">
          <h2 className="m-0 text-[16px] font-bold text-mk-text">{title}</h2>
          {to && (
            <Link
              to={to}
              className={`-me-2 inline-flex min-h-[44px] items-center gap-0.5 rounded-mk-sm px-2 text-[12.5px] font-semibold text-mk-primary ${FOCUS}`}
            >
              {linkLabel ?? t("home.categories_new.all", "الكل")}
              <span aria-hidden className="text-[15px] leading-none rtl:-scale-x-100">
                &#8250;
              </span>
            </Link>
          )}
        </div>
      )}
      <div className={flush ? "" : "px-4"}>{children}</div>
    </section>
  );
};

interface HScrollProps {
  children?: React.ReactNode;
  className?: string;
  /** التقاط العناصر عند التمرير (سلوك التطبيقات) */
  snap?: boolean;
  gap?: string;
}

/**
 * صف تمرير أفقي سلس: يخفي شريط التمرير، يحافظ على حشوة الحواف،
 * ويدعم RTL دون قلب يدوي (`direction` موروث من الصفحة).
 */
export const HScroll: React.FC<HScrollProps> = ({
  children,
  className = "",
  snap = true,
  gap = "gap-3",
}) => (
  <div
    className={[
      "no-scrollbar flex overflow-x-auto overscroll-x-contain scroll-px-4 px-4 pb-1",
      "[-webkit-overflow-scrolling:touch]",
      snap ? "snap-x snap-mandatory" : "",
      gap,
      className,
    ]
      .filter(Boolean)
      .join(" ")}
  >
    {children}
  </div>
);

export default MobileSection;
