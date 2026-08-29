"use client";

import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiCheck, FiTag, FiX } from "react-icons/fi";
import { AxiosError } from "axios";
import {
  useValidateCoupon,
  useValidateDiscountCode,
} from "@hooks/api/useMokafaatQueries";
import type {
  CouponValidateResult,
  DiscountCodeResult,
  DiscountCodeScope,
} from "@network/services/mokafaatService";
import { FOCUS } from "@ui";

/**
 * حقل واحد لكود الخصم أو الكوبون.
 *
 * الخادم يفرّق بين نوعين (كوبون `coupon_code` وكود خصم `discount_code`)
 * لكن العميل لا يعرف نوع الكود الذي بيده — فكان عرض حقلين يبدو تكراراً.
 * هنا نجرّب الكوبون أولاً، وإن لم يُقبل نجرّب كود الخصم، ونعرض نتيجة واحدة.
 */
export interface PromoCodeInputProps {
  scope: DiscountCodeScope;
  /** المبلغ قبل الخصم — لازم للتحقق من كود الخصم */
  amount: number;
  itemId?: number | string;
  merchantId?: number | string;
  onCouponChange: (result: CouponValidateResult | null) => void;
  onDiscountChange: (result: DiscountCodeResult | null) => void;
  variant?: "default" | "dark";
  className?: string;
}

function parseCoupon(payload: unknown): CouponValidateResult | null {
  const root = payload as Record<string, unknown> | undefined;
  if (!root) return null;
  const level1 = (root.data ?? root) as Record<string, unknown>;
  const level2 = (level1.data ?? level1) as Record<string, unknown>;
  const code = level2.coupon_code ?? level2.code;
  if (!code) return null;
  return {
    coupon_id: (level2.coupon_id as number | string) ?? 0,
    coupon_code: String(code),
    original_amount: Number(level2.original_amount ?? 0) || 0,
    discount: Number(level2.discount ?? 0) || 0,
    final_amount: Number(level2.final_amount ?? 0) || 0,
  };
}

function parseDiscount(payload: unknown): DiscountCodeResult | null {
  const root = payload as Record<string, unknown> | undefined;
  if (!root) return null;
  const level1 = (root.data ?? root) as Record<string, unknown>;
  const level2 = (level1.data ?? level1) as Record<string, unknown>;
  const code = level2.code ?? level2.discount_code;
  if (!code) return null;
  return {
    ...(level2 as unknown as DiscountCodeResult),
    code: String(code),
    discount_amount:
      Number(level2.discount_amount ?? level2.discount ?? 0) || 0,
  };
}

const PromoCodeInput: React.FC<PromoCodeInputProps> = ({
  scope,
  amount,
  itemId,
  merchantId,
  onCouponChange,
  onDiscountChange,
  variant = "default",
  className = "",
}) => {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [appliedLabel, setAppliedLabel] = useState<string | null>(null);
  const [appliedValue, setAppliedValue] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validateCoupon = useValidateCoupon();
  const validateDiscount = useValidateDiscountCode();

  const isDark = variant === "dark";

  const readError = (e: unknown): string | null => {
    const err = e as AxiosError<{ msg?: string; message?: string }>;
    return err?.response?.data?.msg ?? err?.response?.data?.message ?? null;
  };

  const handleApply = useCallback(async () => {
    const trimmed = code.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setErrorMsg(null);

    // 1) نجرّب كوبون
    try {
      const res = await validateCoupon.mutateAsync({
        code: trimmed,
        scope,
        item_id: itemId,
      });
      const parsed = parseCoupon(res);
      if (parsed) {
        onCouponChange(parsed);
        onDiscountChange(null);
        setAppliedLabel(parsed.coupon_code);
        setAppliedValue(parsed.discount);
        setLoading(false);
        return;
      }
    } catch (e) {
      // نتجاهل ونجرّب النوع الآخر
      void e;
    }

    // 2) نجرّب كود خصم
    try {
      const res = await validateDiscount.mutateAsync({
        code: trimmed,
        scope,
        amount,
        item_id: itemId,
        merchant_id: merchantId,
      });
      const parsed = parseDiscount(res);
      if (parsed) {
        onDiscountChange(parsed);
        onCouponChange(null);
        setAppliedLabel(parsed.code);
        setAppliedValue(parsed.discount_amount);
        setLoading(false);
        return;
      }
      setErrorMsg(t("payment.promoInvalid"));
    } catch (e) {
      setErrorMsg(readError(e) ?? t("payment.promoInvalid"));
    }

    setLoading(false);
  }, [
    amount,
    code,
    itemId,
    loading,
    merchantId,
    onCouponChange,
    onDiscountChange,
    scope,
    t,
    validateCoupon,
    validateDiscount,
  ]);

  const handleRemove = useCallback(() => {
    setAppliedLabel(null);
    setAppliedValue(0);
    setCode("");
    setErrorMsg(null);
    onCouponChange(null);
    onDiscountChange(null);
  }, [onCouponChange, onDiscountChange]);

  if (appliedLabel) {
    return (
      <div
        className={`flex items-center justify-between gap-3 rounded-mk-lg border px-4 py-3 ${
          isDark
            ? "border-white/20 bg-white/10 text-white"
            : "border-emerald-200 bg-emerald-50 text-emerald-800"
        } ${className}`}
      >
        <span className="flex items-center gap-2 text-sm font-bold">
          <FiCheck className="shrink-0" />
          {appliedLabel}
          {appliedValue > 0 && (
            <span className="text-xs font-normal opacity-80">
              −{appliedValue}
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={handleRemove}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition ${FOCUS} ${
            isDark ? "hover:bg-white/15" : "hover:bg-emerald-100"
          }`}
          aria-label={t("payment.promoRemove")}
        >
          <FiX />
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      <label
        className={`mb-2 flex items-center gap-2 text-sm font-bold ${
          isDark ? "text-white" : "text-mk-text-strong"
        }`}
      >
        <FiTag />
        {t("payment.promoLabel")}
      </label>

      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleApply();
            }
          }}
          placeholder={t("payment.promoPlaceholder")}
          className={`h-11 flex-1 rounded-mk-lg border px-3 text-sm outline-none transition ${FOCUS} ${
            isDark
              ? "border-white/20 bg-white/10 text-white placeholder:text-white/50"
              : "border-mk-border bg-white text-mk-text-strong placeholder:text-mk-text-muted"
          }`}
        />
        <button
          type="button"
          onClick={() => void handleApply()}
          disabled={!code.trim() || loading}
          className={`h-11 rounded-mk-lg px-5 text-sm font-bold transition disabled:opacity-50 ${FOCUS} ${
            isDark
              ? "bg-white text-mk-primary"
              : "bg-mk-primary text-white hover:brightness-110"
          }`}
        >
          {loading ? "…" : t("payment.promoApply")}
        </button>
      </div>

      {errorMsg && (
        <p className="mt-2 text-xs font-medium text-red-600">{errorMsg}</p>
      )}
    </div>
  );
};

export default PromoCodeInput;
