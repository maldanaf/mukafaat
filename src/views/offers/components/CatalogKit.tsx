"use client";

/**
 * ===== أدوات الاتجاه البصري «حيوي تجاري» لصفحات الكتالوج =====
 *
 * ملف محلي داخل نطاق صفحات الكتالوج (العروض/الكوبونات/البطاقات/المحفوظات/
 * الطلبات/صفحة المتجر). لا يعدّل نظام التصميم في `src/ui` بل يستهلكه ويبني
 * فوقه لغة أكثر حيوية: تدرّجات قوية، شارات خصم بارزة، شرائح قابلة للتمرير،
 * وكروت تُرفع بظل ملوّن عند المرور.
 *
 * كل الألوان مأخوذة من توكنات `@ui` (البنفسجي #400198 والبرتقالي #FD671A)
 * حتى تبقى الهوية واحدة بين الموقع والتطبيق.
 */

import React from "react";
import { Link } from "@/lib/router-compat";
import { FOCUS, TAP } from "@ui";

/* ===================== ثوابت الأصناف ===================== */

/** غلاف الكرت الحيوي: حواف 18px، رفع خفيف وظل بنفسجي عند المرور */
export const VIVID_CARD =
  "group/vivid relative flex h-full flex-col overflow-hidden rounded-mk-lg border border-mk-border bg-white shadow-mk-card transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-mk-border-strong hover:shadow-[0_18px_38px_-14px_rgba(64,1,152,0.38)]";

/** حاوية الصورة: تكبير ناعم عند المرور بلا قفزات تخطيط */
export const VIVID_MEDIA =
  "relative overflow-hidden border-b border-mk-border bg-mk-tint2 [&_img]:transition-transform [&_img]:duration-[600ms] group-hover/vivid:[&_img]:scale-[1.07]";

/** تدرّج داكن أسفل الصورة ليقرأ النص فوقها */
export const VIVID_SCRIM =
  "pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,rgba(20,8,50,0.62),rgba(20,8,50,0))]";

/** كرت أبيض لشريط الأدوات في صفحات القوائم */
export const TOOLBAR_CARD =
  "rounded-mk-lg border border-mk-border bg-white p-3.5 shadow-mk-card";

/** حقل إدخال/بحث موحّد داخل شريط الأدوات */
export const TOOLBAR_FIELD = `h-12 rounded-mk-md border border-mk-border-2 bg-mk-tint3 px-4 text-[13.5px] text-mk-text outline-none transition-colors placeholder:text-mk-faint focus:border-mk-primary ${FOCUS}`;

/* ===================== شارة الخصم ===================== */

interface DiscountBadgeProps {
  /** نسبة الخصم — لا يُعرض شيء إن كانت ≤ 0 */
  percent?: number | string | null;
  size?: "sm" | "md" | "lg";
  /** موضع مطلق داخل حاوية الصورة */
  floating?: boolean;
  className?: string;
}

const DISCOUNT_SIZES = {
  sm: "px-2.5 py-1 text-[12px]",
  md: "px-3 py-1.5 text-[14px]",
  lg: "px-3.5 py-2 text-[17px]",
} as const;

/**
 * شارة الخصم البارزة — تدرّج برتقالي مع ظل ملوّن، والرقم بالإنجليزية دائماً
 * (dir="ltr") حتى لا تنقلب علامة `%` في الواجهة العربية.
 */
