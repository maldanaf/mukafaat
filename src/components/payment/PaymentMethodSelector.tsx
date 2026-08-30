"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PaymentBrandLogo, { type PaymentBrand } from "./PaymentBrandLogo";
import { FOCUS } from "@ui";
import { isApplePayAvailable } from "@utils/moyasar";

/**
 * وسائل الدفع كما في التطبيق
 * (`SubscriptionPaymentMethodView.PaymentMethodType`):
 *  mada      → بطاقة مدى عبر ميسر
 *  applePay  → آبل باي عبر ميسر
 *  card      → بطاقة ائتمانية/مدى عبر ميسر
 *  tamara    → قسّمها على دفعات عبر تمارا (BNPL) — خيار إضافي مستقل
 *  wallet    → الدفع من رصيد النقاط (المحفظة)
 */
export type PaymentMethodType =
  | "mada"
  | "applePay"
  | "card"
  | "tamara"
  | "wallet";

interface MethodDef {
  type: PaymentMethodType;
  labelKey: string;
  brands: PaymentBrand[];
}

const ELECTRONIC: MethodDef[] = [
  { type: "mada", labelKey: "payment.method.mada", brands: ["mada"] },
  { type: "applePay", labelKey: "payment.method.applePay", brands: ["applePay"] },
  {
    type: "card",
    labelKey: "payment.method.card",
    brands: ["visa", "mastercard"],
  },
];

export interface PaymentMethodSelectorProps {
  value: PaymentMethodType;
  onChange: (value: PaymentMethodType) => void;
  /** إخفاء «الدفع من النقاط» (غير متاح في بعض المسارات) */
  walletAllowed?: boolean;
  /** إظهار «قسّمها على دفعات» عبر تمارا — يعتمد على إعداد اللوحة وحدود المبلغ */
  tamaraAllowed?: boolean;
  /** عدد الدفعات المعروض في وصف خيار تمارا */
  tamaraInstalments?: number;
  /** رصيد النقاط المتاح — يُعرض تحت خيار المحفظة */
  walletBalance?: number | null;
  /** تعطيل خيار المحفظة مع إبقائه ظاهراً (رصيد غير كافٍ مثلاً) */
  walletDisabled?: boolean;
  disabled?: boolean;
  className?: string;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  value,
  onChange,
  walletAllowed = true,
  tamaraAllowed = false,
  tamaraInstalments = 3,
  walletBalance = null,
  walletDisabled = false,
  disabled = false,
  className = "",
}) => {
  const { t } = useTranslation();

  // آبل باي متاح في Safari/أجهزة آبل فقط. نفحصه بعد التركيب لا أثناء
  // التصيير على الخادم، وإلا اختلف HTML الخادم عن العميل (hydration).
  const [applePayReady, setApplePayReady] = useState(false);
  useEffect(() => setApplePayReady(isApplePayAvailable()), []);

  const methods = ELECTRONIC.filter(
    (m) => m.type !== "applePay" || applePayReady,
  );

  const card = (def: MethodDef, isDisabled: boolean, note?: string) => {
    const selected = value === def.type;
    return (
      <button
        key={def.type}
        type="button"
        role="radio"
        aria-checked={selected}
        disabled={disabled || isDisabled}
        onClick={() => onChange(def.type)}
        className={[
          "mb-3 flex w-full items-center gap-3 rounded-mk-md border px-3.5 py-3.5 text-start transition-all",
          "min-h-[60px] disabled:cursor-not-allowed disabled:opacity-55",
          selected
            ? "border-[1.8px] border-mk-primary-light bg-[#F7F4FF] shadow-mk-raised"
            : "border-[1.2px] border-[#E7E4F0] bg-white shadow-mk-card hover:border-mk-border-strong",
          FOCUS,
        ].join(" ")}
      >
        {def.brands.map((b) => (
          <PaymentBrandLogo key={b} brand={b} height={22} />
        ))}
        <span className="min-w-0 flex-1">
          <span
            className={`block text-[14px] font-semibold ${
              selected ? "text-mk-primary" : "text-mk-text-strong"
            }`}
          >
            {t(def.labelKey)}
          </span>
          {note && (
            <span className="mt-0.5 block text-[11.5px] text-mk-muted">{note}</span>
          )}
        </span>
        <span
          aria-hidden
          className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border bg-white"
          style={{
            borderWidth: selected ? 6.5 : 1.6,
            borderColor: selected ? "#6703EB" : "#CFCADE",
          }}
        />
      </button>
    );
  };

  return (
    <div className={className} role="radiogroup" aria-label={t("payment.title")}>
      <p className="mb-3 text-[15px] text-mk-muted">
        {t("payment.electronicPayment")}
      </p>
      {methods.map((def) => card(def, false))}

      {tamaraAllowed &&
        card(
          { type: "tamara", labelKey: "payment.method.tamara", brands: ["tamara"] },
          false,
          t("payment.tamaraNote").replace("{{count}}", String(tamaraInstalments)),
        )}

      {walletAllowed && (
        <>
          <p className="mb-3 mt-6 text-[15px] text-mk-muted">
            {t("payment.payThrough")}
          </p>
          {card(
            { type: "wallet", labelKey: "payment.method.wallet", brands: ["wallet"] },
            walletDisabled,
            walletBalance != null
              ? t("payment.walletBalanceNote").replace(
                  "{{points}}",
                  String(Math.round(walletBalance * 100) / 100),
                )
              : undefined,
          )}
        </>
      )}
    </div>
  );
};

export default PaymentMethodSelector;
