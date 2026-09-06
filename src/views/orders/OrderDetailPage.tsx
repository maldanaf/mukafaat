"use client";

import { t } from "i18next";
import React, { useState } from "react";
import { useParams, useNavigate, Link } from "@/lib/router-compat";
import { Helmet } from "@/lib/helmet-compat";
import { useIsRTL } from "@hooks";
import {
  IoClose,
  IoDownloadOutline,
  IoArrowBackOutline,
} from "react-icons/io5";
import CurrencyIcon from "@components/CurrencyIcon";
import { useOrderDetail } from "@hooks/api/useMokafaatQueries";
import { useUserStore } from "@stores/userStore";
import { LoadingSpinner } from "@components/LoadingSpinner";
import { normalizeOrdersList, type NormalizedOrder } from "@utils/orders";
import {
  downloadVoucher,
  resolveOrderVoucherUrl,
} from "@utils/voucherDownload";
import { toast } from "react-toastify";

/** شكل الطلب الخام من API تفاصيل الطلب (عرض أو بطاقة) */
interface RawOrder {
  id?: number;
  order_number?: string;
  order_type?: string;
  activation_code?: string;
  qr_code_url?: string;
  barcode_url?: string;
  card_codes?: string[];
  created_at?: string;
  expires_at?: string;
  activated_at?: string;
  quantity?: number;
  total_price?: string | number;
  unit_price?: string | number;
  status?: string;
  voucher_url?: string;
  voucherUrl?: string;
  item?: {
    id?: number;
    name?: string;
    description?: string;
    image?: string;
    price?: string;
    old_price?: string;
    price_after?: string;
    price_before?: string;
    discount_percent?: string;
    discount_percentage?: number | null;
    terms?: string;
    privacy_policy?: string;
    privacy_policy_ar?: string;
    privacy_policy_en?: string;
    features?: string;
    validity_type?: string;
    is_renewable?: boolean;
    merchant?: { id?: number; name?: string; logo?: string; phone?: string };
  };
  merchant?: {
    id?: number;
    name?: string;
    logo?: string;
    phone?: string;
  };
}

function formatVoucherNumber(code: string): string {
  const digits = String(code).replace(/\D/g, "");
  return digits.replace(/(.{3})/g, "$1 ").trim();
}

function formatOrderDate(dateStr: string | undefined, isRTL: boolean): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return isRTL
    ? date.toLocaleDateString("ar-SA", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
}

