"use client";

/**
 * ===== مجموعة مكوّنات «منطقة الحساب» =====
 *
 * لغة بصرية واحدة لكل صفحات `/profile` بالاتجاه «الحيوي التجاري»:
 * تدرّجات قوية (`bg-grad-*`)، شارات بارزة، كروت بأيقونات ملوّنة، وحركة عند اللمس.
 * كل القيم من نظام التصميم (`@ui`) — لا ألوان يدوية جديدة.
 */

import React from "react";
import { Link } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { LuChevronLeft } from "react-icons/lu";
import {
  Badge,
  EmptyState,
  ErrorState,
  Skeleton,
  SkeletonRows,
  FOCUS,
  type BadgeTone,
} from "@ui";

/* ===================== لوحة ألوان خدمات الحساب ===================== */

/** نغمة الأيقونة الملوّنة داخل صفوف/مربّعات الحساب */
export interface Tint {
  /** لون الأيقونة */
  c: string;
  /** خلفية المربّع */
  bg: string;
}

/** ألوان ثابتة لكل خدمة — مطابقة لألوان قائمة لوحة الحساب */
export const TINTS = {
  purple: { c: "#400198", bg: "#F1EBFB" },
  violet: { c: "#6703EB", bg: "#F0EAFD" },
  orange: { c: "#FD671A", bg: "#FEF0E4" },
  amber: { c: "#B45309", bg: "#FDF1DF" },
  teal: { c: "#0E9384", bg: "#E4F5F2" },
  pink: { c: "#C2246E", bg: "#FCE9F1" },
  blue: { c: "#1D4ED8", bg: "#E8EEFD" },
  red: { c: "#E8384F", bg: "#FDE9EB" },
  grey: { c: "#6B6B85", bg: "#F2EFFA" },
} as const satisfies Record<string, Tint>;

export type TintName = keyof typeof TINTS;

/**
 * نصّ داكن فوق الألوان الفاتحة (الذهبي مثلاً) وأبيض فوق الداكنة —
 * يضمن تباين شارة المستوى مهما كان اللون القادم من الـ API.
 */
function readableOn(hex: string): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  // معادلة السطوع المدرك (YIQ)
  return (r * 299 + g * 587 + b * 114) / 1000 >= 150 ? "#241A04" : "#FFFFFF";
}

/* ===================== مربّع أيقونة ملوّن ===================== */

interface IconBoxProps {
  tint: TintName | Tint;
  size?: "sm" | "md" | "lg";
  /** يملأ المربّع بتدرّج الهوية بدل الخلفية الفاتحة (للترويسات البارزة) */
  solid?: boolean;
  children: React.ReactNode;
  className?: string;
}

const BOX_SIZE = {
  sm: "h-9 w-9 rounded-mk-sm text-[17px]",
  md: "h-11 w-11 rounded-mk-md text-[19px]",
  lg: "h-14 w-14 rounded-mk-lg text-[24px]",
} as const;

