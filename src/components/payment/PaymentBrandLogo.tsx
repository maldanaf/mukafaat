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
export type PaymentBrand =
  | "mada"
  | "applePay"
  | "visa"
  | "mastercard"
  | "wallet"
  | "tamara";

/** نسبة صندوق كل شعار (عرض/ارتفاع) — تطابق viewBox كي لا يُشوَّه الرسم */
const ASPECTS: Record<PaymentBrand, number> = {
  mada: 2,
  applePay: 2.3,
  visa: 1.55,
  mastercard: 1.55,
  wallet: 1.55,
  tamara: 3.0,
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

/**
 * شعار تمارا الرسمي (من بوابة شركاء تمارا) — مسار متجه داخل الكود
 * كبقية الشعارات هنا، بلا طلب شبكة. الـ viewBox مقصوص على حدود الرسم.
 */
function TamaraMark() {
  return (
    <svg viewBox="200 408 600 182" className="h-full w-full" style={{ direction: "ltr" }} role="img" aria-label="tamara">
      <path
        fill="#16181D"
        d="M231.15,434.36v118.52c0,.72-.6,1.32-1.33,1.32h-22.16c-.73,0-1.33-.6-1.33-1.32v-118.52c0-.72.6-1.32,1.33-1.32h22.16c.74,0,1.33.6,1.33,1.32ZM302.27,473.08h-22.16c-.73,0-1.33.6-1.33,1.32v71.29c0,8.23-7.18,15.14-15.38,15.14h-17.74c-.93,0-1.56.93-1.25,1.77l8.31,21.97c.19.52.68.85,1.23.85l9.64.05c22.08,0,39.98-17.78,39.98-39.72v-71.35c.02-.74-.58-1.32-1.31-1.32ZM763.78,452.24c10.96.2,19.89-8.67,19.68-19.55-.19-10.26-8.62-18.64-18.94-18.83-10.96-.2-19.89,8.67-19.68,19.55.17,10.27,8.62,18.64,18.94,18.83ZM727.33,451.48c.19.16.44.22.68.13,7.65-2.65,13.09-9.96,12.9-18.52-.24-10.29-8.8-18.61-19.16-18.66-9.44-.03-17.31,6.68-18.99,15.56-.05.24.05.49.24.64l24.33,20.84ZM793.67,472.94v23.61c0,.72-.6,1.32-1.33,1.32h-103.13c1.91,4.76,2.97,9.96,2.97,15.39,0,21.99-17.25,40.02-39,41.51l.25.2h-253.5c-53.92,0-73.65-18.5-73.65-66.48v-54.12c0-.72.6-1.32,1.33-1.32h23.66c.73,0,1.33.6,1.33,1.32v57.99c0,24.14,8.79,34.24,35.76,36.36h223.03c-1.94-4.79-3.02-10.01-3.02-15.47,0-22.24,17.66-40.47,39.79-41.57l-.03-.05h144.2c.74,0,1.33.58,1.33,1.32ZM667.41,513.16c0-9.28-8.09-16.92-17.37-16.92s-16.87,7.63-16.87,16.92,7.59,17.09,16.87,17.09,17.37-7.81,17.37-17.09Z"
      />
    </svg>
  );
}

const MARKS: Record<PaymentBrand, () => React.ReactElement> = {
  mada: MadaMark,
  applePay: ApplePayMark,
  visa: VisaMark,
  mastercard: MastercardMark,
  wallet: WalletMark,
  tamara: TamaraMark,
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