const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const isRTL = useIsRTL();
  const token = useUserStore((s) => s.token);
  const getToken = useUserStore.getState;
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const {
    data: rawOrder,
    isLoading,
    isError,
    error,
  } = useOrderDetail(orderId ?? "");

  const order: NormalizedOrder | null = React.useMemo(() => {
    if (!rawOrder) return null;
    const r = rawOrder as Record<string, unknown>;
    const inner = (r?.data as Record<string, unknown>)?.order ?? r?.data ?? r;
    const single = Array.isArray(inner) ? inner[0] : inner;
    if (!single || typeof single !== "object") return null;
    return normalizeOrdersList({ data: [single] })[0] ?? null;
  }, [rawOrder]);

  const rawOrderData: RawOrder | null = React.useMemo(() => {
    if (!rawOrder) return null;
    const r = rawOrder as Record<string, unknown>;
    const data = r?.data as Record<string, unknown> | undefined;
    const o = data?.order ?? data ?? r;
    const single = Array.isArray(o) ? o[0] : o;
    return (single as RawOrder) ?? null;
  }, [rawOrder]);

  const voucherDownloadUrl = React.useMemo(
    () =>
      resolveOrderVoucherUrl(rawOrder) ??
      rawOrderData?.voucher_url ??
      rawOrderData?.voucherUrl ??
      order?.voucherUrl,
    [rawOrder, rawOrderData, order],
  );

  const handleDownloadVoucher = () => {
    const url = voucherDownloadUrl;
    if (!url || !token) return;
    downloadVoucher(url, () => getToken().token).catch((e) => {
      const msg =
        e instanceof Error && e.message
          ? e.message
          : t("orders.t_1fb1a6", "فشل التنزيل");
      toast.error(msg);
    });
  };

  if (!token) {
    return (
      <div
        className="min-h-screen pt-24 pb-28 flex items-center justify-center"
        style={{ background: "linear-gradient(150deg, #1B1150 0%, #400198 55%, #6703EB 100%)" }}
      >
        <div className="text-center bg-white/10 rounded-mk-xl p-8 max-w-md mx-4">
          <h2 className="text-xl font-bold text-white mb-4">
            {t("orders.t_4f66ec", "تسجيل الدخول مطلوب")}
          </h2>
          <Link
            to="/login?returnUrl=/orders"
            className="bg-white text-mk-primary px-6 py-3 rounded-mk-md font-medium hover:bg-white/90 transition-colors inline-block"
          >
            {t("orders.t_8c6117", "تسجيل الدخول")}
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading || !orderId) {
    return (
      <div
        className="min-h-screen flex justify-center items-center"
        style={{ background: "linear-gradient(150deg, #1B1150 0%, #400198 55%, #6703EB 100%)" }}
      >
        <LoadingSpinner onDark />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 pb-24"
        style={{ background: "linear-gradient(150deg, #1B1150 0%, #400198 55%, #6703EB 100%)" }}
      >
        <div className="text-center bg-white/10 rounded-mk-xl p-8 max-w-md">
          <h2 className="text-xl font-bold text-white mb-2">
            {t("orders.t_6e3a20", "الطلب غير موجود")}
          </h2>
          <p className="text-white/80 mb-6">{String(error?.message || "")}</p>
          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="bg-white text-mk-primary px-6 py-3 rounded-mk-md font-medium hover:bg-white/90 transition-colors"
          >
            {t("orders.t_2b1d4f", "العودة للطلبات")}
          </button>
        </div>
      </div>
    );
  }

  const voucherNumber =
    rawOrderData?.activation_code ?? order?.activationCode ?? "";
  const totalPrice =
    rawOrderData?.total_price != null
      ? typeof rawOrderData.total_price === "string"
        ? parseFloat(rawOrderData.total_price)
        : rawOrderData.total_price
      : (order?.totalAmount ?? 0);
  const terms = rawOrderData?.item?.terms;
  const privacyPolicy =
    rawOrderData?.item?.privacy_policy ||
    (isRTL
      ? rawOrderData?.item?.privacy_policy_ar
      : rawOrderData?.item?.privacy_policy_en) ||
    rawOrderData?.item?.privacy_policy_ar ||
    rawOrderData?.item?.privacy_policy_en ||
    "";
  const hasVoucher = !!voucherDownloadUrl;
  const isCardOrder = (rawOrderData?.order_type ?? order?.orderType) === "card";
  const isActiveOffer = !isCardOrder && (order?.status === "active" || rawOrderData?.status === "active");
  const showActivateDealButton = isActiveOffer;
  const barcodeUrl = rawOrderData?.barcode_url ?? order?.barcodeUrl;
  const cardCodes = rawOrderData?.card_codes ?? order?.cardCodes ?? [];
  const orderItem = rawOrderData?.item;
  const orderMerchant = rawOrderData?.item?.merchant ?? rawOrderData?.merchant;

  return (
    <>
      <Helmet>
        <title>
          {t("orders.t_52ab77", "تفاصيل الطلب")} #
          {order.orderNumber ?? order.id}
        </title>
      </Helmet>

      <div
        className="min-h-screen px-4 flex flex-col items-center pt-10 pb-10"
        style={{
          background: "linear-gradient(150deg, #1B1150 0%, #400198 55%, #6703EB 100%)",
        }}
      >
        {/* زر العودة فوق الكارد */}
        <div className="w-full max-w-md flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
          >
            <IoArrowBackOutline className="w-6 h-6" />
            <span className="text-sm font-medium">
              {t("orders.t_3c5b19", "الطلبات")}
            </span>
          </button>
        </div>

        {/* كارد في منتصف الشاشة */}
        <div className="w-full max-w-md bg-white rounded-mk-xl shadow-xl overflow-hidden flex-shrink-0">
          <div className="pt-6 pb-8 px-5">
            <div className="flex justify-between items-center mb-4">
              {/* بادج الحالة */}
              {(() => {
                const st = rawOrderData?.status ?? order?.rawStatus ?? order?.status;
                const map: Record<string, { label: string; labelEn: string; color: string }> = {
                  pending:   { label: t("orders.t_0befbb", "في انتظار الدفع"), labelEn: "Awaiting Payment", color: "bg-yellow-100 text-yellow-800" },
                  active:    { label: t("orders.t_aa14a6", "مؤكد - جاهز للاستخدام"), labelEn: "Confirmed - Ready", color: "bg-blue-100 text-blue-800" },
                  used:      { label: t("orders.t_a22ac5", "تم التفعيل ✓"), labelEn: "Activated ✓", color: "bg-green-100 text-green-800" },
                  expired:   { label: t("orders.t_709d5f", "منتهي الصلاحية"), labelEn: "Expired", color: "bg-orange-100 text-orange-800" },
                  cancelled: { label: t("membership.t_91b1e1", "ملغي"), labelEn: "Cancelled", color: "bg-red-100 text-red-800" },
                };
                const info = map[String(st)] ?? map.pending;
                return (
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${info.color}`}>
                    {isRTL ? info.label : info.labelEn}
                  </span>
                );
              })()}
              <button
                type="button"
                onClick={() => navigate("/orders")}
                className="w-10 h-10 flex items-center justify-center rounded-full text-mk-muted hover:bg-mk-tint2 transition-colors"
                aria-label={t("ui.t_5bf826", "إغلاق")}
              >
                <IoClose className="w-6 h-6" />
              </button>
            </div>

            {/* بطاقة رقمية: رموز البطاقة فقط */}
            {isCardOrder && cardCodes.length > 0 && (
              <div className="mb-6">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-mk-tint rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🎫</span>
                  </div>
                  <p className="text-sm font-medium text-mk-muted">
                    {t("orders.t_1afaae", "رموز البطاقة")}
                  </p>
                </div>
                <div className="space-y-2">
                  {cardCodes.map((code, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-gradient-to-r from-mk-tint3 to-white border border-mk-border-strong rounded-mk-md py-3 px-4"
                    >
                      <span className="font-mono font-bold text-lg text-mk-text tracking-wider">{code}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(code);
                          import("react-toastify").then(({ toast }) =>
                            toast.success(t("orders.t_5a9a57", "تم النسخ"))
                          );
                        }}
                        className="text-xs text-mk-primary hover:text-mk-deep font-medium bg-mk-tint hover:bg-mk-border-strong px-3 py-1.5 rounded-mk-sm transition-colors"
                      >
                        {t("orders.t_46e684", "نسخ")}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* عرض: QR + رقم القسيمة */}
            {!isCardOrder && (order.qrCodeUrl || rawOrderData?.qr_code_url) && (
              <div className="flex justify-center mb-6">
                <img
                  src={order.qrCodeUrl || rawOrderData?.qr_code_url || ""}
                  alt={t("orders.t_2db7d8", "رمز الاستجابة السريعة")}
                  className="w-48 h-48 object-contain"
                />
              </div>
            )}

            {!isCardOrder && voucherNumber && (
              <div className="text-center mb-2">
                <p className="text-2xl font-bold text-mk-text tracking-widest font-mono">
                  {formatVoucherNumber(voucherNumber)}
                </p>
                <p className="text-sm text-mk-muted mt-1">
                  {t("orders.t_e4c075", "رقم القسيمة")}
                </p>
              </div>
            )}

            {/* رموز بطاقة إضافية (لطلبات العروض اللي فيها card_codes) */}
            {!isCardOrder && cardCodes.length > 0 && (
              <div className="mb-6">
                <p className="text-sm text-mk-muted mb-2">
                  {t("orders.t_1afaae", "رموز البطاقة")}
                </p>
                <ul className="space-y-1">
                  {cardCodes.map((code, i) => (
                    <li
                      key={i}
                      className="text-center font-mono font-semibold text-mk-text bg-mk-tint3 py-2 px-3 rounded-mk-sm"
                    >
                      {code}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* تفاصيل الطلب — عمودين (في العربية: التسمية يمين، القيمة يسار) */}
            <div className="mt-8 space-y-4">
              <div
                className={`flex justify-between items-center text-sm gap-4 ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <span className="text-mk-text font-medium">
                  {formatOrderDate(
                    rawOrderData?.created_at ?? order.createdAt,
                    isRTL,
                  )}
                </span>
                <span className="text-mk-muted">
                  {t("orders.t_21fc46", "تاريخ الشراء")}
                </span>
              </div>
              {!isCardOrder && (
                <div
                  className={`flex justify-between items-center text-sm gap-4 ${isRTL ? "flex-row-reverse" : ""}`}
                >
                  <span className="text-mk-text font-medium">
                    {formatOrderDate(rawOrderData?.expires_at, isRTL)}
                  </span>
                  <span className="text-mk-muted">
                    {t("orders.t_090a00", "انتهاء الكوبون")}
                  </span>
                </div>
              )}
              {order.items?.[0] && (
                <div
                  className={`flex justify-between items-center text-sm gap-4 ${isRTL ? "flex-row-reverse" : ""}`}
                >
                  <span className="text-mk-text font-medium">
                    {order.items[0].title[isRTL ? "ar" : "en"]}
                  </span>
                  <span className="text-mk-muted">
                    {isCardOrder
                      ? t("orders.t_20ac8d", "البطاقة")
                      : t("orders.t_ba6e15", "العرض")}
                  </span>
                </div>
              )}
              {!order.items?.[0] && rawOrderData?.item?.name && (
                <div
                  className={`flex justify-between items-center text-sm gap-4 ${isRTL ? "flex-row-reverse" : ""}`}
                >
                  <span className="text-mk-text font-medium">
                    {rawOrderData.item.name}
                  </span>
                  <span className="text-mk-muted">
                    {isCardOrder
                      ? t("orders.t_20ac8d", "البطاقة")
                      : t("orders.t_ba6e15", "العرض")}
                  </span>
                </div>
              )}
              {/* التاجر (للبطاقات) */}
              {orderMerchant && (orderMerchant as { name?: string }).name && (
                <div
                  className={`flex justify-between items-center text-sm gap-4 ${isRTL ? "flex-row-reverse" : ""}`}
                >
                  <span className="text-mk-text font-medium flex items-center gap-2">
                    {(orderMerchant as { logo?: string }).logo && (
                      <img
                        src={(orderMerchant as { logo?: string }).logo}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    )}
                    {(orderMerchant as { name?: string }).name}
                  </span>
                  <span className="text-mk-muted">
                    {t("orders.t_dfc66e", "التاجر")}
                  </span>
                </div>
              )}
              {!isCardOrder && rawOrderData?.activated_at && (
                <div
                  className={`flex justify-between items-center text-sm gap-4 ${isRTL ? "flex-row-reverse" : ""}`}
                >
                  <span className="text-mk-text font-medium">
                    {formatOrderDate(rawOrderData.activated_at, isRTL)}
                  </span>
                  <span className="text-mk-muted">
                    {t("orders.t_2ea162", "تاريخ التفعيل")}
                  </span>
                </div>
              )}
              {rawOrderData?.expires_at && (
                <div
                  className={`flex justify-between items-center text-sm gap-4 ${isRTL ? "flex-row-reverse" : ""}`}
                >
                  <span className="text-mk-text font-medium">
                    {formatOrderDate(rawOrderData.expires_at, isRTL)}
                  </span>
                  <span className="text-mk-muted">
                    {t("orders.t_75152f", "انتهاء الصلاحية")}
                  </span>
                </div>
              )}
              <div
                className={`flex justify-between items-center text-sm gap-4 ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <span className="text-mk-text font-medium">
                  {order.items?.reduce((s, i) => s + i.quantity, 0) ??
                    rawOrderData?.quantity ??
                    1}
                </span>
                <span className="text-mk-muted">
                  {isCardOrder
                    ? t("orders.t_a95134", "الكمية")
                    : t("orders.t_dedd51", "عدد الصفقات المشتراة")}
                </span>
              </div>
              {/* نوع الصلاحية (للبطاقات) */}
              {isCardOrder && orderItem?.validity_type && (
                <div
                  className={`flex justify-between items-center text-sm gap-4 ${isRTL ? "flex-row-reverse" : ""}`}
                >
                  <span className="text-mk-text font-medium">
                    {orderItem.validity_type === "annual"
                      ? t("cards.t_019ca7", "سنوي")
                      : orderItem.validity_type === "monthly"
                        ? t("cards.t_564ef2", "شهري")
                        : orderItem.validity_type === "quarterly"
                          ? t("cards.t_bd8f12", "ربع سنوي")
                          : orderItem.validity_type}
                  </span>
                  <span className="text-mk-muted">
                    {t("orders.t_bfb2df", "نوع الصلاحية")}
                  </span>
                </div>
              )}
            </div>

            {/* خط متقطع ثم السعر الإجمالي */}
            <div className="border-t border-dashed border-mk-border mt-6 pt-6">
              <div
                className={`flex justify-between items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <span className="text-2xl font-bold text-[#fd671a] flex items-center gap-1">
                  {totalPrice}
                  <CurrencyIcon size={20} className="text-[#fd671a]" />
                </span>
                <span className="text-mk-muted">
                  {t("orders.t_8824f5", "السعر الإجمالي")}
                </span>
              </div>
            </div>

            {/* الشروط والأحكام + سياسة الخصوصية */}
            {(terms || privacyPolicy) && (
              <div className="mt-4 flex flex-wrap gap-4">
                {terms && (
                  <button
                    type="button"
                    onClick={() => setTermsOpen(true)}
                    className="text-sm text-mk-muted hover:text-[#fd671a] transition-colors inline-flex items-center gap-1"
                  >
                    {t("orders.t_bec6c4", "الشروط والأحكام")}
                    <span className="rtl:rotate-180" aria-hidden>→</span>
                  </button>
                )}
                {privacyPolicy && (
                  <button
                    type="button"
                    onClick={() => setPrivacyOpen(true)}
                    className="text-sm text-mk-muted hover:text-[#fd671a] transition-colors inline-flex items-center gap-1"
                  >
                    {t("orders.t_8b7b36", "سياسة الخصوصية")}
                    <span className="rtl:rotate-180" aria-hidden>→</span>
                  </button>
                )}
              </div>
            )}

            {/* أزرار الإجراءات */}
            <div className="border-t border-dashed border-mk-border mt-6 pt-6 space-y-3">
              {showActivateDealButton && (
                <button
                  type="button"
                  onClick={() => navigate(`/orders/${orderId}/activate`)}
                  className="w-full py-3 px-4 rounded-mk-md bg-[#400198] text-white font-medium hover:bg-[#33007a] transition-colors"
                >
                  {t("orders.t_cc1b3f", "تفعيل العرض عند التاجر")}
                </button>
              )}
              <div className="flex gap-3">
                {hasVoucher && (
                  <button
                    type="button"
                    onClick={handleDownloadVoucher}
                    className="flex-1 py-3 px-4 rounded-mk-md bg-[#fd671a] text-white font-medium hover:bg-[#D9500B] transition-colors flex items-center justify-center gap-2"
                  >
                    <IoDownloadOutline className="w-5 h-5" />
                    {t("orders.t_c97705", "تنزيل PDF")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate("/orders")}
                  className="flex-1 py-3 px-4 rounded-mk-md border border-mk-border-2 text-mk-text-strong font-medium hover:bg-mk-tint3 transition-colors"
                >
                  {t("orders.t_00246e", "طلباتي")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terms Modal */}
      {termsOpen && (
        <InfoModal
          title={t("orders.t_bec6c4", "الشروط والأحكام")}
          content={terms || ""}
          onClose={() => setTermsOpen(false)}
          isRTL={isRTL}
        />
      )}

      {/* Privacy Policy Modal */}
      {privacyOpen && (
        <InfoModal
          title={t("orders.t_8b7b36", "سياسة الخصوصية")}
          content={privacyPolicy}
          onClose={() => setPrivacyOpen(false)}
          isRTL={isRTL}
        />
      )}
    </>
  );
};

interface InfoModalProps {
  title: string;
  content: string;
  onClose: () => void;
  isRTL: boolean;
}

function stripHtml(html: string): string {
  if (typeof html !== "string") return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

const InfoModal: React.FC<InfoModalProps> = ({ title, content, onClose, isRTL }) => {
  const text = stripHtml(content);
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative bg-white rounded-mk-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-mk-border bg-gradient-to-r from-[#400198] to-[#6703EB]">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white"
            aria-label="close"
          >
            <IoClose className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 text-mk-text-strong leading-relaxed text-sm whitespace-pre-wrap">
          {text}
        </div>
        <div className="px-6 py-3 border-t border-mk-border bg-mk-tint3 text-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#400198] text-white hover:bg-[#33007a] transition-colors text-sm"
          >
            {t("ui.t_5bf826", "إغلاق")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
