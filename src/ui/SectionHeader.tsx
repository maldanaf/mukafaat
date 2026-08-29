"use client";

import React from "react";
import { Link } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { FOCUS } from "./tokens";

interface Props {
  /** نص علوي صغير بلون الشعار البرتقالي */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** رابط «عرض الكل» */
  linkTo?: string;
  linkLabel?: string;
  /** زر «عرض الكل» بدون رابط (فتح قائمة داخلية) */
  onLink?: () => void;
  /** على خلفية داكنة */
  dark?: boolean;
  /** عنصر إضافي على الجانب (أسهم تنقّل، فلاتر…) */
  actions?: React.ReactNode;
  className?: string;
  /** حجم العنوان */
  size?: "sm" | "md";
  as?: "h2" | "h3";
  /** إخفاء شريط التدرّج تحت العنوان (افتراضياً يظهر) */
  noBar?: boolean;
}

/**
 * ترويسة قسم موحّدة بالاتجاه «الحيوي التجاري»:
 * شارة علوية بتدرّج برتقالي + عنوان كبير وثقيل مع شريط تدرّج تحته
 * + زر «عرض الكل» على هيئة حبّة بحدّ واضح.
 * السهم يتبع اتجاه الصفحة تلقائياً (RTL/LTR) عبر خصائص منطقية.
 */
const SectionHeader: React.FC<Props> = ({
  eyebrow,
  title,
  subtitle,
  linkTo,
  linkLabel,
  onLink,
  dark = false,
  actions,
  className = "",
  size = "md",
  as = "h2",
  noBar = false,
}) => {
  const { t } = useTranslation();
  const Heading = as;
  const label = linkLabel ?? t("ui.viewAll", "عرض الكل");

  const linkClasses = [
    "group/all inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[13px] font-bold transition-all duration-200 ease-out",
    dark
      ? "border-white/25 bg-white/10 text-white hover:border-white hover:bg-white hover:text-mk-deep"
      : "border-mk-border-strong bg-white text-mk-primary hover:-translate-y-0.5 hover:border-mk-primary hover:bg-mk-tint2 hover:shadow-[0_10px_24px_-12px_rgba(64,1,152,0.7)]",
    FOCUS,
  ].join(" ");

  const arrow = (
    <span
      aria-hidden
      className="transition-transform duration-200 group-hover/all:translate-x-1 rtl:-scale-x-100"
    >
      &#8594;
    </span>
  );

  return (
    <div className={`mb-5 flex flex-wrap items-end justify-between gap-3 ${className}`}>
      <div className="flex min-w-0 flex-col items-start gap-2">
        {eyebrow && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-extrabold uppercase tracking-[0.06em] ${
              dark ? "bg-white/12 text-mk-accent-light" : "bg-mk-warm-tint text-mk-accent-dark"
            }`}
          >
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-grad-accent" />
            {eyebrow}
          </span>
        )}

        <Heading
          className={`m-0 leading-[1.2] tracking-[-0.015em] ${
            size === "sm"
              ? "text-[19px] font-extrabold sm:text-[23px]"
              : "text-[23px] font-extrabold sm:text-[31px]"
          } ${dark ? "text-white" : "text-mk-text"}`}
        >
          {title}
        </Heading>

        {!noBar && (
          <span
            aria-hidden
            className={`h-[4px] w-14 rounded-full ${
              dark ? "bg-grad-accent" : "bg-grad-brand"
            }`}
          />
        )}

        {subtitle && (
          <p
            className={`m-0 max-w-[62ch] text-[13.5px] leading-relaxed ${
              dark ? "text-white/70" : "text-mk-muted"
            }`}
          >
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {actions}
        {linkTo && (
          <Link to={linkTo} className={linkClasses}>
            {label}
            {arrow}
          </Link>
        )}
        {!linkTo && onLink && (
          <button type="button" onClick={onLink} className={linkClasses}>
            {label}
            {arrow}
          </button>
        )}
      </div>
    </div>
  );
};

export default SectionHeader;
