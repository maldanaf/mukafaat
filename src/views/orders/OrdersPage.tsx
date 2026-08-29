"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Link } from "@/lib/router-compat";
import { useUserStore } from "@stores/userStore";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@hooks";
import {
  IoReceiptOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoCloseCircleOutline,
  IoEyeOutline,
  IoDownloadOutline,
  IoTrashOutline,
} from "react-icons/io5";
import CurrencyIcon from "@components/CurrencyIcon";
import { useCancelOrder, useOrders } from "@hooks/api/useMokafaatQueries";
import { normalizeOrdersList } from "@utils/orders";
import { EmptyState, ErrorState, SkeletonRows } from "@ui";
import {
  PanelHero,
  Chip,
  ChipBar,
  ResultsCount,
  Ribbon,
  type RibbonTone,
} from "@views/offers/components/CatalogKit";
import { downloadVoucher } from "@utils/voucherDownload";
import { toast } from "react-toastify";
import { pickLocalized } from "@utils/pickLocalized";

const OrdersPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const langBase = i18n.language?.split("-")[0] || "en";
  const isRTL = useIsRTL();
  const token = useUserStore((s) => s.token);
  const getToken = useUserStore.getState;
  const { data: ordersData, isLoading, isError, error } = useOrders(undefined, { enabled: !!token });
  const orders = useMemo(() => normalizeOrdersList(ordersData ?? null), [ordersData]);
  const cancelOrderMutation = useCancelOrder();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);

  const [filter, setFilter] = useState<
    "all" | "pending" | "active" | "used" | "expired" | "cancelled"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const filteredOrders =
    filter === "all"
      ? orders
      : orders.filter((order) => order.status === filter);

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const dateLocale =
    langBase === "ar"
      ? "ar-SA"
      : langBase === "ur"
        ? "ur-PK"
        : langBase === "hi"
          ? "hi-IN"
          : "en-US";

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return isRTL ? "في انتظار الدفع" : "Awaiting Payment";
      case "active":
        return isRTL ? "مؤكد - جاهز للاستخدام" : "Confirmed - Ready to Use";
      case "used":
        return isRTL ? "تم التفعيل" : "Activated";
      case "expired":
        return isRTL ? "منتهي الصلاحية" : "Expired";
      case "cancelled":
        return isRTL ? "ملغي" : "Cancelled";
      default:
        return status;
    }
  };

  /** نغمة شارة الحالة — من نغمات الاتجاه البصري الجديد */
  const getStatusTone = (status: string): RibbonTone => {
    switch (status) {
      case "pending":
        return "ending";
      case "active":
        return "vip";
      case "used":
        return "new";
      case "expired":
        return "muted";
      case "cancelled":
        return "hot";
      default:
        return "info";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <IoTimeOutline className="w-4 h-4" />;
      case "active":
        return <IoCheckmarkCircleOutline className="w-4 h-4" />;
      case "used":
        return <IoCheckmarkCircleOutline className="w-4 h-4" />;
      case "expired":
        return <IoTimeOutline className="w-4 h-4" />;
      case "cancelled":
        return <IoCloseCircleOutline className="w-4 h-4" />;
      default:
        return <IoReceiptOutline className="w-4 h-4" />;
    }
  };

  const canCancelOrder = (order: (typeof orders)[number]) => {
    // مصدر الحقيقة الأول: قرار الباك إند (يطبّق نافذة الـ 3 أيام للعروض المدفوعة)
    if (typeof order.canCancel === "boolean") return order.canCancel;

    // Fallback: نفس المنطق القديم (للـ APIs اللي لسه ما رجعت can_cancel)
    if (order.orderType && order.orderType !== "offer") return false;
    if (!order.orderType && order.items?.[0]?.type && order.items[0].type !== "offer") return false;

    const total = Number(order.totalAmount ?? 0);
    if (total <= 0) return false;

    const rawStatus = String(order.rawStatus ?? "").toLowerCase();
    const isUsed = rawStatus === "used" || rawStatus === "redeemed" || Boolean(order.usedAt);
    if (isUsed) return false;

    if (order.status === "cancelled") return false;

    if (order.expiresAt) {
      const exp = new Date(order.expiresAt).getTime();
      if (!Number.isNaN(exp) && exp < Date.now()) return false;
    }

    // نافذة 3 أيام: لو الباك ما رجع can_cancel نطبق القاعدة هنا أيضاً
    if (order.createdAt) {
      const created = new Date(order.createdAt).getTime();
      if (!Number.isNaN(created)) {
        const days = (Date.now() - created) / (1000 * 60 * 60 * 24);
        if (days >= 3) return false;
      }
    }

    return true;
  };

  const openCancelModal = (orderId: string) => {
    setCancelTargetId(orderId);
    setCancelModalOpen(true);
  };

  const closeCancelModal = () => {
    if (cancelOrderMutation.isPending) return;
    setCancelModalOpen(false);
    setCancelTargetId(null);
  };

  const confirmCancelOrder = () => {
    if (!cancelTargetId || cancelOrderMutation.isPending) return;
    cancelOrderMutation.mutate(cancelTargetId, {
      onSuccess: (res) => {
        const payload = (res as { data?: unknown })?.data ?? res;
        const p = payload as Record<string, unknown>;
        const nestedMessage =
          (
            (p?.data as Record<string, unknown> | undefined)?.order as
              | Record<string, unknown>
              | undefined
          )?.message ?? p?.message;
        const msg =
          (nestedMessage as string | undefined) ||
          (p?.msg as string | undefined) ||
          t("orders.toast_cancel_ok");
        toast.success(msg);
        closeCancelModal();
      },
      onError: (err) => {
        const msg =
          (err as { response?: { data?: { msg?: string; message?: string } } })
            ?.response?.data?.msg ||
          (err as { response?: { data?: { msg?: string; message?: string } } })
            ?.response?.data?.message ||
          t("orders.toast_cancel_fail");
        toast.error(String(msg));
      },
    });
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-mk-tint3 pt-24 pb-28 flex items-center justify-center px-4" style={{ marginTop: "77px" }}>
        <EmptyState
          className="max-w-md"
          icon={<IoReceiptOutline />}
          title={t("orders.login_required")}
          description={t("orders.sign_in_to_view")}
          actionLabel={t("orders.login_cta")}
          actionTo="/login?returnUrl=/orders"
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-mk-tint3 pt-8 pb-28" style={{ marginTop: "77px" }}>
        <div className="container mx-auto px-4">
          <SkeletonRows count={5} />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-mk-tint3 pt-8 pb-28 flex items-center justify-center px-4" style={{ marginTop: "77px" }}>
        <ErrorState
          className="max-w-md"
          title={t("orders.error_title")}
          description={String(error?.message || t("orders.load_failed"))}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-mk-tint3 pt-8 pb-28"
      style={{ marginTop: "77px" }}
    >
      <div className="container mx-auto px-4 sm:px-4 lg:px-4">
        {cancelModalOpen && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
            onClick={closeCancelModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-order-title"
          >
            <div
              className="relative bg-white rounded-mk-xl shadow-xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              dir={isRTL ? "rtl" : "ltr"}
            >
              <button
                type="button"
                onClick={closeCancelModal}
                className="absolute top-4 end-4 p-2 text-mk-muted hover:text-mk-text-strong hover:bg-mk-tint2 rounded-full transition-colors z-10"
                aria-label={t("orders.close")}
                disabled={cancelOrderMutation.isPending}
              >
                <IoCloseCircleOutline className="text-2xl" />
              </button>

              <div className="p-6 text-center">
                <div className="mx-auto w-14 h-14 rounded-mk-md bg-red-50 flex items-center justify-center text-red-600 mb-4">
                  <IoTrashOutline className="w-7 h-7" />
                </div>
                <h2
                  id="cancel-order-title"
                  className="text-xl font-bold text-mk-text mb-2"
                >
                  {t("orders.cancel_modal_title")}
                </h2>
                <p className="text-mk-muted text-sm leading-relaxed mb-6">
                  {t("orders.cancel_modal_body")}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    type="button"
                    onClick={closeCancelModal}
                    disabled={cancelOrderMutation.isPending}
                    className="order-2 sm:order-1 px-6 py-3 border border-mk-border-2 text-mk-text-strong rounded-full font-bold hover:bg-mk-tint3 transition-colors disabled:opacity-60"
                  >
                    {t("orders.back")}
                  </button>
                  <button
                    type="button"
                    onClick={confirmCancelOrder}
                    disabled={cancelOrderMutation.isPending}
                    className="order-1 sm:order-2 px-6 py-3 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition-colors disabled:opacity-60"
                  >
                    {cancelOrderMutation.isPending
                      ? "..."
                      : t("orders.confirm_cancel_order")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* ترويسة الصفحة — تدرّج بنفسجي + وصف + مسار تنقّل */}
        <PanelHero
          className="mb-6"
          eyebrow={t("orders.eyebrow", "مشترياتك")}
          title={t("orders.title")}
          subtitle={t("orders.subtitle", { count: orders.length })}
          crumbs={[
            { label: t("home.navbar.home", "الرئيسية"), to: "/" },
            { label: t("orders.title") },
          ]}
          icon={<IoReceiptOutline className="h-6 w-6" />}
        />
        {/* شريط الفلاتر — شرائح قابلة للتمرير + عدّاد النتائج */}
        <div className="mb-8 flex flex-col gap-3 rounded-mk-lg border border-mk-border bg-white p-3.5 shadow-mk-card">
          <ChipBar label={t("ui.filters", "الفلاتر")}>
          {[
            {
              key: "all",
              label: isRTL ? "الكل" : "All",
              count: orders.length,
            },
            {
              key: "pending",
              label: isRTL ? "في الانتظار" : "Pending",
              count: orders.filter((order) => order.status === "pending")
                .length,
            },
            {
              key: "active",
              label: isRTL ? "مؤكد" : "Confirmed",
              count: orders.filter((order) => order.status === "active")
                .length,
            },
            {
              key: "used",
              label: isRTL ? "تم التفعيل" : "Activated",
              count: orders.filter((order) => order.status === "used")
                .length,
            },
            {
              key: "expired",
              label: isRTL ? "منتهي" : "Expired",
              count: orders.filter((order) => order.status === "expired")
                .length,
            },
            {
              key: "cancelled",
              label: isRTL ? "ملغي" : "Cancelled",
              count: orders.filter((order) => order.status === "cancelled")
                .length,
            },
          ].map((filterOption) => (
            <Chip
              key={filterOption.key}
              active={filter === filterOption.key}
              count={filterOption.count}
              onClick={() =>
                setFilter(
                  filterOption.key as
                    | "all"
                    | "pending"
                    | "active"
                    | "used"
                    | "expired"
                    | "cancelled"
                )
              }
            >
              {filterOption.label}
            </Chip>
          ))}
          </ChipBar>
          <ResultsCount
            count={filteredOrders.length}
            label={t("orders.results_suffix", "طلب")}
          />
        </div>

        {/* Orders Table */}
        {currentOrders.length > 0 ? (
          <>
            <div className="overflow-hidden rounded-mk-lg border border-mk-border bg-white shadow-mk-card">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-mk-border">
                  <thead className="bg-[linear-gradient(135deg,#F2EFFA,#EFEAF8)]">
                    <tr>
                      <th className="px-6 py-3.5 text-start text-[11.5px] font-extrabold uppercase tracking-wider text-mk-primary">
                        {t("orders.table.order_number")}
                      </th>
                      <th className="px-6 py-3.5 text-start text-[11.5px] font-extrabold uppercase tracking-wider text-mk-primary">
                        {t("orders.table.date")}
                      </th>
                      <th className="px-6 py-3.5 text-start text-[11.5px] font-extrabold uppercase tracking-wider text-mk-primary">
                        {t("orders.table.offer")}
                      </th>
                      <th className="px-6 py-3.5 text-start text-[11.5px] font-extrabold uppercase tracking-wider text-mk-primary">
                        {t("orders.table.status")}
                      </th>
                      <th className="px-6 py-3.5 text-start text-[11.5px] font-extrabold uppercase tracking-wider text-mk-primary">
                        {t("orders.table.total")}
                      </th>
                      <th className="px-6 py-3.5 text-start text-[11.5px] font-extrabold uppercase tracking-wider text-mk-primary">
                        {t("orders.table.payment_method")}
                      </th>
                      <th className="px-6 py-3.5 text-start text-[11.5px] font-extrabold uppercase tracking-wider text-mk-primary">
                        {t("orders.table.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-mk-border">
                    {currentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-mk-tint3">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-mk-text">
                            #{String(order.id).slice(-8)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-mk-text">
                            {new Date(order.createdAt).toLocaleDateString(
                              dateLocale,
                            )}
                          </div>
                          <div className="text-sm text-mk-muted">
                            {new Date(order.createdAt).toLocaleTimeString(
                              dateLocale,
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3 space-x-reverse">
                            {(order.items[0]?.image) ? (
                              <img
                                src={order.items[0].image}
                                alt={
                                  order.items[0]?.title
                                    ? pickLocalized(
                                        order.items[0].title,
                                        langBase,
                                      )
                                    : ""
                                }
                                className="w-10 h-10 rounded-mk-sm object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-mk-sm bg-mk-border-strong/50 flex items-center justify-center text-mk-muted text-xs">
                                #
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-mk-text">
                                {order.items[0]?.title
                                  ? pickLocalized(
                                      order.items[0].title,
                                      langBase,
                                    )
                                  : "—"}
                              </div>
                              <div className="text-sm text-mk-muted">
                                {order.items.length > 1 &&
                                  t("orders.more_offers", {
                                    count: order.items.length - 1,
                                  })}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            {getStatusIcon(order.status)}
                            <Ribbon tone={getStatusTone(order.status)}>
                              {getStatusLabel(order.status)}
                            </Ribbon>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-[#400198] flex items-center gap-1">
                            {order.totalAmount}
                            <CurrencyIcon
                              size={14}
                              className="text-[#400198]"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-mk-text">
                            {order.paymentMethod}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2 space-x-reverse">
                            <Link
                              to={`/orders/${order.id}`}
                              className="text-[#400198] hover:text-mk-deep transition-colors inline-flex items-center gap-1"
                            >
                              <IoEyeOutline className="w-4 h-4" />
                              {t("orders.view")}
                            </Link>
                            {order.status === "completed" && order.voucherUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  downloadVoucher(order.voucherUrl!, () => getToken().token)
                                    .catch(() => {})
                                }
                                className="text-green-600 hover:text-green-700 transition-colors inline-flex items-center gap-1"
                              >
                                <IoDownloadOutline className="w-4 h-4" />
                                {t("orders.download")}
                              </button>
                            )}
                            {order.invoiceUrl && (
                              <a
                                href={order.invoiceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#400198] hover:text-mk-deep transition-colors inline-flex items-center gap-1"
                                title={isRTL ? "تحميل الفاتورة" : "Download invoice"}
                              >
                                <IoDownloadOutline className="w-4 h-4" />
                                {isRTL ? "الفاتورة" : "Invoice"}
                              </a>
                            )}
                            {canCancelOrder(order) && (
                              <button
                                type="button"
                                onClick={() => openCancelModal(order.id)}
                                disabled={cancelOrderMutation.isPending}
                                className="text-red-600 hover:text-red-700 transition-colors inline-flex items-center gap-1 disabled:opacity-60"
                              >
                                <IoTrashOutline className="w-4 h-4" />
                                {t("orders.cancel_action")}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 space-x-reverse mt-8">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="min-h-[44px] rounded-full border border-mk-border-2 bg-white px-4 text-[13px] font-bold text-mk-text-strong transition-colors hover:bg-mk-tint3 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t("pagination.previous")}
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-h-[44px] min-w-[44px] rounded-full text-[13px] font-bold transition-colors ${
                        currentPage === page
                          ? "bg-[linear-gradient(135deg,#400198,#6703EB)] text-white shadow-[0_8px_20px_-8px_rgba(64,1,152,0.9)]"
                          : "border border-mk-border-2 bg-white text-mk-text-strong hover:bg-mk-tint3"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="min-h-[44px] rounded-full border border-mk-border-2 bg-white px-4 text-[13px] font-bold text-mk-text-strong transition-colors hover:bg-mk-tint3 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t("pagination.next")}
                </button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={<IoReceiptOutline />}
            title={
              filter === "all"
                ? t("orders.empty.title")
                : t("orders.empty.title_filtered", {
                    status: getStatusLabel(filter),
                  })
            }
            description={t("orders.empty.description")}
            actionLabel={t("orders.empty.browse_offers")}
            actionTo="/offers"
          />
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
