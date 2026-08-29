"use client";

import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FiDownload, FiFileText } from "react-icons/fi";
import CurrencyIcon from "@components/CurrencyIcon";
import { Skeleton, FOCUS } from "@ui";
import {
  useMyTransactions,
  useSubscriptionStatus,
} from "@hooks/api/useMokafaatQueries";
import { formatPrice } from "@utils/subscriptionPricing";

/**
 * فاتورة الاشتراك.
 *
 * الباك-إند لا يوفّر مساراً مخصّصاً لفاتورة اشتراك المستخدم نفسه
 * (`/api/subscription/gift/{id}/invoice` تخصّ الإهداء فقط)، لذا نقرأ رقم
 * الفاتورة ورابط الـPDF من `GET /api/my-transactions?type=subscription`
 * (يرجع `invoice_number` و`invoice_url`)، وتفاصيل الاشتراك من
 * `GET /api/subscription/status`.
 */
export interface SubscriptionInvoiceProps {
  /** معرّف الاشتراك القادم من رابط العودة من بوابة الدفع (للعرض فقط) */
  subscriptionId?: string | null;
  /** نسخة مضغوطة داخل صفحة النجاح */
  compact?: boolean;
  className?: string;
}

interface TxRow {
  id?: number | string;
  transaction_number?: string;
  amount?: number;
  payment_method_label?: string;
  payment_method?: string;
  status?: string;
  status_label?: string;
  invoice_number?: string | null;
  invoice_url?: string | null;
  item_name?: string;
  created_at?: string;
}

function readTransactions(payload: unknown): TxRow[] {
  const root = (payload as Record<string, unknown>)?.data ?? payload;
  const list = (root as Record<string, unknown>)?.transactions;
  return Array.isArray(list) ? (list as TxRow[]) : [];
}

function readSubscription(payload: unknown): Record<string, unknown> | null {
  const root = (payload as Record<string, unknown>)?.data ?? payload;
  const sub = (root as Record<string, unknown>)?.subscription;
  return sub && typeof sub === "object" ? (sub as Record<string, unknown>) : null;
}

const SubscriptionInvoice: React.FC<SubscriptionInvoiceProps> = ({
  subscriptionId,
  compact = false,
  className = "",
}) => {
  const { t } = useTranslation();
  const { data: txData, isLoading: txLoading } = useMyTransactions({
    type: "subscription",
  });
  const { data: statusData, isLoading: statusLoading } = useSubscriptionStatus();

  const tx = useMemo(() => {
    const rows = readTransactions(txData);
    // أحدث عملية **ناجحة** لها فاتورة، وإلا أحدث عملية ناجحة.
    // العمليات الفاشلة/المعلّقة لا تُعرض كفاتورة حتى لا يظهر مبلغ لم يُدفع.
    return (
      rows.find((r) => r.status === "successful" && r.invoice_number) ??
      rows.find((r) => r.status === "successful") ??
      null
    );
  }, [txData]);

  const subscription = useMemo(() => readSubscription(statusData), [statusData]);

  const isLoading = txLoading || statusLoading;

  if (isLoading) {
    return (
      <div
        className={`rounded-mk-xl border border-mk-border bg-white p-5 ${className}`}
      >
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-4 h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-4/5" />
        <Skeleton className="mt-2 h-3 w-3/5" />
      </div>
    );
  }

  const invoiceNumber = tx?.invoice_number || null;
  const invoiceUrl = tx?.invoice_url || null;
  const planName =
    (subscription?.plan_name as string) || (tx?.item_name as string) || "";
  const amount = Number(tx?.amount ?? subscription?.price ?? 0) || 0;

  const rows: Array<[string, React.ReactNode]> = [];
  if (planName) rows.push([t("invoice.plan"), planName]);
  if (subscription?.start_date)
    rows.push([t("invoice.startDate"), String(subscription.start_date)]);
  if (subscription?.end_date)
    rows.push([t("invoice.endDate"), String(subscription.end_date)]);
  if (tx?.payment_method_label || tx?.payment_method)
    rows.push([
      t("invoice.paymentMethod"),
      String(tx.payment_method_label ?? tx.payment_method),
    ]);
  if (tx?.transaction_number)
    rows.push([t("invoice.transactionNumber"), tx.transaction_number]);
  if (tx?.created_at) rows.push([t("invoice.date"), tx.created_at]);
  if (subscriptionId) rows.push([t("invoice.subscriptionId"), subscriptionId]);

  return (
    <div
      className={`rounded-mk-xl border border-mk-border bg-white shadow-mk-card ${
        compact ? "p-4" : "p-5 sm:p-6"
      } ${className}`}
    >
      <div className="flex items-center gap-3 border-b border-mk-divider pb-3">
        <span
          aria-hidden
          className="grid h-10 w-10 shrink-0 place-items-center rounded-mk-md bg-mk-tint text-mk-primary"
        >
          <FiFileText className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-mk-text">
            {t("invoice.title")}
          </h2>
          <p className="truncate text-xs text-mk-muted">
            {invoiceNumber
              ? `${t("invoice.number")}: ${invoiceNumber}`
              : t("invoice.notIssuedYet")}
          </p>
        </div>
      </div>

      {rows.length > 0 && (
        <dl className="mt-3 space-y-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-3 text-sm">
              <dt className="text-mk-muted">{label}</dt>
              <dd className="text-end font-semibold text-mk-text-strong">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-mk-divider pt-3">
        <span className="text-sm font-bold text-mk-text-strong">
          {t("invoice.total")}
        </span>
        <span className="flex items-center gap-1.5 text-xl font-bold text-mk-primary">
          {formatPrice(amount)}
          <CurrencyIcon size={16} className="text-mk-primary" />
        </span>
      </div>

      {invoiceUrl ? (
        <a
          href={invoiceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-mk-primary px-5 text-sm font-bold text-white transition hover:bg-[#33017a] ${FOCUS}`}
        >
          <FiDownload />
          {t("invoice.downloadPdf")}
        </a>
      ) : (
        <p className="mt-4 rounded-mk-sm bg-mk-tint3 px-3 py-2 text-xs text-mk-muted">
          {t("invoice.pdfUnavailable")}
        </p>
      )}
    </div>
  );
};

export default SubscriptionInvoice;
