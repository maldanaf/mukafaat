"use client";

import React from "react";
import { IoMdClose } from "react-icons/io";
import { FiTrendingUp, FiTrendingDown, FiAlertTriangle } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { FOCUS } from "@ui";

/**
 * نافذة تأكيد تغيير الباقة (ترقية أو تقليل).
 *
 * تعرض بوضوح ما سيحدث قبل موافقة العميل: الأيام المتبقية وقيمتها، المبلغ
 * المطلوب دفعه أو المُودَع في محفظته، وتحذيراً صريحاً إن كان أفراد عائلته
 * سيفقدون اشتراكهم.
 */
export interface PlanChangePreview {
  direction: "upgrade" | "downgrade" | "same" | "new";
  allowed: boolean;
  reason?: string | null;
  remaining_days: number;
  remaining_value: number;
  new_price: number;
  amount_to_pay: number;
  wallet_credit: number;
  family_members_removed: number;
  current_plan?: { name?: string } | null;
  new_plan?: { name?: string } | null;
}

interface Props {
  preview: PlanChangePreview;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const PlanChangeModal: React.FC<Props> = ({
  preview,
  busy = false,
  onConfirm,
  onClose,
}) => {
  const { t } = useTranslation();
  const isUpgrade = preview.direction === "upgrade";
  const members = preview.family_members_removed ?? 0;

  const money = (v: number) =>
    `${Number(v ?? 0).toFixed(2)} ${t("common.riyal", "ر.س")}`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      role="presentation"
    >
      <div
        className="w-full max-w-[460px] rounded-t-mk-xl bg-white p-5 shadow-mk-raised sm:rounded-mk-xl"
        role="dialog"
        aria-modal="true"
      >
        {/* العنوان */}
        <div className="mb-4 flex items-start gap-3">
          <span
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${
              isUpgrade ? "bg-[#F0E9FE] text-mk-primary" : "bg-[#E3F7EF] text-[#12A06A]"
            }`}
          >
            {isUpgrade ? (
              <FiTrendingUp className="h-5 w-5" />
            ) : (
              <FiTrendingDown className="h-5 w-5" />
            )}
          </span>
          <div className="flex-1">
            <h3 className="m-0 text-[16px] font-bold text-mk-text-strong">
              {isUpgrade
                ? t("subscription.planUpgradeTitle", "ترقية الباقة")
                : t("subscription.planDowngradeTitle", "تغيير إلى باقة أقل")}
            </h3>
            <p className="m-0 mt-1 text-[12.5px] leading-relaxed text-mk-muted">
              {isUpgrade
                ? t(
                    "subscription.planUpgradeSub",
                    "ستدفع الفرق فقط بعد خصم ما تبقّى من باقتك",
                  )
                : t(
                    "subscription.planDowngradeSub",
                    "الفرق سيُودَع في محفظتك فوراً",
                  )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close", "إغلاق")}
            className={`shrink-0 rounded-full p-1 text-mk-muted hover:bg-mk-tint3 ${FOCUS}`}
          >
            <IoMdClose className="h-5 w-5" />
          </button>
        </div>

        {/* من ← إلى */}
        <div className="mb-4 flex items-center gap-2 rounded-mk-md bg-[#F7F5FD] px-4 py-3">
          <div className="flex-1 text-center">
            <p className="m-0 text-[10.5px] text-mk-muted">
              {t("subscription.planChangeFrom", "من")}
            </p>
            <p className="m-0 mt-1 text-[12.5px] font-bold text-mk-text">
              {preview.current_plan?.name ?? "—"}
            </p>
          </div>
          <span className="text-mk-primary">←</span>
          <div className="flex-1 text-center">
            <p className="m-0 text-[10.5px] text-mk-muted">
              {t("subscription.planChangeTo", "إلى")}
            </p>
            <p className="m-0 mt-1 text-[12.5px] font-bold text-mk-primary">
              {preview.new_plan?.name ?? "—"}
            </p>
          </div>
        </div>

        {/* تفصيل الحساب */}
        <div className="mb-4 rounded-mk-md border border-mk-border p-4">
          <Row
            label={t("subscription.planChangeRemaining", "المتبقي من باقتك")
              .replace("{{days}}", String(preview.remaining_days))}
            value={money(preview.remaining_value)}
          />
          <div className="my-2.5 h-px bg-mk-tint3" />
          <Row
            label={t("subscription.planChangeNewPrice", "سعر الباقة الجديدة")}
            value={money(preview.new_price)}
          />
          <div className="my-2.5 h-px bg-mk-border" />
          <Row
            label={
              isUpgrade
                ? t("subscription.planChangeYouPay", "المطلوب دفعه")
                : t("subscription.planChangeToWallet", "يُودَع في محفظتك")
            }
            value={money(isUpgrade ? preview.amount_to_pay : preview.wallet_credit)}
            highlight
            highlightClass={isUpgrade ? "text-mk-primary" : "text-[#12A06A]"}
          />
        </div>

        {/* تحذير فقدان أفراد العائلة */}
        {members > 0 && (
          <div className="mb-4 flex gap-3 rounded-mk-md border border-red-200 bg-red-50 p-3.5">
            <FiAlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="m-0 text-[12.5px] font-bold text-red-900">
                {t(
                  "subscription.planChangeFamilyWarningTitle",
                  "سيفقد {{count}} من أفراد عائلتك اشتراكهم",
                ).replace("{{count}}", String(members))}
              </p>
              <p className="m-0 mt-1 text-[11px] leading-relaxed text-red-900">
                {t(
                  "subscription.planChangeFamilyWarningBody",
                  "سيتحوّلون إلى مستخدمين عاديين بلا اشتراك، وعلى كلٍّ منهم الاشتراك بنفسه بعد ذلك.",
                )}
              </p>
            </div>
          </div>
        )}

        {/* الأزرار */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className={`flex-1 rounded-mk-md border border-mk-border py-3 text-[14px] font-bold text-mk-muted disabled:opacity-60 ${FOCUS}`}
          >
            {t("common.cancel", "إلغاء")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`flex-[2] rounded-mk-md bg-mk-primary py-3 text-[14px] font-bold text-white disabled:opacity-60 ${FOCUS}`}
          >
            {busy
              ? t("common.loading", "جارٍ...")
              : isUpgrade
                ? t("subscription.planChangeConfirmUpgrade", "متابعة الدفع")
                : t("subscription.planChangeConfirmDowngrade", "تأكيد التغيير")}
          </button>
        </div>
      </div>
    </div>
  );
};

const Row: React.FC<{
  label: string;
  value: string;
  highlight?: boolean;
  highlightClass?: string;
}> = ({ label, value, highlight = false, highlightClass = "" }) => (
  <div className="flex items-center justify-between gap-3">
    <span
      className={`${highlight ? "text-[13px] font-bold text-mk-text-strong" : "text-[12px] text-mk-muted"}`}
    >
      {label}
    </span>
    <span
      className={`shrink-0 font-bold ${highlight ? `text-[15px] ${highlightClass}` : "text-[12.5px] text-mk-text"}`}
    >
      {value}
    </span>
  </div>
);

export default PlanChangeModal;
