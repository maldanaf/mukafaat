"use client";

import React from "react";
import { Link } from "@/lib/router-compat";
import { FOCUS } from "./tokens";

export type CardPadding = "none" | "sm" | "md" | "lg";

const PADDING: Record<CardPadding, string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-5 sm:p-6",
};

interface Props {
  children?: React.ReactNode;
  className?: string;
  padding?: CardPadding;
  /** يجعل الكرت رابطاً كاملاً قابلاً للضغط */
  to?: string;
  onClick?: () => void;
  /** ظل أقوى + رفع عند المرور */
  interactive?: boolean;
  /** بلا حدود (للكروت داخل أسطح ملوّنة) */
  bare?: boolean;
  /** رفع الكرت + توهّج بنفسجي عند المرور (الاتجاه الحيوي) */
  lift?: boolean;
  /** تكبير ناعم للصورة داخل الكرت عند المرور */
  zoom?: boolean;
  as?: "div" | "article" | "section" | "li";
  ariaLabel?: string;
}

/**
 * كرت الموقع الموحّد — سطح أبيض، حواف 18px، حدّ `#EFEDF7`، ظل بنفسجي ناعم.
 * مطابق لكروت التطبيق (`HomeTokens.cardShadow` + radius 18–20).
 */
const Card: React.FC<Props> = ({
  children,
  className = "",
  padding = "md",
  to,
  onClick,
  interactive = false,
  bare = false,
  lift,
  zoom = false,
  as = "div",
  ariaLabel,
}) => {
  const clickable = Boolean(interactive || to || onClick);
  const shouldLift = lift ?? clickable;

  const classes = [
    "group block overflow-hidden rounded-mk-xl bg-white",
    bare ? "" : "border border-mk-border shadow-mk-card",
    shouldLift
      ? "mk-lift hover:border-mk-border-strong"
      : clickable
        ? "transition-shadow duration-200 hover:shadow-mk-hover"
        : "",
    zoom ? "mk-zoom" : "",
    to || onClick ? FOCUS : "",
    PADDING[padding],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (to) {
    return (
      <Link to={to} className={classes} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${classes} text-start w-full`} aria-label={ariaLabel}>
        {children}
      </button>
    );
  }

  const Tag = as;
  return (
    <Tag className={classes} aria-label={ariaLabel}>
      {children}
    </Tag>
  );
};

export default Card;
