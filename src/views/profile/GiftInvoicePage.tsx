"use client";

import React, { useMemo } from "react";
import { Navigate } from "@/lib/router-compat";
import { Helmet } from "@/lib/helmet-compat";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@hooks";
import { useUserStore } from "@stores/userStore";
import { useHydrated } from "@hooks/useHydrated";
import { useGiftInvoice } from "@hooks/api/useMokafaatQueries";
import { Button } from "@ui";
import CurrencyIcon from "@components/CurrencyIcon";
import { formatPrice } from "@utils/subscriptionPricing";
import {
  IoDocumentTextOutline,
  IoDownloadOutline,
  IoArrowBack,
} from "react-icons/io5";
import {
  AccountError,
  AccountLoading,
  AccountPageHead,
  AccountPanel,
} from "./components/AccountKit";

interface InvoiceData {
  id?: number | string;
  invoice_number?: string;
  amount?: number;
  tax_amount?: number;
  total_amount?: number;
  status?: string;
  issue_date?: string;
  pdf_url?: string | null;
  subscription?: {
    id?: number | string;
    plan_name?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    status?: string | null;
  } | null;
  recipient?: { id?: number; name?: string; phone?: string } | null;
}

function parseInvoice(payload: unknown): InvoiceData | null {
  const raw = payload as Record<string, unknown> | undefined;
  if (!raw) return null;
  const data = (raw.data ?? raw) as Record<string, unknown>;
  const invoice = (data.invoice ?? data) as Record<string, unknown> | undefined;
  if (!invoice || invoice.invoice_number == null) return null;
  return invoice as InvoiceData;
}

/** فاتورة اشتراك أهديته لشخص آخر (تخصّ المُهدي) */
const GiftInvoicePage: React.FC<{ subscriptionId?: string }> = ({
  subscriptionId,
}) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const hydrated = useHydrated();
  const user = useUserStore((s) => s.user);

  const { data, isLoading, isError } = useGiftInvoice(
    user ? subscriptionId : undefined,
  );
  const invoice = useMemo(() => parseInvoice(data), [data]);

  if (!hydrated) return <AccountLoading rows={4} />;

  if (!user) {
    return (
      <Navigate
        to={`/login?returnUrl=${encodeURIComponent(`/profile/gifts/${subscriptionId ?? ""}`)}`}
        replace
      />
    );
  }

  const rows: { label: string; value: React.ReactNode }[] = invoice
    ? [
        { label: t("giftSubscription.invoice_number"), value: invoice.invoice_number },
        ...(invoice.issue_date
          ? [{ label: t("giftSubscription.invoice_date"), value: invoice.issue_date }]
          : []),
        ...(invoice.subscription?.plan_name
          ? [
              {
                label: t("giftSubscription.invoice_plan"),
                value: invoice.subscription.plan_name,
              },
            ]
          : []),
        ...(invoice.subscription?.start_date && invoice.subscription?.end_date
          ? [
              {
                label: t("giftSubscription.invoice_period"),
                value: `${invoice.subscription.start_date} — ${invoice.subscription.end_date}`,
              },
            ]
          : []),
        ...(invoice.recipient?.name
          ? [
              {
                label: t("giftSubscription.invoice_recipient"),
                value: `${invoice.recipient.name}${invoice.recipient.phone ? ` · ${invoice.recipient.phone}` : ""}`,
              },
            ]
          : []),
      ]
    : [];

  return (
    <>
      <Helmet>
        <title>{t("giftSubscription.invoice_title")} | Mokafaat</title>
      </Helmet>

      <div className="space-y-5" dir={isRTL ? "rtl" : "ltr"}>
        <AccountPageHead
          title={t("giftSubscription.invoice_title")}
          subtitle={invoice?.invoice_number ?? undefined}
          icon={<IoDocumentTextOutline />}
          tint="purple"
          actions={
            <Button
              to="/profile/gifts"
              variant="outline"
              size="sm"
              icon={<IoArrowBack className={isRTL ? "rotate-180" : ""} />}
            >
              {t("giftSubscription.back_to_gifts")}
            </Button>
          }
        />

        {isLoading && <AccountLoading rows={4} />}

        {!isLoading && (isError || !invoice) && (
          <AccountError
            description={
              isError
                ? t("giftSubscription.invoice_not_ready")
                : t("giftSubscription.invoice_error")
            }
          />
        )}

        {!isLoading && invoice && (
          <AccountPanel
            title={t("giftSubscription.invoice_title")}
            subtitle={invoice.invoice_number}
            icon={<IoDocumentTextOutline />}
            tint="purple"
          >
            <dl className="m-0 divide-y divide-mk-divider overflow-hidden rounded-mk-md border border-mk-border">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-3 bg-white px-4 py-3"
                >
                  <dt className="text-[12.5px] text-mk-muted">{row.label}</dt>
                  <dd className="m-0 text-[13px] font-bold text-mk-text">{row.value}</dd>
                </div>
              ))}
            </dl>

            {/* ملخّص المبالغ — الإجمالي بشريط بتدرّج الهوية */}
            <div className="mt-4 overflow-hidden rounded-mk-md border border-mk-border">
              <div className="space-y-1.5 bg-grad-mist px-4 py-3 text-[12.5px]">
                <div className="flex items-center justify-between text-mk-muted">
                  <span>{t("giftSubscription.invoice_amount")}</span>
                  <span className="inline-flex items-center gap-1">
                    {formatPrice(Number(invoice.amount ?? 0))}
                    <CurrencyIcon className="text-mk-muted" size={11} />
                  </span>
                </div>
                <div className="flex items-center justify-between text-mk-muted">
                  <span>{t("giftSubscription.invoice_tax")}</span>
                  <span className="inline-flex items-center gap-1">
                    {formatPrice(Number(invoice.tax_amount ?? 0))}
                    <CurrencyIcon className="text-mk-muted" size={11} />
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between bg-grad-brand px-4 py-3.5 text-[15px] font-bold text-white">
                <span>{t("giftSubscription.invoice_total")}</span>
                <span className="inline-flex items-center gap-1">
                  {formatPrice(Number(invoice.total_amount ?? 0))}
                  <CurrencyIcon className="text-white" size={13} />
                </span>
              </div>
            </div>

            {invoice.pdf_url && (
              <Button
                href={invoice.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                variant="accent"
                className="mt-4"
                icon={<IoDownloadOutline />}
              >
                {t("giftSubscription.invoice_download")}
              </Button>
            )}
          </AccountPanel>
        )}
      </div>
    </>
  );
};

export default GiftInvoicePage;