/** مربّع أيقونة ملوّن — العنصر الأساسي في كل قوائم ومربّعات الحساب */
export const IconBox: React.FC<IconBoxProps> = ({
  tint,
  size = "md",
  solid = false,
  children,
  className = "",
}) => {
  const t = typeof tint === "string" ? TINTS[tint] : tint;
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center ${BOX_SIZE[size]} ${className}`}
      style={
        solid
          ? {
              backgroundImage: `linear-gradient(135deg, ${t.c} 0%, ${t.c}CC 100%)`,
              color: "#fff",
              boxShadow: `0 10px 22px -10px ${t.c}`,
            }
          : { background: t.bg, color: t.c }
      }
    >
      {children}
    </span>
  );
};

/* ===================== كرت المستخدم العلوي ===================== */

export interface AccountHeroStat {
  label: string;
  value: React.ReactNode;
  to?: string;
}

interface HeroProps {
  name: string;
  subtitle?: string;
  avatar?: string | null;
  /** زر تغيير الصورة (يُلصق على زاوية الأفاتار) */
  avatarAction?: React.ReactNode;
  /** اسم المستوى (برونزي/فضي/ذهبي…) ولونه القادم من الـ API */
  tierName?: string | null;
  tierColor?: string | null;
  tierIcon?: React.ReactNode;
  /** حالة الاشتراك */
  isSubscribed?: boolean;
  planName?: string | null;
  expiresLabel?: string | null;
  /** رقم العضوية — يظهر كشارة زجاجية */
  membershipNumber?: string | null;
  stats?: AccountHeroStat[];
  /** إجراءات أسفل الكرت (اشترك الآن / تعديل البيانات…) */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * كرت المستخدم العلوي — تدرّج بنفسجي عميق مع هالة برتقالية،
 * الاسم والمستوى وحالة الاشتراك وأرقام سريعة. نفس رأس شاشة «المزيد» في التطبيق.
 */
export const AccountHero: React.FC<HeroProps> = ({
  name,
  subtitle,
  avatar,
  avatarAction,
  tierName,
  tierColor,
  tierIcon,
  isSubscribed,
  planName,
  expiresLabel,
  membershipNumber,
  stats = [],
  actions,
  className = "",
}) => {
  const { t } = useTranslation();
  const tier = tierColor && /^#([0-9a-f]{3}){1,2}$/i.test(tierColor) ? tierColor : null;

  return (
    <section
      className={`relative isolate overflow-hidden rounded-mk-2xl bg-grad-brand-deep p-5 text-white shadow-mk-glow sm:p-6 ${className}`}
    >
      {/* هالات لونية — تُعطي العمق «الحيوي» بلا صور */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-24 end-[-60px] h-56 w-56 rounded-full bg-mk-accent/35 blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-28 start-[-40px] h-52 w-52 rounded-full bg-mk-primary-light/45 blur-3xl"
      />

      <div className="relative flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <span className="block rounded-mk-xl bg-white/15 p-1 ring-1 ring-white/25 backdrop-blur-sm">
              {avatar ? (
                <img
                  src={avatar}
                  alt=""
                  className="h-16 w-16 rounded-[14px] object-cover sm:h-[76px] sm:w-[76px]"
                />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-[14px] bg-white/20 text-[26px] font-bold sm:h-[76px] sm:w-[76px]">
                  {(name || "?").trim().charAt(0)}
                </span>
              )}
            </span>
            {avatarAction}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="m-0 truncate text-[19px] font-bold leading-tight sm:text-[23px]">
              {name || t("account.hero_fallback_name", "مرحباً بك")}
            </h1>
            {subtitle && (
              <p className="m-0 mt-1 truncate text-[12.5px] text-mk-lilac">{subtitle}</p>
            )}

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {tierName && (
                <span
                  className="inline-flex max-w-full items-center gap-1 rounded-full border border-white/25 px-2.5 py-1 text-[11.5px] font-bold leading-none"
                  style={{
                    backgroundImage: tier
                      ? `linear-gradient(135deg, ${tier} 0%, ${tier}CC 100%)`
                      : undefined,
                    backgroundColor: tier ? undefined : "rgba(255,255,255,0.18)",
                    color: tier ? readableOn(tier) : "#FFFFFF",
                  }}
                >
                  {tierIcon}
                  <span className="truncate">{tierName}</span>
                </span>
              )}
              <Badge
                size="sm"
                tone={isSubscribed ? "grad-success" : "grad-accent"}
                className={isSubscribed ? "" : "mk-badge-pulse"}
              >
                {isSubscribed
                  ? planName || t("profile.subscription_active", "اشتراك فعّال")
                  : t("profile.subscription_inactive", "غير مشترك")}
              </Badge>
              {membershipNumber && (
                <Badge size="sm" tone="glass" className="font-mono tracking-wider">
                  <span dir="ltr">{membershipNumber}</span>
                </Badge>
              )}
            </div>

            {isSubscribed && expiresLabel && (
              <p className="m-0 mt-1.5 text-[11.5px] text-mk-lilac">{expiresLabel}</p>
            )}
          </div>
        </div>

        {stats.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {stats.map((stat) => {
              const inner = (
                <>
                  <span className="block text-[17px] font-bold leading-none tabular-nums">
                    {stat.value}
                  </span>
                  <span className="mt-1 block truncate text-[11px] text-mk-lilac">
                    {stat.label}
                  </span>
                </>
              );
              const base =
                "rounded-mk-md border border-white/15 bg-white/10 px-2.5 py-2.5 text-center backdrop-blur-sm";
              return stat.to ? (
                <Link
                  key={stat.label}
                  to={stat.to}
                  className={`${base} transition-colors hover:bg-white/20 active:bg-white/25 ${FOCUS}`}
                >
                  {inner}
                </Link>
              ) : (
                <div key={stat.label} className={base}>
                  {inner}
                </div>
              );
            })}
          </div>
        )}

        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </section>
  );
};

/* ===================== شبكة الخدمات ===================== */

export interface ServiceItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tint: TintName;
  /** رقم صغير بارز أعلى الأيقونة (إشعارات غير مقروءة مثلاً) */
  badge?: number;
}

/** شبكة خدمات بأيقونات ملوّنة — قلب شاشة «المزيد» في التطبيق */
export const ServiceGrid: React.FC<{
  items: ServiceItem[];
  className?: string;
}> = ({ items, className = "" }) => (
  <div className={`grid grid-cols-4 gap-2.5 sm:grid-cols-6 ${className}`}>
    {items.map((item) => {
      const Icon = item.icon;
      return (
        <Link
          key={`${item.to}-${item.label}`}
          to={item.to}
          className={`mk-lift relative flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-mk-lg border border-mk-border bg-white p-2 text-center shadow-mk-card active:scale-[0.97] ${FOCUS}`}
        >
          <IconBox tint={item.tint} size="md">
            <Icon className="h-[19px] w-[19px]" />
          </IconBox>
          <span className="mk-clamp-2 text-[10.5px] font-bold leading-tight text-mk-text-strong">
            {item.label}
          </span>
          {!!item.badge && item.badge > 0 && (
            <span className="absolute end-2 top-2 min-w-[18px] rounded-full bg-grad-accent px-1 text-center text-[10px] font-bold leading-[18px] text-white shadow-mk-badge">
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          )}
        </Link>
      );
    })}
  </div>
);

/* ===================== كرت قسم بترويسة ملوّنة ===================== */

interface PanelProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  tint?: TintName;
  /** إجراء على طرف الترويسة */
  action?: React.ReactNode;
  /** بلا حشوة داخلية (للقوائم `divide-y` الملاصقة للحواف) */
  flush?: boolean;
  children?: React.ReactNode;
  className?: string;
}

/** كرت قسم موحّد: ترويسة بأيقونة ملوّنة + محتوى */
export const AccountPanel: React.FC<PanelProps> = ({
  title,
  subtitle,
  icon,
  tint = "purple",
  action,
  flush = false,
  children,
  className = "",
}) => (
  <section
    className={`overflow-hidden rounded-mk-xl border border-mk-border bg-white shadow-mk-card ${className}`}
  >
    <header className="flex items-center gap-3 border-b border-mk-divider bg-grad-mist px-4 py-3.5 sm:px-5">
      {icon && (
        <IconBox tint={tint} size="sm" solid>
          {icon}
        </IconBox>
      )}
      <div className="min-w-0 flex-1">
        <h2 className="m-0 truncate text-[15px] font-bold text-mk-text sm:text-[16px]">
          {title}
        </h2>
        {subtitle && (
          <p className="m-0 mt-0.5 mk-clamp-1 text-[12px] text-mk-muted">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </header>
    <div className={flush ? "" : "p-4 sm:p-5"}>{children}</div>
  </section>
);

/* ===================== ترويسة صفحة داخل الحساب ===================== */

interface PageHeadProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  tint?: TintName;
  actions?: React.ReactNode;
  className?: string;
}

/** ترويسة صفحة فرعية في الحساب — أيقونة ملوّنة + عنوان + إجراءات */
export const AccountPageHead: React.FC<PageHeadProps> = ({
  title,
  subtitle,
  icon,
  tint = "purple",
  actions,
  className = "",
}) => (
  <div className={`flex flex-wrap items-center gap-3 ${className}`}>
    {icon && (
      <IconBox tint={tint} size="md" solid>
        {icon}
      </IconBox>
    )}
    <div className="min-w-0 flex-1">
      <h1 className="m-0 text-[18px] font-bold text-mk-text sm:text-[21px]">{title}</h1>
      {subtitle && (
        <p className="m-0 mt-0.5 text-[12.5px] leading-relaxed text-mk-muted">{subtitle}</p>
      )}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

/* ===================== صف قائمة قابل للنقر ===================== */

interface RowProps {
  to?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  tint?: TintName;
  label: string;
  hint?: string;
  /** قيمة/شارة على الطرف */
  value?: React.ReactNode;
  danger?: boolean;
}

/** صف إعدادات/تنقّل موحّد داخل `AccountPanel` */
export const AccountRow: React.FC<RowProps> = ({
  to,
  onClick,
  icon,
  tint = "purple",
  label,
  hint,
  value,
  danger = false,
}) => {
  const body = (
    <>
      {icon && (
        <IconBox tint={danger ? "red" : tint} size="sm">
          {icon}
        </IconBox>
      )}
      <span className="min-w-0 flex-1 text-start">
        <span
          className={`block truncate text-[13.5px] font-semibold ${
            danger ? "text-mk-red" : "text-mk-text"
          }`}
        >
          {label}
        </span>
        {hint && <span className="mt-0.5 block truncate text-[11.5px] text-mk-faint">{hint}</span>}
      </span>
      {value}
      {(to || onClick) && (
        <LuChevronLeft
          aria-hidden
          className="h-4 w-4 shrink-0 text-mk-faint rtl:rotate-0 ltr:rotate-180"
        />
      )}
    </>
  );

  const cls = `flex min-h-[56px] w-full items-center gap-3 px-4 py-2.5 transition-colors sm:px-5 ${
    danger ? "hover:bg-[#FFF7F8]" : "hover:bg-mk-tint3"
  } active:bg-mk-tint2 ${FOCUS}`;

  if (to) {
    return (
      <Link to={to} className={cls}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls}>
        {body}
      </button>
    );
  }
  return <div className={cls.replace("hover:bg-mk-tint3", "").replace("active:bg-mk-tint2", "")}>{body}</div>;
};

/* ===================== شريط تقدّم بتدرّج ===================== */

export const AccountProgress: React.FC<{
  percent: number;
  tone?: "accent" | "brand" | "success";
  className?: string;
}> = ({ percent, tone = "accent", className = "" }) => {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  const fill =
    tone === "brand" ? "bg-grad-brand" : tone === "success" ? "bg-grad-success" : "bg-grad-accent";
  return (
    <div
      className={`h-2.5 w-full overflow-hidden rounded-full bg-mk-tint2 ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full ${fill} transition-[width] duration-500 ease-out`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
};

/* ===================== مربّع رقم سريع ===================== */

export const AccountStat: React.FC<{
  label: string;
  value: React.ReactNode;
  tint?: TintName;
}> = ({ label, value, tint = "purple" }) => {
  const c = TINTS[tint];
  return (
    <div
      className="rounded-mk-md border border-mk-border bg-white px-3 py-3 text-center shadow-mk-card"
      style={{ borderBottom: `3px solid ${c.c}` }}
    >
      <p className="m-0 text-[18px] font-bold leading-none tabular-nums" style={{ color: c.c }}>
        {value}
      </p>
      <p className="m-0 mt-1.5 text-[11px] leading-tight text-mk-muted">{label}</p>
    </div>
  );
};

/* ===================== حالات موحّدة (تحميل/فراغ/خطأ) ===================== */

/** هيكل تحميل موحّد لصفحات الحساب: كرت علوي + صفوف */
export const AccountLoading: React.FC<{ rows?: number; hero?: boolean }> = ({
  rows = 4,
  hero = false,
}) => (
  <div className="space-y-4" role="status" aria-label="loading">
    {hero && <Skeleton className="h-40 w-full rounded-mk-2xl" />}
    <SkeletonRows count={rows} />
  </div>
);

/** حالة فراغ موحّدة داخل قسم الحساب */
export const AccountEmpty: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
}> = (props) => <EmptyState compact {...props} className="border-0 shadow-none" />;

/** حالة خطأ موحّدة داخل قسم الحساب */
export const AccountError: React.FC<{
  description?: string;
  onRetry?: () => void;
}> = ({ description, onRetry }) => (
  <ErrorState compact description={description} onRetry={onRetry} />
);

/* ===================== نداء ترقية بارز ===================== */

/** بانر ترقية/اشتراك بتدرّج برتقالي — أبرز نداء فعل في منطقة الحساب */
export const AccountUpsell: React.FC<{
  title: string;
  description?: string;
  ctaLabel: string;
  to: string;
  icon?: React.ReactNode;
  tone?: "accent" | "brand";
}> = ({ title, description, ctaLabel, to, icon, tone = "accent" }) => (
  <section
    className={`relative isolate overflow-hidden rounded-mk-xl p-5 text-white ${
      tone === "accent" ? "bg-grad-accent shadow-mk-glow-accent" : "bg-grad-brand shadow-mk-glow"
    }`}
  >
    <span
      aria-hidden
      className="pointer-events-none absolute -top-16 end-[-40px] h-40 w-40 rounded-full bg-white/20 blur-2xl"
    />
    <div className="relative flex flex-wrap items-center gap-4">
      {icon && (
        <span
          aria-hidden
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-mk-md bg-white/20 text-[24px] backdrop-blur-sm"
        >
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="m-0 text-[16px] font-bold">{title}</p>
        {description && (
          <p className="m-0 mt-1 text-[12.5px] leading-relaxed text-white/85">{description}</p>
        )}
      </div>
      {/* زر أبيض صلب فوق التدرّج — لا نستخدم `Button` حتى لا تغلبه ألوان النغمة */}
      <Link
        to={to}
        className={`inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-mk-md px-5 text-[13.5px] font-bold text-mk-primary shadow-mk-raised transition-transform hover:scale-[1.02] active:scale-[0.98] ${FOCUS}`}
        style={{ background: "#FFFFFF" }}
      >
        {ctaLabel}
      </Link>
    </div>
  </section>
);

/* ===================== شارة حالة موحّدة ===================== */

const STATUS_TONES: Record<string, BadgeTone> = {
  active: "grad-success",
  applied: "grad-success",
  qualified: "grad-success",
  granted: "success",
  pending: "warning",
  inactive: "neutral",
  expired: "danger",
  used: "neutral",
};

/** شارة حالة (فعّال/معلّق/منتهٍ) بنفس النغمات في كل الحساب */
export const StatusBadge: React.FC<{
  status?: string | null;
  label: string;
  className?: string;
}> = ({ status, label, className = "" }) => (
  <Badge
    size="sm"
    tone={STATUS_TONES[String(status ?? "").toLowerCase()] ?? "neutral"}
    className={`shrink-0 ${className}`}
  >
    {label}
  </Badge>
);
