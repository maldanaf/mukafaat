"use client";

import React from "react";

export type BadgeTone =
  | "primary"
  | "accent"
  | "gold"
  | "success"
  | "danger"
  | "neutral"
  | "info"
  | "solid-primary"
  | "solid-accent"
  | "solid-danger"
  /* ===== نغمات الاتجاه «الحيوي التجاري» ===== */
  | "grad-primary"
  | "grad-accent"
  | "grad-hot"
  | "grad-gold"
  | "grad-success"
  | "warning"
  | "glass";

const TONES: Record<BadgeTone, string> = {
  primary: "bg-mk-tint text-mk-primary",
  accent: "bg-mk-warm-tint text-mk-accent-dark",
  gold: "bg-[#FDF4DE] text-[#8A6209]",
  success: "bg-[#E4F6EF] text-mk-green",
  danger: "bg-[#FDE9EB] text-mk-red",
  warning: "bg-[#FEF3E2] text-mk-amber",
  neutral: "bg-mk-tint2 text-mk-muted",
  info: "bg-[#E8EEFD] text-mk-info",
  "solid-primary": "bg-grad-brand text-white shadow-[0_6px_16px_-6px_rgba(64,1,152,0.7)]",
  "solid-accent": "bg-grad-accent text-white shadow-mk-badge",
  "solid-danger": "bg-mk-red text-white shadow-[0_6px_16px_-6px_rgba(232,56,79,0.7)]",
  "grad-primary": "bg-grad-brand text-white shadow-[0_8px_20px_-6px_rgba(64,1,152,0.75)]",
  "grad-accent": "bg-grad-accent text-white shadow-mk-badge",
  "grad-hot": "bg-grad-hot text-white shadow-[0_8px_20px_-6px_rgba(194,24,91,0.8)]",
  "grad-gold": "bg-grad-gold text-[#241A04] shadow-[0_8px_20px_-6px_rgba(224,138,11,0.75)]",
  "grad-success": "bg-grad-success text-white shadow-[0_8px_20px_-6px_rgba(18,160,106,0.7)]",
  glass: "border border-white/25 bg-white/15 text-white backdrop-blur-sm",
};

interface Props {
  children?: React.ReactNode;
  tone?: BadgeTone;
  icon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
  title?: string;
  /** نبض خفيف — لشارات «ينتهي اليوم / الأكثر طلباً» */
  pulse?: boolean;
  /** لمعة تمرّ فوق الشارة عند مرور المؤشّر على الكرت */
  shine?: boolean;
}

const SIZES: Record<NonNullable<Props["size"]>, string> = {
  sm: "px-2 py-1 text-[10.5px]",
  md: "px-2.5 py-1.5 text-[11.5px]",
  lg: "px-3 py-1.5 text-[13px]",
};

/** شارة موحّدة (نسبة خصم، مفتوح الآن، VIP، حالة طلب…) */
const Badge: React.FC<Props> = ({
  children,
  tone = "primary",
  icon,
  size = "md",
  className = "",
  title,
  pulse = false,
  shine = false,
}) => (
  <span
    title={title}
    className={[
      "inline-flex max-w-full items-center gap-1 rounded-full font-extrabold leading-none",
      SIZES[size],
      TONES[tone],
      pulse ? "mk-badge-pulse" : "",
      shine ? "mk-shine" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
  >
    {icon}
    <span className="truncate">{children}</span>
  </span>
);

export default Badge;