export const DiscountBadge: React.FC<DiscountBadgeProps> = ({
  percent,
  size = "md",
  floating = false,
  className = "",
}) => {
  const value = Math.round(Number(percent ?? 0));
  if (!Number.isFinite(value) || value <= 0) return null;
  return (
    /* الحاوية تبقى بالاتجاه الموروث حتى تعمل `start/end` صحيحاً في RTL،
       و`dir="ltr"` يوضع على النص وحده حتى لا تنقلب علامة «٪». */
    <span
      className={[
        "inline-flex items-baseline gap-0.5 rounded-full bg-[linear-gradient(135deg,#FD671A_0%,#E2560D_55%,#C7410A_100%)] font-extrabold leading-none text-white shadow-[0_8px_20px_-6px_rgba(226,86,13,0.85)] ring-1 ring-white/25",
        DISCOUNT_SIZES[size],
        floating ? "absolute start-2.5 top-2.5 z-[2]" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span dir="ltr" className="inline-flex items-baseline gap-0.5">
        {value}
        <span className="text-[0.7em] font-bold">%</span>
      </span>
    </span>
  );
};

/**
 * نسبة الخصم للعرض: الحقل الصريح إن وُجد، وإلا تُحسب من السعرين
 * (نفس منطق `offerDiscountPercent` في نظام التصميم) — لأن بعض العروض تعيد
 * `discount_percent = 0` مع فرق سعر حقيقي.
 */
export function discountPercentOf(
  explicit: unknown,
  priceBefore: unknown,
  priceAfter: unknown,
): number {
  const raw = Number(explicit ?? 0);
  if (Number.isFinite(raw) && raw > 0) return Math.round(raw);
  const before = Number(priceBefore ?? 0);
  const after = Number(priceAfter ?? 0);
  if (
    Number.isFinite(before) &&
    Number.isFinite(after) &&
    before > 0 &&
    after >= 0 &&
    after < before
  ) {
    return Math.round(((before - after) / before) * 100);
  }
  return 0;
}

/* ===================== شارات الحالة ===================== */

export type RibbonTone =
  | "new"
  | "hot"
  | "ending"
  | "free"
  | "vip"
  | "info"
  | "muted";

const RIBBON_TONES: Record<RibbonTone, string> = {
  new: "bg-[linear-gradient(135deg,#12A06A,#0B7B50)] text-white shadow-[0_6px_16px_-6px_rgba(18,160,106,0.8)]",
  hot: "bg-[linear-gradient(135deg,#E8384F,#B91C36)] text-white shadow-[0_6px_16px_-6px_rgba(232,56,79,0.8)]",
  ending:
    "bg-[linear-gradient(135deg,#F7B62C,#E2680F)] text-[#3B2405] shadow-[0_6px_16px_-6px_rgba(226,104,15,0.75)]",
  free: "bg-[linear-gradient(135deg,#0E9384,#0A6F63)] text-white shadow-[0_6px_16px_-6px_rgba(14,147,132,0.75)]",
  vip: "bg-[linear-gradient(135deg,#6703EB,#400198)] text-white shadow-[0_6px_16px_-6px_rgba(64,1,152,0.8)]",
  info: "bg-white/95 text-mk-primary shadow-mk-card",
  muted: "bg-mk-tint2 text-mk-muted",
};

interface RibbonProps {
  tone?: RibbonTone;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/** شارة صغيرة متدرّجة: «جديد» / «الأكثر طلباً» / «ينتهي قريباً» */
export const Ribbon: React.FC<RibbonProps> = ({
  tone = "info",
  icon,
  children,
  className = "",
}) => (
  <span
    className={[
      "inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold leading-none",
      RIBBON_TONES[tone],
      className,
    ]
      .filter(Boolean)
      .join(" ")}
  >
    {icon}
    <span className="truncate">{children}</span>
  </span>
);

/* ===================== «ينتهي قريباً» ===================== */

/**
 * عدد الأيام المتبقية لتاريخ انتهاء — `null` لو التاريخ غائب أو غير صالح.
 * تُستخدم لإظهار شارة «ينتهي قريباً» بأمان مع أي حقل ناقص من الـAPI.
 */
export function daysLeft(endDate: unknown): number | null {
  if (endDate == null || endDate === "") return null;
  const ms = new Date(String(endDate)).getTime();
  if (Number.isNaN(ms)) return null;
  return Math.ceil((ms - Date.now()) / 86400000);
}

/** هل العرض ينتهي خلال المدّة المحدّدة (٣ أيام افتراضياً)؟ */
export function isEndingSoon(endDate: unknown, withinDays = 3): boolean {
  const d = daysLeft(endDate);
  return d !== null && d >= 0 && d <= withinDays;
}

/* ===================== شرائح الفلاتر ===================== */

interface ChipProps {
  active?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  count?: number | null;
  children: React.ReactNode;
  className?: string;
  title?: string;
}

/**
 * شريحة فلتر — هدف لمس ≥44px، حالة نشطة بتدرّج بنفسجي وحلقة تركيز واضحة.
 */
export const Chip: React.FC<ChipProps> = ({
  active = false,
  onClick,
  icon,
  count,
  children,
  className = "",
  title,
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    aria-pressed={active}
    className={[
      "inline-flex min-h-[44px] shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 text-[13px] font-bold transition-all duration-200",
      FOCUS,
      active
        ? "bg-[linear-gradient(135deg,#400198,#6703EB)] text-white shadow-[0_8px_20px_-8px_rgba(64,1,152,0.9)]"
        : "border border-mk-border bg-white text-mk-text-strong hover:border-mk-border-strong hover:bg-mk-tint3",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
  >
    {icon}
    <span>{children}</span>
    {count != null && (
      <span
        dir="ltr"
        className={`rounded-full px-1.5 py-0.5 text-[10.5px] font-extrabold leading-none ${
          active ? "bg-white/20 text-white" : "bg-mk-tint text-mk-primary"
        }`}
      >
        {count}
      </span>
    )}
  </button>
);

interface ChipBarProps {
  children: React.ReactNode;
  className?: string;
  /** وصف للقارئ الشاشي */
  label?: string;
}

/**
 * شريط شرائح أفقي قابل للتمرير — يعتمد `.mk-scroll-x` من نظام التصميم
 * (RTL آمن، بلا شريط تمرير ظاهر، ولا يسبّب فيضاً أفقياً للصفحة).
 */
export const ChipBar: React.FC<ChipBarProps> = ({
  children,
  className = "",
  label,
}) => (
  <div
    role="group"
    aria-label={label}
    className={`mk-scroll-x -mx-1 px-1 py-1 ${className}`}
  >
    {children}
  </div>
);

/* ===================== عدّاد النتائج ===================== */

interface ResultsCountProps {
  count?: number | null;
  /** الكلمة بعد الرقم — «عرض» / «كوبون» / «بطاقة»… */
  label: string;
  className?: string;
}

/** عدّاد نتائج بارز — رقم كبير بلون الهوية ثم الوصف */
export const ResultsCount: React.FC<ResultsCountProps> = ({
  count,
  label,
  className = "",
}) => (
  <p className={`m-0 flex items-baseline gap-2 text-[13px] text-mk-muted ${className}`}>
    <span dir="ltr" className="text-[26px] font-extrabold leading-none text-mk-primary">
      {Number(count ?? 0)}
    </span>
    {label}
  </p>
);

/* ===================== قائمة الترتيب ===================== */

interface SortSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  label: string;
  className?: string;
}

/** قائمة ترتيب موحّدة بنفس ارتفاع بقية عناصر شريط الأدوات */
export const SortSelect: React.FC<SortSelectProps> = ({
  value,
  onChange,
  options,
  label,
  className = "",
}) => (
  <label className={`inline-flex items-center gap-2 ${className}`}>
    <span className="sr-only">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className={`h-12 min-w-[150px] cursor-pointer rounded-mk-md border border-mk-border-2 bg-white px-3 text-[13.5px] font-semibold text-mk-text-strong outline-none transition-colors hover:border-mk-border-strong focus:border-mk-primary ${FOCUS}`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </label>
);

/* ===================== زر أيقوني في زاوية الكرت ===================== */

interface CornerButtonProps {
  onClick?: (e: React.MouseEvent) => void;
  label: string;
  pressed?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

/** زر دائري فوق صورة الكرت — هدف لمس 44px وخلفية بيضاء شبه معتمة */
export const CornerButton: React.FC<CornerButtonProps> = ({
  onClick,
  label,
  pressed,
  disabled,
  children,
  className = "",
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    aria-pressed={pressed}
    disabled={disabled}
    className={`flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-mk-text-strong shadow-mk-card backdrop-blur-sm transition-colors hover:bg-white hover:text-mk-primary disabled:opacity-50 ${TAP} ${FOCUS} ${className}`}
  >
    {children}
  </button>
);

/* ===================== ترويسة قسم ===================== */

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * ترويسة قسم حيوية — شريط بنفسجي متدرّج على الجانب ثم العنوان والوصف.
 */
export const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  subtitle,
  actions,
  className = "",
}) => (
  <div className={`mb-5 flex flex-wrap items-end justify-between gap-3 ${className}`}>
    <div className="flex min-w-0 items-stretch gap-3">
      <span
        aria-hidden
        className="w-1.5 shrink-0 rounded-full bg-[linear-gradient(180deg,#FD671A,#400198)]"
      />
      <div className="min-w-0">
        <h2 className="m-0 text-[22px] font-extrabold leading-tight text-mk-primary sm:text-[28px]">
          {title}
        </h2>
        {subtitle && (
          <p className="m-0 mt-1 text-[13.5px] leading-relaxed text-mk-text-strong">
            {subtitle}
          </p>
        )}
      </div>
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

/* ===================== ترويسة صفحة داخل عمود ===================== */

interface PanelHeroProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  icon?: React.ReactNode;
  /** مسار تنقّل مبسّط: عناصر نصية مع روابط اختيارية */
  crumbs?: Array<{ label: string; to?: string }>;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/**
 * ترويسة بتدرّج بنفسجي تصلح داخل عمود لوحة التحكم (حيث لا يمكن استخدام
 * `PageHero` الممتد عرض الصفحة). نفس لغة الترويسة الرئيسية بمقاس أصغر.
 */
export const PanelHero: React.FC<PanelHeroProps> = ({
  title,
  subtitle,
  eyebrow,
  icon,
  crumbs,
  actions,
  children,
  className = "",
}) => (
  <section
    className={`relative overflow-hidden rounded-mk-xl bg-[linear-gradient(150deg,#1B1150_0%,#400198_58%,#6703EB_100%)] p-6 shadow-[0_18px_38px_-18px_rgba(64,1,152,0.55)] sm:p-8 ${className}`}
  >
    {/* توهّج برتقالي خفيف يعطي إحساساً تجارياً */}
    <span
      aria-hidden
      className="pointer-events-none absolute -top-24 end-[-60px] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(253,103,26,0.55),transparent_65%)]"
    />
    <div className="relative">
      {!!crumbs?.length && (
        <nav aria-label="breadcrumb" className="mb-3 min-w-0">
          <ol className="flex flex-wrap items-center gap-1.5 text-[12px] text-white/70">
            {crumbs.map((crumb, i) => (
              <li key={`${crumb.label}-${i}`} className="flex items-center gap-1.5">
                {i > 0 && (
                  <span aria-hidden className="text-white/40">
                    /
                  </span>
                )}
                {crumb.to ? (
                  <Link to={crumb.to} className="transition-colors hover:text-white">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-bold text-mk-accent">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {icon && (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-mk-md bg-white/15 text-white ring-1 ring-white/20">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            {eyebrow && (
              <p className="m-0 text-[12px] font-extrabold tracking-wide text-mk-accent">
                {eyebrow}
              </p>
            )}
            <h1 className="m-0 text-[24px] font-extrabold leading-tight text-white sm:text-[30px]">
              {title}
            </h1>
            {subtitle && (
              <p className="m-0 mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-white/75">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>

      {children && <div className="mt-5">{children}</div>}
    </div>
  </section>
);
