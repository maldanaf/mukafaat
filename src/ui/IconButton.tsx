"use client";

import React from "react";
import { Link } from "@/lib/router-compat";
import { FOCUS } from "./tokens";

export type IconButtonTone = "soft" | "ghost" | "solid" | "overlay" | "outline";
export type IconButtonSize = "sm" | "md" | "lg";

/**
 * مساحة اللمس دائماً ≥44px حتى عندما تكون الدائرة المرئية أصغر:
 * الحجم المرئي من `visual` والمساحة الفعلية من `min-h/min-w`.
 */
const SIZES: Record<IconButtonSize, { box: string; icon: number }> = {
  sm: { box: "h-9 w-9 min-h-[44px] min-w-[44px] sm:h-9 sm:w-9 sm:min-h-0 sm:min-w-0", icon: 16 },
  md: { box: "h-11 w-11 min-h-[44px] min-w-[44px]", icon: 18 },
  lg: { box: "h-12 w-12 min-h-[48px] min-w-[48px]", icon: 20 },
};

const TONES: Record<IconButtonTone, string> = {
  soft: "bg-mk-tint2 text-mk-primary hover:bg-mk-tint active:bg-mk-border-strong",
  ghost: "bg-transparent text-mk-text-strong hover:bg-mk-tint2",
  solid: "bg-mk-primary text-white hover:bg-[#33017a]",
  outline: "border border-mk-border-strong bg-white text-mk-primary hover:bg-mk-tint2",
  /** فوق صورة — سطح أبيض شبه شفاف بظل خفيف */
  overlay:
    "bg-white/95 text-mk-primary shadow-mk-raised backdrop-blur-sm hover:bg-white",
};

interface Props {
  /** يُمرَّر إليه حجم الأيقونة عبر `renderIcon` أو يُستخدم `children` مباشرة */
  children?: React.ReactNode;
  renderIcon?: (size: number) => React.ReactNode;
  label: string;
  tone?: IconButtonTone;
  size?: IconButtonSize;
  onClick?: (e: React.MouseEvent) => void;
  to?: string;
  disabled?: boolean;
  active?: boolean;
  className?: string;
  /** شارة عدد صغيرة (إشعارات/مفضلة) */
  badge?: number | null;
  title?: string;
}

/** زر أيقوني موحّد — دائرة بهدف لمس ≥44px وحلقة تركيز واحدة */
const IconButton: React.FC<Props> = ({
  children,
  renderIcon,
  label,
  tone = "soft",
  size = "md",
  onClick,
  to,
  disabled = false,
  active = false,
  className = "",
  badge = null,
  title,
}) => {
  const s = SIZES[size];
  const classes = [
    "relative inline-flex shrink-0 items-center justify-center rounded-full transition-colors",
    s.box,
    TONES[tone],
    active ? "ring-1 ring-mk-border-strong" : "",
    disabled ? "pointer-events-none opacity-50" : "",
    FOCUS,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const inner = (
    <>
      {renderIcon ? renderIcon(s.icon) : children}
      {badge !== null && badge !== undefined && badge > 0 && (
        <span
          dir="ltr"
          className="absolute -top-0.5 end-0 min-w-[17px] rounded-full bg-mk-red px-1 text-[9.5px] font-bold leading-[17px] text-white"
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} aria-label={label} title={title ?? label} className={classes}>
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={title ?? label}
      aria-pressed={active || undefined}
      className={classes}
    >
      {inner}
    </button>
  );
};

export default IconButton;
