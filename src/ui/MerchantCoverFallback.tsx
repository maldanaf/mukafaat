"use client";

import React from "react";

/**
 * بديل غلاف المتجر حين لا صورة له.
 *
 * كان أيقونة رمادية واحدة تتكرر على كل المتاجر بلا صور، فتبدو الشبكة
 * كأنها معطّلة. صار لكل متجر لون هادئ مشتقّ من اسمه، فيتمايز عن جاره
 * بلا ضجيج.
 *
 * الألوان فاتحة عمداً: هذه بطاقات ينبغي أن تتراجع خلف المتاجر التي
 * رفعت صورها الحقيقية، لا أن تنافسها. وصفٌّ كامل منها لا يُتعب العين.
 */

/**
 * تدرّجات فاتحة متناسقة مع هوية مكافآت.
 *
 * لكل تدرّج لونُ نصٍّ داكن من العائلة نفسها، ليبقى التباين كافياً
 * للقراءة دون أن يصير اللون صارخاً.
 */
const PALETTE = [
  { from: "#EFE9FB", to: "#E3D9F7", ink: "#4A1D9E" }, // بنفسجي
  { from: "#FFF0E6", to: "#FFE3D1", ink: "#B4501A" }, // برتقالي
  { from: "#E8F3FF", to: "#D9EAFC", ink: "#1B5FA8" }, // أزرق
  { from: "#E9F7EF", to: "#D8F0E3", ink: "#1B7A4B" }, // أخضر
  { from: "#FDEBF2", to: "#FADCE8", ink: "#A82259" }, // وردي
  { from: "#FFF6E0", to: "#FBEDCB", ink: "#8A6410" }, // ذهبي
  { from: "#EDF0FF", to: "#DFE4FC", ink: "#33409C" }, // نيلي
  { from: "#E9F6F7", to: "#D7EDEF", ink: "#12666E" }, // فيروزي
];

/** لون ثابت لكل متجر — الاسم نفسه يعطي اللون نفسه دائماً */
function toneFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0x7fffffff;
  }
  return PALETTE[hash % PALETTE.length];
}

/** أول حرف ذي معنى — نتخطّى «ال» التعريف كي لا تتشابه أغلب المتاجر */
function initialOf(name: string): string {
  const clean = name.trim().replace(/^ال/, "");
  return (clean || name || "؟").charAt(0);
}

interface Props {
  name: string;
  /** الاسم يظهر تحت الحرف في الأغلفة الكبيرة فقط */
  showName?: boolean;
  className?: string;
}

export const MerchantCoverFallback: React.FC<Props> = ({
  name,
  showName = true,
  className = "",
}) => {
  const tone = toneFor(name || "");

  return (
    <div
      className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden ${className}`}
      style={{
        backgroundImage: `linear-gradient(135deg, ${tone.from} 0%, ${tone.to} 100%)`,
      }}
      aria-hidden
    >
      {/* دائرتان خفيفتان تكسران السطح المسطّح بلا لفت نظر */}
      <span
        className="pointer-events-none absolute -end-6 -top-8 h-24 w-24 rounded-full"
        style={{ background: tone.ink, opacity: 0.05 }}
      />
      <span
        className="pointer-events-none absolute -bottom-10 -start-6 h-28 w-28 rounded-full"
        style={{ background: tone.ink, opacity: 0.04 }}
      />

      <span
        className="grid h-12 w-12 place-items-center rounded-full text-[22px] font-extrabold leading-none"
        style={{ background: "rgba(255,255,255,0.72)", color: tone.ink }}
      >
        {initialOf(name)}
      </span>

      {showName && (
        <span
          className="mk-clamp-1 mt-2 max-w-[80%] px-2 text-center text-[12px] font-bold"
          style={{ color: tone.ink, opacity: 0.85 }}
        >
          {name}
        </span>
      )}
    </div>
  );
};

export default MerchantCoverFallback;
