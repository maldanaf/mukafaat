"use client";

import React from "react";
import { Link } from "@/lib/router-compat";
import { FOCUS } from "./tokens";

export type ButtonVariant =
  | "primary"
  | "accent"
  | "outline"
  | "soft"
  | "ghost"
  | "dark"
  | "gold"
  | "danger"
  | "hot";

export type ButtonSize = "sm" | "md" | "lg";

/** كل الأحجام ≥44px ارتفاعاً على الموبايل (هدف لمس مريح) */
const SIZES: Record<ButtonSize, string> = {
  sm: "h-11 sm:h-9 px-4 text-[13px] gap-1.5 rounded-mk-md",
  md: "h-12 sm:h-11 px-5 text-[14px] gap-2 rounded-mk-lg",
  lg: "h-13 sm:h-[52px] min-h-[48px] px-7 text-[15px] gap-2 rounded-mk-xl",
};

/**
 * الأنماط الحيوية: التدرّج للأزرار الحاملة للفعل (رئيسي/خصم)،
 * وتوهّج ملوّن بدل الظل الرمادي، ورفع خفيف عند المرور.
 */
const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-grad-brand bg-[length:180%_100%] bg-[position:0%_0%] text-white shadow-mk-glow hover:bg-[position:100%_0%] hover:shadow-[0_18px_38px_-10px_rgba(64,1,152,0.7)] active:shadow-mk-raised",
  accent:
    "bg-grad-accent bg-[length:180%_100%] bg-[position:0%_0%] text-white shadow-mk-glow-accent hover:bg-[position:100%_0%] hover:shadow-[0_18px_38px_-10px_rgba(226,86,13,0.8)] active:shadow-mk-raised",
  hot: "bg-grad-hot text-white shadow-[0_14px_32px_-10px_rgba(194,24,91,0.65)] hover:brightness-110",
  outline:
    "border-[1.5px] border-mk-border-strong bg-white text-mk-primary hover:border-mk-primary hover:bg-mk-tint2 active:bg-mk-tint",
  soft: "bg-mk-tint text-mk-primary hover:bg-mk-border-strong/70 active:bg-mk-border-strong",
  ghost: "bg-transparent text-mk-primary hover:bg-mk-tint2",
  dark: "bg-grad-night text-white hover:brightness-125",
  gold: "bg-grad-gold text-[#241A04] hover:brightness-105 shadow-[0_12px_28px_-10px_rgba(224,138,11,0.7)]",
  danger: "bg-mk-red text-white shadow-[0_12px_28px_-10px_rgba(232,56,79,0.7)] hover:brightness-105",
};

/** المتغيّرات التي ترتفع قليلاً عند المرور (أزرار الفعل فقط) */
const LIFTS = new Set<ButtonVariant>(["primary", "accent", "hot", "gold", "danger", "dark"]);

interface BaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** يمدّ الزر لكامل العرض */
  block?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconEnd?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  /** لمعة تمرّ فوق الزر عند المرور (أزرار الفعل البارزة) */
  shine?: boolean;
}

interface ButtonAsButton
  extends BaseProps,
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> {
  to?: undefined;
  href?: undefined;
}

interface ButtonAsLink extends BaseProps {
  /** مسار داخلي — يُصيّر كـ <Link> */
  to: string;
  href?: undefined;
  target?: string;
  rel?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  "aria-label"?: string;
}

interface ButtonAsAnchor extends BaseProps {
  /** رابط خارجي — يُصيّر كـ <a> */
  href: string;
  to?: undefined;
  target?: string;
  rel?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  "aria-label"?: string;
}

export type ButtonProps = ButtonAsButton | ButtonAsLink | ButtonAsAnchor;

const Spinner = () => (
  <span
    aria-hidden
    className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
  />
);

/**
 * زر الموقع الموحّد — نفس أزرار التطبيق: حواف 10–18px، ظل بنفسجي ناعم،
 * ارتفاع لمس مريح، وحالة تحميل مدمجة.
 */
const Button: React.FC<ButtonProps> = (props) => {
  const {
    variant = "primary",
    size = "md",
    block = false,
    loading = false,
    disabled = false,
    icon,
    iconEnd,
    className = "",
    children,
    shine = false,
    ...rest
  } = props as BaseProps & Record<string, unknown>;

  const canLift = LIFTS.has(variant) && !disabled && !loading;

  const classes = [
    "relative inline-flex items-center justify-center whitespace-nowrap font-bold transition-all duration-200 ease-out",
    SIZES[size],
    VARIANTS[variant],
    canLift ? "hover:-translate-y-0.5 active:translate-y-0" : "",
    shine ? "mk-shine" : "",
    block ? "w-full" : "",
    disabled || loading ? "pointer-events-none opacity-60" : "",
    FOCUS,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const inner = (
    <>
      {loading ? <Spinner /> : icon}
      {children}
      {!loading && iconEnd}
    </>
  );

  if ("to" in props && props.to) {
    const { to, ...anchorRest } = rest as { to: string } & Record<string, unknown>;
    return (
      <Link to={to} className={classes} aria-busy={loading || undefined} {...(anchorRest as object)}>
        {inner}
      </Link>
    );
  }

  if ("href" in props && props.href) {
    return (
      <a className={classes} aria-busy={loading || undefined} {...(rest as object)}>
        {inner}
      </a>
    );
  }

  return (
    <button
      type={(rest as { type?: "button" | "submit" | "reset" }).type ?? "button"}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...(rest as object)}
    >
      {inner}
    </button>
  );
};

export default Button;
