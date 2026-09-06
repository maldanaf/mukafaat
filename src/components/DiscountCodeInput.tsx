"use client";

import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@hooks";
import { FiCheck, FiX, FiTag } from "react-icons/fi";
import { useValidateDiscountCode } from "@hooks/api/useMokafaatQueries";
import type {
  DiscountCodeResult,
  DiscountCodeScope,
} from "@network/services/mokafaatService";
import { AxiosError } from "axios";

export interface DiscountCodeInputProps {
  /** scope on the API (offer/card/subscription) */
  scope: DiscountCodeScope;
  /** total amount BEFORE discount, used to validate */
  amount: number;
  /** offer_id / card_id / plan_id (helps server-side targeting) */
  itemId?: number | string;
  /** merchant_id (offer/card flows only) */
  merchantId?: number | string;
  /** fires when a code is applied or removed; pass the result (or null when removed) */
  onChange: (result: DiscountCodeResult | null) => void;
  /** dark theme variant for the subscription page */
  variant?: "default" | "dark";
  className?: string;
}

const DiscountCodeInput: React.FC<DiscountCodeInputProps> = ({
  scope,
  amount,
  itemId,
  merchantId,
  onChange,
  variant = "default",
  className = "",
}) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<DiscountCodeResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const validateMutation = useValidateDiscountCode();

  const isDark = variant === "dark";

  const handleApply = useCallback(() => {
    if (!code.trim()) return;
    setErrorMsg(null);
    validateMutation.mutate(
      {
        code: code.trim(),
        amount,
        scope,
        item_id: itemId,
        merchant_id: merchantId,
      },
      {
        onSuccess: (resp: unknown) => {
          const root = resp as Record<string, unknown> | undefined;
          if (!root) {
            setErrorMsg(
              t("ui.t_f33ddc", "تعذر التحقق من كود الخصم"),
            );
            return;
          }
          if (root.status === false) {
            setErrorMsg(
              (root.msg as string) ??
                (t("ui.t_b2a53e", "كود الخصم غير صالح")),
            );
            return;
          }
          const data = (root.data ?? root) as { discount_code?: DiscountCodeResult };
          const dc = data?.discount_code;
          if (dc) {
            setApplied(dc);
            onChange(dc);
          } else {
            setErrorMsg(
              t("ui.t_a8c8cd", "تعذر تطبيق كود الخصم"),
            );
          }
        },
        onError: (err) => {
          const fallback = t("ui.t_b2a53e", "كود الخصم غير صالح");
          if (err instanceof AxiosError) {
            const msg = (err.response?.data as { msg?: string } | undefined)
              ?.msg;
            setErrorMsg(msg || fallback);
          } else {
            setErrorMsg(fallback);
          }
        },
      },
    );
  }, [code, amount, scope, itemId, merchantId, validateMutation, isRTL, onChange]);

  const handleRemove = useCallback(() => {
    setApplied(null);
    setCode("");
    setErrorMsg(null);
    onChange(null);
  }, [onChange]);

  if (applied) {
    return (
      <div
        className={`rounded-xl border ${
          isDark
            ? "bg-emerald-500/10 border-emerald-400/40"
            : "bg-emerald-50 border-emerald-200"
        } p-3 flex items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isDark ? "bg-emerald-400/20 text-emerald-200" : "bg-emerald-100 text-emerald-700"
          }`}>
            <FiCheck />
          </div>
          <div className="min-w-0">
            <div className={`font-bold text-sm truncate ${isDark ? "text-white" : "text-gray-800"}`}>
              {applied.title || applied.code}
            </div>
            <div className={`text-xs ${isDark ? "text-emerald-200" : "text-emerald-700"}`}>
              {t("ui.t_d6b72c", "تم خصم")}{" "}
              <span className="font-bold">
                {applied.discount_amount} {isRTL ? "ر.س" : "SAR"}
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition ${
            isDark
              ? "bg-white/10 text-white hover:bg-white/20"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          aria-label={t("ui.t_332873", "إزالة كود الخصم")}
        >
          <FiX />
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      <label
        className={`flex items-center gap-2 text-sm font-bold mb-2 ${
          isDark ? "text-white" : "text-gray-700"
        }`}
      >
        <FiTag className="opacity-70" />
        {t("ui.t_400ad6", "كود الخصم")}
      </label>

      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder={t("ui.t_cd9887", "أدخل كود الخصم")}
          disabled={validateMutation.isPending}
          className={`flex-1 px-4 py-3 rounded-xl border outline-none text-sm tracking-wider uppercase ${
            isDark
              ? "bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-[#fd671a]"
              : "bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:border-[#fd671a]"
          }`}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleApply();
            }
          }}
        />
        <button
          type="button"
          onClick={handleApply}
          disabled={!code.trim() || validateMutation.isPending || amount <= 0}
          className="px-5 py-3 rounded-xl bg-[#fd671a] text-white font-bold text-sm hover:bg-[#D9500B] disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {validateMutation.isPending
            ? t("ui.t_343b7d", "جاري...")
            : t("ui.t_b177f0", "تطبيق")}
        </button>
      </div>

      {errorMsg && (
        <div
          className={`mt-2 text-xs px-3 py-2 rounded-lg ${
            isDark
              ? "bg-red-500/20 text-red-200 border border-red-500/40"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {errorMsg}
        </div>
      )}
    </div>
  );
};

export default DiscountCodeInput;
