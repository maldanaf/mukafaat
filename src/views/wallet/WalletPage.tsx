"use client";

import { t } from "i18next";
import React, { useState } from "react";
import { POINTS_ENABLED } from "@config/features";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@/lib/router-compat";
import { IoWalletOutline, IoGiftOutline, IoAddCircleOutline } from "react-icons/io5";
import { TbArrowsExchange2 } from "react-icons/tb";
import CurrencyIcon from "@components/CurrencyIcon";
import { Button } from "@ui";
import { pointsUnit } from "@utils/points";
import {
  usePointsBalance,
  usePointsHistory,
  useWallet,
  useWalletHistory,
  usePointsRedeem,
  useMyTransactions,
} from "@hooks/api/useMokafaatQueries";
import { toast } from "react-toastify";

import { formatShortDate } from "@utils/localeFormat";
// Normalize API response shapes
function getPointsBalance(data: unknown): { points: number; value?: number } {
  const d = (data as Record<string, unknown>)?.data ?? data;
  const obj = d as Record<string, unknown>;
  const points = Number(obj?.points ?? obj?.balance ?? 0) || 0;
  const value = typeof obj?.value === "number" ? obj.value : typeof obj?.points_value === "number" ? obj.points_value : undefined;
  return { points, value };
}

function getWalletSummary(data: unknown): {
  walletBalance: number;
  promotionalBalance: number;
  totalBalance: number;
  pointsBalance: number;
  pointsValueSar: number;
  walletTransactions: Array<Record<string, unknown>>;
  pointsTransactions: Array<Record<string, unknown>>;
} {
  const root = (data as Record<string, unknown>)?.data ?? data;
  const rootObj = (root ?? {}) as Record<string, unknown>;

  // Expected shape: { data: { wallet: { ... } } }
  const wallet =
    (rootObj?.wallet as Record<string, unknown> | undefined) ??
    ((rootObj?.data as Record<string, unknown> | undefined)?.wallet as
      | Record<string, unknown>
      | undefined) ??
    {};

  const walletBalance = Number(wallet.cash_balance ?? wallet.wallet_balance ?? 0) || 0;
  const promotionalBalance = Number(wallet.promotional_balance ?? 0) || 0;
  const totalBalance =
    Number(wallet.total_balance ?? walletBalance + promotionalBalance) || 0;
  const pointsBalance = Number(wallet.points_balance ?? 0) || 0;
  const pointsValueSar = Number(wallet.points_value_sar ?? 0) || 0;

  const walletHistory =
    (wallet.wallet_history as Record<string, unknown> | undefined) ?? {};
  const pointsHistory =
    (wallet.points_history as Record<string, unknown> | undefined) ?? {};

  const walletTransactionsRaw = walletHistory.transactions as unknown;
  const pointsTransactionsRaw = pointsHistory.transactions as unknown;

  return {
    walletBalance,
    promotionalBalance,
    totalBalance,
    pointsBalance,
    pointsValueSar,
    walletTransactions: Array.isArray(walletTransactionsRaw)
      ? (walletTransactionsRaw as Array<Record<string, unknown>>)
      : [],
    pointsTransactions: Array.isArray(pointsTransactionsRaw)
      ? (pointsTransactionsRaw as Array<Record<string, unknown>>)
      : [],
  };
}

function getHistoryList(data: unknown): Array<Record<string, unknown>> {
  const d = (data as Record<string, unknown>)?.data ?? data;
  if (Array.isArray(d)) return d;
  const obj = d as Record<string, unknown>;
  const list = (obj?.history ?? obj?.transactions ?? obj?.list) as unknown;
  return Array.isArray(list) ? list : [];
}

const WalletPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language?.startsWith("ar");
  const [activeTab, setActiveTab] = useState<"payments" | "points" | "transactions">("payments");

  const { data: pointsData, isLoading: pointsLoading, isError: pointsError } = usePointsBalance();
  const { data: pointsHistoryData, isLoading: pointsHistoryLoading } = usePointsHistory();
  const { data: walletData, isLoading: walletLoading, isError: walletError } = useWallet();
  const { data: walletHistoryData, isLoading: walletHistoryLoading } = useWalletHistory();
  const redeemMutation = usePointsRedeem();
  const { data: myTransactionsData, isLoading: myTransactionsLoading } = useMyTransactions();

  const { points: pointsFromPointsApi, value: pointsValueFromPointsApi } =
    getPointsBalance(pointsData);
  const walletSummary = getWalletSummary(walletData);

  const points = walletSummary.pointsBalance || pointsFromPointsApi;
  const pointsValue =
    walletSummary.pointsValueSar || pointsValueFromPointsApi;

  const walletBalance = walletSummary.walletBalance;

  // Prefer dedicated endpoints (if any), otherwise fall back to /api/wallet nested history.
  const pointsList =
    getHistoryList(pointsHistoryData) || walletSummary.pointsTransactions;
  const walletList =
    getHistoryList(walletHistoryData) || walletSummary.walletTransactions;

  const [redeemModalOpen, setRedeemModalOpen] = useState(false);

  const onRedeemConfirm = () => {
    redeemMutation.mutate({ points }, {
      onSuccess: (res) => {
        const payload = (res as unknown as Record<string, unknown>)?.data ?? res;
        const root = (payload as Record<string, unknown>);
        if (root?.status === false) {
          toast.error(String(root?.msg ?? root?.message ?? t("wallet.redeem_error")));
          return;
        }
        const data = (root?.data ?? root) as Record<string, unknown>;
        const sarValue = data?.sar_value ?? pointsValue;
        toast.success(isRTL ? `تم تحويل ${points} نقطة (${sarValue} ر.س) إلى محفظتك` : `Converted ${points} points (${sarValue} SAR) to wallet`);
        setRedeemModalOpen(false);
      },
      onError: (err) => {
        const data = (err as { response?: { data?: { msg?: string } } })?.response?.data;
        toast.error(data?.msg || t("wallet.redeem_error"));
      },
    });
  };

  const isLoading = pointsLoading || walletLoading;
  const showPointsError = pointsError && !pointsData;
  const showWalletError = walletError && !walletData;

  return (
    <>
    {/* مودال تحويل النقاط */}
    {redeemModalOpen && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !redeemMutation.isPending && setRedeemModalOpen(false)}>
        <div className="bg-white rounded-mk-xl shadow-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <IoGiftOutline className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-lg font-bold text-mk-text">
              {t("wallet.t_48eed1", "تحويل النقاط إلى المحفظة")}
            </h3>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-mk-md">
              <span className="text-sm text-mk-muted">{t("wallet.t_94adc2", "النقاط المتاحة")}</span>
              <span className="font-bold text-orange-600">{points} {t("wallet.t_e09821", "نقطة")}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-mk-md">
              <span className="text-sm text-mk-muted">{t("wallet.t_ce0f42", "القيمة بالريال")}</span>
              <span className="font-bold text-green-600 flex items-center gap-1">
                {pointsValue ?? 0} <CurrencyIcon size={14} className="text-green-600" />
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-mk-tint3 rounded-mk-md">
              <span className="text-sm text-mk-muted">{t("wallet.t_e93d95", "رصيد المحفظة بعد التحويل")}</span>
              <span className="font-bold text-mk-primary flex items-center gap-1">
                {(walletBalance + (pointsValue ?? 0)).toFixed(2)} <CurrencyIcon size={14} className="text-mk-primary" />
              </span>
            </div>
          </div>

          <p className="text-xs text-mk-muted text-center mb-4">
            {t("wallet.t_f39f2f", "سيتم تحويل جميع النقاط إلى رصيد في المحفظة. هذه العملية لا يمكن التراجع عنها.")}
          </p>

          <div className="flex gap-3">
            <button
              onClick={onRedeemConfirm}
              disabled={redeemMutation.isPending || points < 1}
              className="flex-1 py-3 rounded-mk-md bg-[#400198] text-white font-medium hover:bg-[#33007a] transition-colors disabled:opacity-50"
            >
              {redeemMutation.isPending
                ? (t("orders.t_02f70c", "جاري التحويل..."))
                : (t("wallet.t_f025a6", "تأكيد التحويل"))}
            </button>
            <button
              onClick={() => setRedeemModalOpen(false)}
              disabled={redeemMutation.isPending}
              className="flex-1 py-3 rounded-mk-md border border-mk-border-2 text-mk-text-strong font-medium hover:bg-mk-tint3 transition-colors disabled:opacity-50"
            >
              {t("ui.t_e776b0", "إلغاء")}
            </button>
          </div>
        </div>
      </div>
    )}

    <div
      className="min-h-screen bg-mk-tint3 pt-8 pb-28"
      style={{ marginTop: "77px" }}
    >
      <div className="container mx-auto px-4 sm:px-4 lg:px-4">
        <div className="bg-white rounded-mk-sm shadow-mk-card p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <IoWalletOutline className="w-8 h-8 text-[#400198]" />
              <div>
                <h1 className="text-2xl font-bold text-mk-text">{t("wallet.title")}</h1>
                <p className="text-xs text-mk-muted">{t("wallet.pointsRateDesc")}</p>
              </div>
            </div>
            <Button
              variant="accent"
              size="md"
              className="rounded-full"
              icon={<IoAddCircleOutline className="w-5 h-5" />}
              onClick={() => navigate("/wallet/topup")}
            >
              {t("wallet.topupTitle")}
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-8 text-mk-muted">{t("wallet.loading")}</div>
        )}

        {!isLoading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              {/* نظام النقاط مخفي — POINTS_ENABLED */}
              {POINTS_ENABLED && (
                <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-mk-md p-6 text-white shadow-mk-raised">
                  <div className="flex items-center justify-between mb-4">
                    <IoGiftOutline className="w-8 h-8" />
                  </div>
                  <div className="text-3xl font-bold mb-2">{points}</div>
                  <div className="text-sm opacity-90">{t("wallet.points_balance")}</div>
                  {pointsValue != null && (
                    <div className="text-sm opacity-90 mt-1">
                      {t("wallet.points_value")}: {pointsValue} <CurrencyIcon size={14} className="inline text-white" />
                    </div>
                  )}
                  <button
                    onClick={() => setRedeemModalOpen(true)}
                    disabled={points < 1}
                    className="mt-3 text-sm font-medium bg-white/20 hover:bg-white/30 rounded-mk-sm px-3 py-2 disabled:opacity-50"
                  >
                    {t("wallet.redeem_to_wallet")}
                  </button>
                </div>
              )}

              <div className="md:col-span-3 rounded-mk-md bg-gradient-to-br from-mk-primary-light to-mk-primary p-6 text-white shadow-mk-raised">
                <div className="mb-1 text-sm opacity-85">{t("wallet.totalBalance")}</div>
                <div className="mb-4 flex items-baseline gap-2 text-3xl font-bold">
                  {walletSummary.totalBalance.toFixed(2)}
                  <span className="text-[15px] font-semibold opacity-90">
                    {pointsUnit(walletSummary.totalBalance, t)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 rounded-mk-md bg-white p-4">
                  <div className="text-center">
                    <div className="text-[11.5px] text-mk-muted">
                      {t("wallet.promotionalBalance")}
                    </div>
                    <div className="mt-1 flex items-baseline justify-center gap-1 text-base font-bold text-mk-text">
                      {walletSummary.promotionalBalance.toFixed(2)}
                      <span className="text-[10.5px] font-semibold text-mk-text-strong">
                        {pointsUnit(walletSummary.promotionalBalance, t)}
                      </span>
                    </div>
                  </div>
                  <div className="border-s border-mk-border text-center">
                    <div className="text-[11.5px] text-mk-muted">
                      {t("wallet.cashBalance")}
                    </div>
                    <div className="mt-1 flex items-baseline justify-center gap-1 text-base font-bold text-mk-text">
                      {walletBalance.toFixed(2)}
                      <span className="text-[10.5px] font-semibold text-mk-text-strong">
                        {pointsUnit(walletBalance, t)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-mk-sm shadow-mk-card p-4 mb-6">
              <div className="flex space-x-4 space-x-reverse">
                {([
                  { key: "payments" as const, label: t("wallet.t_430ece", "المدفوعات") },
                  { key: "transactions" as const, label: t("wallet.financial_transactions") },
                  ...(POINTS_ENABLED
                    ? [{ key: "points" as const, label: t("wallet.points_log") }]
                    : []),
                ]).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-6 py-3 rounded-full font-medium text-sm transition-all duration-300 ${
                      activeTab === tab.key
                        ? "bg-[#400198] text-white shadow-mk-raised"
                        : "bg-mk-tint2 text-mk-text-strong hover:bg-mk-border-strong/60"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* تاب المدفوعات */}
            {activeTab === "payments" && (
              <div className="bg-white rounded-mk-sm shadow-mk-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-mk-text">
                    {t("wallet.t_4a0110", "سجل المدفوعات")}
                  </h3>
                  {(() => {
                    const root = (myTransactionsData as Record<string, unknown>)?.data ?? myTransactionsData;
                    const summary = (root as Record<string, unknown>)?.summary as Record<string, unknown> | undefined;
                    const totalPaid = Number(summary?.total_paid ?? 0);
                    return totalPaid > 0 ? (
                      <span className="text-sm text-mk-muted">
                        {t("wallet.t_f7723c", "إجمالي المدفوعات:")}{" "}
                        <span className="font-bold text-[#400198]">{totalPaid}</span>{" "}
                        <CurrencyIcon size={12} className="inline text-[#400198]" />
                      </span>
                    ) : null;
                  })()}
                </div>
                {myTransactionsLoading && (
                  <div className="text-center py-6 text-mk-muted">{t("wallet.loading")}</div>
                )}
                {!myTransactionsLoading && (() => {
                  const root = (myTransactionsData as Record<string, unknown>)?.data ?? myTransactionsData;
                  const txList = ((root as Record<string, unknown>)?.transactions ?? []) as Array<Record<string, unknown>>;
                  if (txList.length === 0) {
                    return (
                      <div className="text-center py-8 text-mk-muted">
                        {t("wallet.t_6fbd1f", "لا توجد مدفوعات")}
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-3">
                      {txList.map((tx, idx) => {
                        const isRefund = tx.type === "refund";
                        const statusColor = tx.status === "successful" ? "text-green-600" : tx.status === "failed" ? "text-red-500" : "text-yellow-600";
                        return (
                          <div key={(tx.id as string) ?? idx} className="flex items-center justify-between p-4 border border-mk-border rounded-mk-md hover:shadow-mk-card transition-all">
                            <div className="flex items-center gap-3 flex-1">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isRefund ? "bg-green-100" : "bg-mk-tint"}`}>
                                <span className="text-lg">{isRefund ? "↩" : "💳"}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-mk-text text-sm truncate">
                                  {String(tx.item_name ?? tx.order_number ?? "—")}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-mk-muted">{String(tx.time_ago ?? tx.created_at ?? "")}</span>
                                  <span className="text-xs text-mk-faint">•</span>
                                  <span className="text-xs text-mk-muted">{String(tx.payment_method_label ?? tx.payment_method ?? "")}</span>
                                  {Boolean(tx.card_last_four) && (
                                    <>
                                      <span className="text-xs text-mk-faint">•</span>
                                      <span className="text-xs text-mk-muted">****{String(tx.card_last_four)}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-end">
                              <p className={`font-bold ${isRefund ? "text-green-600" : "text-mk-text"} flex items-center gap-1`}>
                                {isRefund ? "+" : "-"}{Number(tx.amount)}
                                <CurrencyIcon size={14} className={isRefund ? "text-green-600" : "text-mk-text-strong"} />
                              </p>
                              <p className={`text-xs font-medium ${statusColor}`}>
                                {String(tx.status_label ?? tx.status ?? "")}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* تاب حركات المحفظة والنقاط */}
            {(activeTab === "transactions" || activeTab === "points") && (
              <div className="bg-white rounded-mk-sm shadow-mk-card p-6">
                <h3 className="text-lg font-bold text-mk-text mb-6">{t("wallet.transaction_log")}</h3>
                {(activeTab === "points" ? pointsHistoryLoading : walletHistoryLoading) && (
                  <div className="text-center py-6 text-mk-muted">{t("wallet.loading")}</div>
                )}
                {!pointsHistoryLoading && !walletHistoryLoading && (
                  <div className="space-y-3">
                    {(activeTab === "transactions" ? walletList : pointsList).map((item, idx) => (
                      <WalletTransactionRow
                        key={(item.id as string) ?? idx}
                        item={item}
                        type={activeTab}
                        t={t}
                        isRTL={!!isRTL}
                      />
                    ))}
                    {(activeTab === "transactions" ? walletList : pointsList).length === 0 && (
                      <div className="text-center py-8 text-mk-muted">
                        {t("wallet.no_transactions")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {(showPointsError || showWalletError) && (
          <div className="rounded-mk-sm bg-red-50 border border-red-200 text-red-700 p-4 mb-6">
            {showPointsError && <p>{t("wallet.loading")} (points)</p>}
            {showWalletError && <p>{t("wallet.loading")} (wallet)</p>}
          </div>
        )}
      </div>
    </div>
    </>
  );
};

function WalletTransactionRow({
  item,
  type,
  t: tr,
  isRTL,
}: {
  item: Record<string, unknown>;
  type: "points" | "transactions";
  t: (key: string) => string;
  isRTL?: boolean;
}) {
  const description = String(
    (isRTL ? item.description_ar : item.description_en) ?? item.description ?? item.title ?? item.reason ?? "—"
  );
  const dateStr = item.created_at ?? item.date;
  const date = dateStr
    ? typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}/.test(dateStr)
      ? formatShortDate(dateStr)
      : String(dateStr)
    : "—";

  if (type === "transactions") {
    const amount = Number(item.amount ?? 0);
    const isCredit = String(item.type ?? "").includes("credit") || String(item.type ?? "").includes("refund") || amount > 0;
    return (
      <div className="flex items-center justify-between p-4 border border-mk-border rounded-mk-md hover:shadow-mk-card transition-all">
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCredit ? "bg-green-100" : "bg-orange-100"}`}>
            <TbArrowsExchange2 className={`w-5 h-5 ${isCredit ? "text-green-600" : "text-orange-500"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-mk-text text-sm truncate">{description}</p>
            <p className="text-xs text-mk-muted mt-1">{date}</p>
          </div>
        </div>
        <span className={`font-bold ${isCredit ? "text-green-600" : "text-orange-500"} flex items-baseline gap-1`}>
          {isCredit ? "+" : "-"}{Math.abs(amount)}
          <span className="text-[11px] font-semibold opacity-90">
            {pointsUnit(amount, tr)}
          </span>
        </span>
      </div>
    );
  }

  // النقاط
  const points = Number(item.points ?? 0);
  const isEarn = String(item.type ?? "") === "earned" || points > 0;
  const isReversed = String(item.type ?? "") === "reversed";
  const typeLabel = isReversed
    ? (t("wallet.t_bba289", "استرجاع"))
    : isEarn
      ? (t("wallet.t_e2b0d9", "مكتسبة"))
      : (t("wallet.t_2ead28", "مستخدمة"));

  return (
    <div className="flex items-center justify-between p-4 border border-mk-border rounded-mk-md hover:shadow-mk-card transition-all">
      <div className="flex items-center gap-3 flex-1">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isReversed ? "bg-red-100" : isEarn ? "bg-green-100" : "bg-mk-tint"
        }`}>
          <IoGiftOutline className={`w-5 h-5 ${
            isReversed ? "text-red-500" : isEarn ? "text-green-600" : "text-mk-primary"
          }`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-mk-text text-sm truncate">{description}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-mk-muted">{date}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isReversed ? "bg-red-50 text-red-600" : isEarn ? "bg-green-50 text-green-600" : "bg-mk-tint3 text-mk-primary"
            }`}>{typeLabel}</span>
          </div>
        </div>
      </div>
      <span className={`font-bold text-lg ${
        isReversed ? "text-red-500" : isEarn ? "text-green-600" : "text-mk-primary"
      }`}>
        {isEarn ? "+" : "-"}{Math.abs(points)}{" "}
        <span className="text-xs font-normal">{pointsUnit(points, tr)}</span>
      </span>
    </div>
  );
}

export default WalletPage;
