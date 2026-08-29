"use client";

import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiCheck, FiX, FiGift } from "react-icons/fi";
import { AxiosError } from "axios";
import { useValidateCoupon } from "@hooks/api/useMokafaatQueries";
import type {
  CouponValidateResult,
  DiscountCodeScope,
} from "@network/services/mokafaatService";
import { FOCUS } from "@ui";

/**
 * حقل «كوبون خصم» — يتحقّق من الخادم (POST /api/coupons/validate)
 * ويرجّع قيمة الخصم للصفحة كي تُعيد حساب الإجمالي.
 *
 * ملاحظة: الخادم يحسب خصم الكوبون على سعر الباقة كاملاً (`plan->price`)،
 * فالقيمة المعروضة هنا تقريبية حتى يعيد `subscribe` الحساب النهائي.
 */
export interface CouponCodeInputProps {
  scope: DiscountCodeScope;
  itemId?: number | string;
  onChange: (result: CouponValidateResult | null) => void;
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

const CouponCodeInput: React.FC<CouponCodeInputProps> = ({
  scope,
  itemId,
  onChange,
  variant = "default",
  className = "",
}) => {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<CouponValidateResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const validate = useValidateCoupon();

  const isDark = variant === "dark";

  const handleApply = useCallback(() => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setErrorMsg(null);
    validate.mutate(
      { code: trimmed, scope, item_id: itemId },
      {
        onSuccess: (resp: unknown) => {
          const root = resp as Record<string, unknown> | undefined;
          if (root?.status === false) {
            setErrorMsg((root.msg as string) || t("payment.couponInvalid"));
            return;
          }
          const parsed = parseCoupon(resp);
          if (!parsed) {
            setErrorMsg(t("payment.couponInvalid"));
            return;
          }
          setApplied(parsed);
          onChange(parsed);
        },
        onError: (err) => {
          if (err instanceof AxiosError) {
            const msg = (err.response?.data as { msg?: string } | undefined)?.msg;
            setErrorMsg(msg || t("payment.couponInvalid"));
            return;
          }
          setErrorMsg(t("payment.couponInvalid"));
        },
      },
    );
  }, [code, scope, itemId, validate, onChange, t]);

  const handleRemove = useCallback(() => {
    setApplied(null);
    setCode("");
    setErrorMsg(null);
    onChange(null);
  }, [onChange]);

  if (applied) {
    return (
      <div
        className={`flex items-center justify-between gap-3 rounded-mk-md border p-3 ${
          isDark
            ? "border-emerald-400/40 bg-emerald-500/10"
            : "border-emerald-200 bg-emerald-50"
        } ${className}`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
              isDark
                ? "bg-emerald-400/20 text-emerald-200"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            <FiCheck />
          </span>
          <span className="min-w-0">
            <span
              className={`block truncate text-sm font-bold ${
                isDark ? "text-white" : "text-mk-text"
              }`}
            >
              {applied.coupon_code}
            </span>
            <span
              className={`block text-xs ${
                isDark ? "text-emerald-200" : "text-emerald-700"
              }`}
            >
              {t("payment.couponApplied")}
            </span>
          </span>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          aria-label={t("payment.couponRemove")}
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition ${
            isDark
              ? "bg-white/10 text-white hover:bg-white/20"
              : "bg-mk-tint2 text-mk-text-strong hover:bg-mk-border-strong"
          } ${FOCUS}`}
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
        htmlFor="mk-coupon-code"
      >
        <FiGift className="opacity-70" />
        {t("payment.couponLabel")}
      </label>

      <div className="flex gap-2">
        <input
          id="mk-coupon-code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder={t("payment.couponPlaceholder")}
          disabled={validate.isPending}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleApply();
            }
          }}
          className={`min-h-[48px] flex-1 rounded-mk-md border px-4 text-sm uppercase tracking-wider outline-none ${
            isDark
              ? "border-white/20 bg-white/10 text-white placeholder-white/50 focus:border-mk-accent"
              : "border-mk-border-strong bg-white text-mk-text placeholder-mk-faint focus:border-mk-accent"
          }`}
        />
        <button
          type="button"
          onClick={handleApply}
          disabled={!code.trim() || validate.isPending}
          className={`min-h-[48px] rounded-mk-md bg-mk-accent px-5 text-sm font-bold text-white transition hover:bg-mk-accent-dark disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`}
        >
          {validate.isPending ? t("payment.applying") : t("payment.apply")}
        </button>
      </div>

      {errorMsg && (
        <p
          className={`mt-2 rounded-mk-sm px-3 py-2 text-xs ${
            isDark
              ? "border border-red-500/40 bg-red-500/20 text-red-200"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {errorMsg}
        </p>
      )}
    </div>
  );
};

export default CouponCodeInput;
