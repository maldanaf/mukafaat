"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, Link } from "@/lib/router-compat";
import { Helmet } from "@/lib/helmet-compat";
import { useIsRTL } from "@hooks";
import { IoArrowBackOutline, IoCheckmarkCircle } from "react-icons/io5";
import { FiShield } from "react-icons/fi";
import { useOrderDetail, useVerifyMerchantOrderCode } from "@hooks/api/useMokafaatQueries";
import { useUserStore } from "@stores/userStore";
import { LoadingSpinner } from "@components/LoadingSpinner";
import { toast } from "react-toastify";

const OrderActivatePage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const isRTL = useIsRTL();
  const token = useUserStore((s) => s.token);

  const [code, setCode] = useState(["", "", "", ""]);
  const [activated, setActivated] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { data: rawOrder, isLoading } = useOrderDetail(orderId ?? "");
  const verifyCode = useVerifyMerchantOrderCode();

  // استخراج بيانات الطلب
  const orderData = React.useMemo(() => {
    if (!rawOrder) return null;
    const r = rawOrder as Record<string, unknown>;
    const data = r?.data as Record<string, unknown> | undefined;
    const order = (data?.order ?? data ?? r) as Record<string, unknown>;
    return {
      id: order.id,
      orderNumber: order.order_number as string,
      status: order.status as string,
      activationCode: order.activation_code as string,
      item: order.item as { name?: string; image?: string } | undefined,
      merchant: (order.merchant ?? (order.item as Record<string, unknown>)?.merchant) as { name?: string; logo?: string } | undefined,
    };
  }, [rawOrder]);

  // Focus أول input عند التحميل
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // أرقام فقط
    const newCode = [...code];
    newCode[index] = value.slice(-1); // آخر رقم فقط
    setCode(newCode);
    setErrorMsg(null);

    // انتقل للخانة التالية
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pasted.length === 4) {
      setCode(pasted.split(""));
      inputRefs.current[3]?.focus();
    }
  };

  const handleSubmit = () => {
    const fullCode = code.join("");
    if (fullCode.length !== 4) {
      setErrorMsg(isRTL ? "أدخل الكود المكون من 4 أرقام" : "Enter the 4-digit code");
      return;
    }
    if (!orderId) return;

    setErrorMsg(null);
    verifyCode.mutate(
      { orderId, verification_code: fullCode },
      {
        onSuccess: (res: unknown) => {
          const data = res as Record<string, unknown>;
          const root = (data?.data ?? data) as Record<string, unknown>;
          if (root.status === false) {
            setErrorMsg((root.msg as string) || (isRTL ? "كود خاطئ" : "Wrong code"));
            setCode(["", "", "", ""]);
            inputRefs.current[0]?.focus();
            return;
          }
          setActivated(true);
          toast.success(isRTL ? "تم تفعيل العرض بنجاح!" : "Offer activated successfully!");
        },
        onError: (err: unknown) => {
          const errData = (err as { response?: { data?: { msg?: string; message?: string } } })?.response?.data;
          setErrorMsg(errData?.msg || errData?.message || (isRTL ? "كود التفعيل غير صحيح" : "Invalid activation code"));
          setCode(["", "", "", ""]);
          inputRefs.current[0]?.focus();
        },
      }
    );
  };

  if (!token) {
    return (
      <div className="min-h-screen pt-10 pb-10 flex items-center justify-center"
        style={{ background: "linear-gradient(150deg, #1B1150 0%, #400198 55%, #6703EB 100%)" }}>
        <div className="text-center bg-white/10 rounded-mk-xl p-8 max-w-md mx-4">
          <h2 className="text-xl font-bold text-white mb-4">
            {isRTL ? "تسجيل الدخول مطلوب" : "Login required"}
          </h2>
          <Link to="/login" className="bg-white text-mk-primary px-6 py-3 rounded-mk-md font-medium">
            {isRTL ? "تسجيل الدخول" : "Login"}
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center"
        style={{ background: "linear-gradient(150deg, #1B1150 0%, #400198 55%, #6703EB 100%)" }}>
        <LoadingSpinner onDark />
      </div>
    );
  }

  if (!orderData || orderData.status === "used") {
    return (
      <div className="min-h-screen pt-10 pb-10 flex items-center justify-center px-4"
        style={{ background: "linear-gradient(150deg, #1B1150 0%, #400198 55%, #6703EB 100%)" }}>
        <div className="w-full max-w-md bg-white rounded-mk-xl shadow-xl p-8 text-center">
          {orderData?.status === "used" ? (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <IoCheckmarkCircle className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-mk-text mb-2">
                {isRTL ? "تم تفعيل هذا العرض مسبقاً" : "This offer is already activated"}
              </h2>
              {orderData.item?.name && (
                <p className="text-mk-muted mb-1">{orderData.item.name}</p>
              )}
              {orderData.merchant?.name && (
                <p className="text-sm text-mk-muted mb-6">
                  {isRTL ? "لدى" : "at"} {orderData.merchant.name}
                </p>
              )}
              <p className="text-sm text-green-600 bg-green-50 rounded-mk-sm p-3 mb-6">
                {isRTL
                  ? "تم استخدام هذا العرض بنجاح. يمكنك مراجعة تفاصيل الطلب أو تصفح عروض أخرى."
                  : "This offer has been used successfully. You can view order details or browse other offers."}
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <IoArrowBackOutline className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-mk-text mb-4">
                {isRTL ? "الطلب غير موجود" : "Order not found"}
              </h2>
            </>
          )}
          <div className="flex gap-3">
            <button onClick={() => navigate(`/orders/${orderId}`)}
              className="flex-1 py-3 rounded-mk-md bg-[#400198] text-white font-medium hover:bg-[#33007a] transition-colors">
              {isRTL ? "تفاصيل الطلب" : "Order Details"}
            </button>
            <button onClick={() => navigate("/offers")}
              className="flex-1 py-3 rounded-mk-md border border-mk-border-2 text-mk-text-strong font-medium hover:bg-mk-tint3 transition-colors">
              {isRTL ? "تصفح العروض" : "Browse Offers"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // بعد التفعيل الناجح
  if (activated) {
    return (
      <>
        <Helmet>
          <title>{isRTL ? "تم التفعيل" : "Activated"}</title>
        </Helmet>
        <div className="min-h-screen pt-10 pb-10 flex items-center justify-center px-4"
          style={{ background: "linear-gradient(150deg, #1B1150 0%, #400198 55%, #6703EB 100%)" }}>
          <div className="w-full max-w-md bg-white rounded-mk-xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <IoCheckmarkCircle className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-mk-text mb-2">
              {isRTL ? "تم تفعيل العرض بنجاح!" : "Offer Activated Successfully!"}
            </h2>
            <p className="text-mk-muted mb-2">
              {orderData.item?.name || ""}
            </p>
            {orderData.merchant?.name && (
              <p className="text-sm text-mk-muted mb-6">
                {isRTL ? "لدى" : "at"} {orderData.merchant.name}
              </p>
            )}
            <p className="text-sm text-green-600 bg-green-50 rounded-mk-sm p-3 mb-6">
              {isRTL
                ? "استمتع بعرضك! يمكنك مراجعة تفاصيل الطلب من صفحة طلباتي."
                : "Enjoy your offer! You can review order details from My Orders."}
            </p>
            <div className="flex gap-3">
              <button onClick={() => navigate(`/orders/${orderId}`)}
                className="flex-1 py-3 rounded-mk-md bg-[#400198] text-white font-medium hover:bg-[#33007a] transition-colors">
                {isRTL ? "تفاصيل الطلب" : "Order Details"}
              </button>
              <button onClick={() => navigate("/offers")}
                className="flex-1 py-3 rounded-mk-md border border-mk-border-2 text-mk-text-strong font-medium hover:bg-mk-tint3 transition-colors">
                {isRTL ? "تصفح العروض" : "Browse Offers"}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{isRTL ? "تفعيل العرض" : "Activate Offer"}</title>
      </Helmet>

      <div className="min-h-screen pt-10 pb-10 flex flex-col items-center px-4"
        style={{ background: "linear-gradient(150deg, #1B1150 0%, #400198 55%, #6703EB 100%)" }}>

        {/* زر العودة */}
        <div className="w-full max-w-md flex items-center mb-6">
          <button type="button" onClick={() => navigate(`/orders/${orderId}`)}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors">
            <IoArrowBackOutline className="w-6 h-6" />
            <span className="text-sm font-medium">{isRTL ? "تفاصيل الطلب" : "Order Details"}</span>
          </button>
        </div>

        {/* كارد التفعيل */}
        <div className="w-full max-w-md bg-white rounded-mk-xl shadow-xl p-8">
          {/* أيقونة */}
          <div className="w-16 h-16 bg-[#400198]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiShield className="w-8 h-8 text-[#400198]" />
          </div>

          <h2 className="text-xl font-bold text-mk-text text-center mb-2">
            {isRTL ? "تفعيل العرض عند التاجر" : "Activate Offer at Merchant"}
          </h2>

          {/* اسم العرض والتاجر */}
          {(orderData.item?.name || orderData.merchant?.name) && (
            <div className="text-center mb-6">
              {orderData.item?.name && (
                <p className="text-mk-text-strong font-medium">{orderData.item.name}</p>
              )}
              {orderData.merchant?.name && (
                <p className="text-sm text-mk-muted">{orderData.merchant.name}</p>
              )}
            </div>
          )}

          <p className="text-mk-muted text-center text-sm mb-6">
            {isRTL
              ? "اطلب من التاجر كود التفعيل المكوّن من 4 أرقام وأدخله هنا"
              : "Ask the merchant for the 4-digit activation code and enter it below"}
          </p>

          {/* حقول الكود */}
          <div className="flex justify-center gap-3 mb-4" dir="ltr" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-14 h-16 text-center text-2xl font-bold rounded-mk-md border-2 transition-colors outline-none
                  ${errorMsg ? "border-red-400 bg-red-50" : digit ? "border-[#400198] bg-[#400198]/5" : "border-mk-border-2"}
                  focus:border-[#400198] focus:bg-[#400198]/5`}
              />
            ))}
          </div>

          {/* رسالة خطأ */}
          {errorMsg && (
            <p className="text-red-500 text-sm text-center mb-4">{errorMsg}</p>
          )}

          {/* زر التفعيل */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={code.join("").length !== 4 || verifyCode.isPending}
            className="w-full py-3.5 rounded-mk-md bg-[#400198] text-white font-medium hover:bg-[#33007a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {verifyCode.isPending
              ? (isRTL ? "جاري التحقق..." : "Verifying...")
              : (isRTL ? "تفعيل العرض" : "Activate Offer")}
          </button>

          {/* ملاحظة */}
          <p className="text-xs text-mk-faint text-center mt-4">
            {isRTL
              ? "كود التفعيل خاص بالتاجر ويُستخدم للتأكد من استلامك للعرض"
              : "The activation code is merchant-specific and confirms you received the offer"}
          </p>
        </div>
      </div>
    </>
  );
};

export default OrderActivatePage;
