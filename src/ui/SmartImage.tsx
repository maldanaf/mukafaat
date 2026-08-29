"use client";

import React, { useState } from "react";

interface Props {
  src?: string | null;
  alt?: string;
  /** اسم العنصر — يُستخدم كبديل نصّي عند غياب/فشل الصورة */
  name?: string;
  className?: string;
  color?: string;
  bg?: string;
  objectFit?: "cover" | "contain";
  /** initial = أول حرف (شعارات صغيرة) · name = اسم العلامة (أغلفة كبيرة) */
  variant?: "initial" | "name";
  /** أول صورة في الصفحة (الهيرو) — لا lazy */
  eager?: boolean;
}

/**
 * صورة مع بديل نظيف بدل أيقونة الصورة المكسورة (كثير من شعارات التجّار
 * تشير إلى روابط خارجية غير متاحة). تُستخدم دائماً داخل `Ratio` أو حاوية
 * لها أبعاد محفوظة حتى لا يحدث قفز تخطيط.
 */
export const SmartImage: React.FC<Props> = ({
  src,
  alt = "",
  name = "",
  className = "",
  color = "#400198",
  bg = "#F1EBFB",
  objectFit = "cover",
  variant = "initial",
  eager = false,
}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    if (variant === "name") {
      return (
        <span
          className={`flex items-center justify-center bg-gradient-to-bl from-[#F1EBFB] to-[#E9E1F8] px-4 text-center font-bold leading-snug ${className}`}
          style={{ color }}
        >
          <span className="mk-clamp-2 text-[15px]">{name}</span>
        </span>
      );
    }
    return (
      <span
        className={`flex items-center justify-center font-bold ${className}`}
        style={{ background: bg, color }}
        aria-hidden={!alt}
      >
        {(name || "?").trim().charAt(0)}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={`${className} ${objectFit === "cover" ? "object-cover" : "object-contain"}`}
    />
  );
};

interface RatioProps {
  /** نسبة الأبعاد بصيغة Tailwind، مثل `aspect-[16/10]` */
  ratio?: string;
  className?: string;
  children?: React.ReactNode;
}

/** حاوية بأبعاد محفوظة — تمنع قفزات التخطيط أثناء تحميل الصور */
export const Ratio: React.FC<RatioProps> = ({
  ratio = "aspect-[16/10]",
  className = "",
  children,
}) => (
  <div className={`relative w-full overflow-hidden ${ratio} ${className}`}>
    <div className="absolute inset-0 [&>*]:h-full [&>*]:w-full">{children}</div>
  </div>
);

export default SmartImage;
