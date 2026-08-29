"use client";

import React from "react";

/**
 * شعارات وسائل الدفع — نفس مجموعة التطبيق
 * (`lib/core/widgets/payment_method_logo.dart` + `payment_brand_logos.dart`):
 * مدى / Apple Pay / فيزا / ماستركارد / المحفظة.
 *
 * كلها SVG داخل الكود (لا ملف خارجي ولا طلب شبكة) داخل إطار أبيض موحّد
 * بنفس نسبة العرض/الارتفاع، حتى تتساوى كروت وسائل الدفع بصرياً.
 */
export type PaymentBrand = "mada" | "applePay" | "visa" | "mastercard" | "wallet";

/** نسبة صندوق كل شعار (عرض/ارتفاع) — تطابق viewBox كي لا يُشوَّه الرسم */
const ASPECTS: Record<PaymentBrand, number> = {
  mada: 2,
  applePay: 2.3,
  visa: 1.55,
  mastercard: 1.55,
  wallet: 1.55,
};

function MadaMark() {
  return (
    <svg viewBox="0 0 80 40" className="h-full w-full" style={{ direction: "ltr" }} role="img" aria-label="mada">
      <rect x="0" y="3" width="18" height="14" rx="2" fill="#1B9AD6" />
      <rect x="0" y="23" width="18" height="14" rx="2" fill="#84BC49" />
      <text
        x="51"
        y="16"
        textAnchor="middle"
        fontSize="16"
        fontWeight="800"
        fill="#25384C"
        textLength="52"
        lengthAdjust="spacingAndGlyphs"
      >
        مدى
      </text>
      <text
        x="51"
        y="37"
        textAnchor="middle"
        fontSize="16"
        fontWeight="800"
        fill="#25384C"
        fontFamily="Helvetica, Arial, sans-serif"
        textLength="52"
        lengthAdjust="spacingAndGlyphs"
      >
        mada
      </text>
    </svg>
  );
}

function ApplePayMark() {
  return (
    <svg viewBox="0 0 80 34" className="h-full w-full" style={{ direction: "ltr" }} role="img" aria-label="Apple Pay">
      {/* شعار التفاحة — مسار متجه بلا أي أصل خارجي */}
      <g fill="#111111" transform="translate(2,3) scale(0.055)">
        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
      </g>
      <text
        x="53"
        y="26"
        textAnchor="middle"
        fontSize="24"
        fontWeight="500"
        fill="#111111"
        fontFamily="Helvetica, Arial, sans-serif"
        textLength="46"
        lengthAdjust="spacingAndGlyphs"
      >
        Pay
      </text>
    </svg>
  );
}

function VisaMark() {
  return (
    <svg viewBox="0 0 62 40" className="h-full w-full" style={{ direction: "ltr" }} role="img" aria-label="Visa">
      <text
        x="31"
        y="28"
        textAnchor="middle"
        fontSize="21"
        fontWeight="800"
        fontStyle="italic"
        fill="#1A1F71"
        fontFamily="Helvetica, Arial, sans-serif"
        letterSpacing="0.5"
      >
        VISA
      </text>
    </svg>
  );
}

function MastercardMark() {
  return (
    <svg viewBox="0 0 62 40" className="h-full w-full" style={{ direction: "ltr" }} role="img" aria-label="Mastercard">
      <circle cx="24" cy="20" r="13" fill="#EB001B" />
      <circle cx="38" cy="20" r="13" fill="#F79E1B" />
      <path
        d="M31 10.3a13 13 0 0 0 0 19.4 13 13 0 0 0 0-19.4z"
        fill="#FF5F00"
      />
    </svg>
  );
}

function WalletMark() {
  return (
    <svg viewBox="0 0 62 40" className="h-full w-full" style={{ direction: "ltr" }} role="img" aria-label="wallet">
      <rect x="12" y="10" width="38" height="22" rx="5" fill="#400198" />
      <rect x="34" y="17" width="18" height="9" rx="4" fill="#FD671A" />
      <circle cx="43" cy="21.5" r="2.2" fill="#FFFFFF" />
    </svg>
  );
}

const MARKS: Record<PaymentBrand, () => React.ReactElement> = {
  mada: MadaMark,
  applePay: ApplePayMark,
  visa: VisaMark,
  mastercard: MastercardMark,
  wallet: WalletMark,
};

export interface PaymentBrandLogoProps {
  brand: PaymentBrand;
  /** ارتفاع الشعار نفسه بالبكسل (بلا الإطار) */
  height?: number;
  /** إطار أبيض بحواف ناعمة حول الشعار كما في التطبيق */
  framed?: boolean;
  className?: string;
}

const PaymentBrandLogo: React.FC<PaymentBrandLogoProps> = ({
  brand,
  height = 22,
  framed = true,
  className = "",
}) => {
  const Mark = MARKS[brand];
  const logo = (
    <span
      dir="ltr"
      className="block shrink-0"
      style={{ height, width: height * ASPECTS[brand] }}
    >
      <Mark />
    </span>
  );

  if (!framed) return <span className={className}>{logo}</span>;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-mk-sm border border-[#D6D9DE] bg-white ${className}`}
      style={{ padding: `${height * 0.16}px ${height * 0.22}px` }}
    >
      {logo}
    </span>
  );
};

export default PaymentBrandLogo;
