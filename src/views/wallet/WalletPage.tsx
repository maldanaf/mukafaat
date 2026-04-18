"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { IoWalletOutline, IoGiftOutline } from "react-icons/io5";
import { TbArrowsExchange2 } from "react-icons/tb";
import CurrencyIcon from "@components/CurrencyIcon";
import {
  usePointsBalance,
  usePointsHistory,
  useWallet,
  useWalletHistory,
  usePointsRedeem,
  useMyTransactions,
} from "@hooks/api/useMokafaatQueries";
import { toast } from "react-toastify";

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

  const walletBalance = Number(wallet.wallet_balance ?? 0) || 0;
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
        const payload = (res as Record<string, unknown>)?.data ?? res;
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
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <IoGiftOutline className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              {isRTL ? "تحويل النقاط إلى المحفظة" : "Convert Points to Wallet"}
            </h3>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
              <span className="text-sm text-gray-600">{isRTL ? "النقاط المتاحة" : "Available Points"}</span>
              <span className="font-bold text-orange-600">{points} {isRTL ? "نقطة" : "pts"}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
              <span className="text-sm text-gray-600">{isRTL ? "القيمة بالريال" : "Value in SAR"}</span>
              <span className="font-bold text-green-600 flex items-center gap-1">
                {pointsValue ?? 0} <CurrencyIcon size={14} className="text-green-600" />
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
              <span className="text-sm text-gray-600">{isRTL ? "رصيد المحفظة بعد التحويل" : "Wallet After"}</span>
              <span className="font-bold text-purple-600 flex items-center gap-1">
                {(walletBalance + (pointsValue ?? 0)).toFixed(2)} <CurrencyIcon size={14} className="text-purple-600" />
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center mb-4">
            {isRTL
              ? "سيتم تحويل جميع النقاط إلى رصيد في المحفظة. هذه العملية لا يمكن التراجع عنها."
              : "All points will be converted to wallet balance. This action cannot be undone."}
          </p>

          <div className="flex gap-3">
            <button
              onClick={onRedeemConfirm}
              disabled={redeemMutation.isPending || points < 1}
              className="flex-1 py-3 rounded-xl bg-[#400198] text-white font-medium hover:bg-[#33007a] transition-colors disabled:opacity-50"
            >
              {redeemMutation.isPending
                ? (isRTL ? "جاري التحويل..." : "Converting...")
                : (isRTL ? "تأكيد التحويل" : "Confirm")}
            </button>
            <button
              onClick={() => setRedeemModalOpen(false)}
              disabled={redeemMutation.isPending}
              className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isRTL ? "إلغاء" : "Cancel"}
            </button>
          </div>
        </div>
      </div>
    )}

    <div
      className="min-h-screen bg-gray-50 pt-8 pb-28"
      style={{ marginTop: "77px" }}
    >
      <div className="container mx-auto px-4 sm:px-4 lg:px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{t("wallet.title")}</h1>
            <IoWalletOutline className="w-8 h-8 text-[#440798]" />
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-8 text-gray-500">{t("wallet.loading")}</div>
        )}

        {!isLoading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl p-6 text-white shadow-lg">
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
                  className="mt-3 text-sm font-medium bg-white/20 hover:bg-white/30 rounded-lg px-3 py-2 disabled:opacity-50"
                >
                  {t("wallet.redeem_to_wallet")}
                </button>
              </div>

              <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <IoWalletOutline className="w-8 h-8" />
                </div>
                <div className="text-3xl font-bold mb-2 flex items-center gap-2">
                  {walletBalance}
                  <CurrencyIcon size={24} className="text-white" />
                </div>
                <div className="text-sm opacity-90">{t("wallet.account_balance")}</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex space-x-4 space-x-reverse">
                {([
                  { key: "payments" as const, label: isRTL ? "المدفوعات" : "Payments" },
                  { key: "transactions" as const, label: t("wallet.financial_transactions") },
                  { key: "points" as const, label: t("wallet.points_log") },
                ] as const).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-6 py-3 rounded-full font-medium text-sm transition-all duration-300 ${
                      activeTab === tab.key
                        ? "bg-[#400198] text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* تاب المدفوعات */}
            {activeTab === "payments" && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">
                    {isRTL ? "سجل المدفوعات" : "Payment History"}
                  </h3>
                  {(() => {
                    const root = (myTransactionsData as Record<string, unknown>)?.data ?? myTransactionsData;
                    const summary = (root as Record<string, unknown>)?.summary as Record<string, unknown> | undefined;
                    const totalPaid = Number(summary?.total_paid ?? 0);
                    return totalPaid > 0 ? (
                      <span className="text-sm text-gray-500">
                        {isRTL ? "إجمالي المدفوعات:" : "Total paid:"}{" "}
                        <span className="font-bold text-[#400198]">{totalPaid}</span>{" "}
                        <CurrencyIcon size={12} className="inline text-[#400198]" />
                      </span>
                    ) : null;
                  })()}
                </div>
                {myTransactionsLoading && (
                  <div className="text-center py-6 text-gray-500">{t("wallet.loading")}</div>
                )}
                {!myTransactionsLoading && (() => {
                  const root = (myTransactionsData as Record<string, unknown>)?.data ?? myTransactionsData;
                  const txList = ((root as Record<string, unknown>)?.transactions ?? []) as Array<Record<string, unknown>>;
                  if (txList.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        {isRTL ? "لا توجد مدفوعات" : "No payments yet"}
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-3">
                      {txList.map((tx, idx) => {
                        const isRefund = tx.type === "refund";
                        const statusColor = tx.status === "successful" ? "text-green-600" : tx.status === "failed" ? "text-red-500" : "text-yellow-600";
                        return (
                          <div key={(tx.id as string) ?? idx} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-sm transition-all">
                            <div className="flex items-center gap-3 flex-1">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isRefund ? "bg-green-100" : "bg-purple-100"}`}>
                                <span className="text-lg">{isRefund ? "↩" : "💳"}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm truncate">
                                  {String(tx.item_name ?? tx.order_number ?? "—")}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-gray-500">{String(tx.time_ago ?? tx.created_at ?? "")}</span>
                                  <span className="text-xs text-gray-400">•</span>
                                  <span className="text-xs text-gray-500">{String(tx.payment_method_label ?? tx.payment_method ?? "")}</span>
                                  {tx.card_last_four && (
                                    <>
                                      <span className="text-xs text-gray-400">•</span>
                                      <span className="text-xs text-gray-500">****{String(tx.card_last_four)}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-end">
                              <p className={`font-bold ${isRefund ? "text-green-600" : "text-gray-900"} flex items-center gap-1`}>
                                {isRefund ? "+" : "-"}{Number(tx.amount)}
                                <CurrencyIcon size={14} className={isRefund ? "text-green-600" : "text-gray-700"} />
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
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">{t("wallet.transaction_log")}</h3>
                {(activeTab === "points" ? pointsHistoryLoading : walletHistoryLoading) && (
                  <div className="text-center py-6 text-gray-500">{t("wallet.loading")}</div>
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
                      <div className="text-center py-8 text-gray-500">
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
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 p-4 mb-6">
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
  t,
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
      ? new Date(dateStr).toLocaleDateString("ar-SA")
      : String(dateStr)
    : "—";

  if (type === "transactions") {
    const amount = Number(item.amount ?? 0);
    const isCredit = String(item.type ?? "").includes("credit") || String(item.type ?? "").includes("refund") || amount > 0;
    return (
      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-sm transition-all">
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCredit ? "bg-green-100" : "bg-orange-100"}`}>
            <TbArrowsExchange2 className={`w-5 h-5 ${isCredit ? "text-green-600" : "text-orange-500"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 text-sm truncate">{description}</p>
            <p className="text-xs text-gray-500 mt-1">{date}</p>
          </div>
        </div>
        <span className={`font-bold ${isCredit ? "text-green-600" : "text-orange-500"} flex items-center gap-1`}>
          {isCredit ? "+" : "-"}{Math.abs(amount)}
          <CurrencyIcon size={14} className="text-gray-700" />
        </span>
      </div>
    );
  }

  // النقاط
  const points = Number(item.points ?? 0);
  const isEarn = String(item.type ?? "") === "earned" || points > 0;
  const isReversed = String(item.type ?? "") === "reversed";
  const typeLabel = isReversed
    ? (isRTL ? "استرجاع" : "Reversed")
    : isEarn
      ? (isRTL ? "مكتسبة" : "Earned")
      : (isRTL ? "مستخدمة" : "Redeemed");

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-sm transition-all">
      <div className="flex items-center gap-3 flex-1">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isReversed ? "bg-red-100" : isEarn ? "bg-green-100" : "bg-purple-100"
        }`}>
          <IoGiftOutline className={`w-5 h-5 ${
            isReversed ? "text-red-500" : isEarn ? "text-green-600" : "text-purple-600"
          }`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm truncate">{description}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">{date}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isReversed ? "bg-red-50 text-red-600" : isEarn ? "bg-green-50 text-green-600" : "bg-purple-50 text-purple-600"
            }`}>{typeLabel}</span>
          </div>
        </div>
      </div>
      <span className={`font-bold text-lg ${
        isReversed ? "text-red-500" : isEarn ? "text-green-600" : "text-purple-600"
      }`}>
        {isEarn ? "+" : "-"}{Math.abs(points)} <span className="text-xs font-normal">{isRTL ? "نقطة" : "pts"}</span>
      </span>
    </div>
  );
}

export default WalletPage;
