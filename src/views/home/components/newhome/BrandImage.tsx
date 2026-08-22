"use client";

import { useState } from "react";

interface Props {
  src?: string | null;
  alt?: string;
  name?: string;
  className?: string;
  /** لون النص/الخلفية البديلة عند فشل تحميل الصورة */
  color?: string;
  bg?: string;
  objectFit?: "cover" | "contain";
  /** initial = أول حرف (للشعارات الصغيرة) · name = اسم العلامة (للأغلفة الكبيرة) */
  variant?: "initial" | "name";
}

/**
 * صورة علامة تجارية مع بديل نظيف (أول حرف من الاسم) بدل أيقونة الصورة المكسورة،
 * لأن بعض شعارات التجّار في قاعدة البيانات تشير إلى روابط خارجية غير متاحة.
 */
const BrandImage: React.FC<Props> = ({
  src,
  alt = "",
  name = "",
  className = "",
  color = "#4C1D95",
  bg = "#F1EBFB",
  objectFit = "cover",
  variant = "initial",
}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    if (variant === "name") {
      return (
        <span
          className={`flex items-center justify-center bg-gradient-to-bl from-[#F1EBFB] to-[#E9E1F8] px-4 text-center font-bold leading-snug ${className}`}
          style={{ color }}
        >
          <span className="line-clamp-2 text-[15px]">{name}</span>
        </span>
      );
    }
    return (
      <span
        className={`flex items-center justify-center font-bold ${className}`}
        style={{ background: bg, color }}
      >
        {(name || "?").trim().charAt(0)}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${className} ${objectFit === "cover" ? "object-cover" : "object-contain"}`}
    />
  );
};

export default BrandImage;
