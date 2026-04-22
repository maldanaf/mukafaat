"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  useParams,
  useSearchParams,
  useNavigate,
  useLocation,
  Link,
} from "@/lib/router-compat";
import { useIsRTL } from "@hooks";
import { FiArrowLeft } from "react-icons/fi";
import CurrencyIcon from "@components/CurrencyIcon";
import {
  Visa,
  Master,
  ApplePay,
  Mada,
  Wallet,
  WalletIcon,
  AboutPattern,
} from "@assets";
import {
  getRestaurantById,
  getOfferById,
  getOfferImage,
  getCompanyImage,
  offerCategories,
} from "@data/offers";
import { GetStartedSection } from "@views/home/components";
import { stripHtml } from "@utils/stripHtml";
import { useUserStore } from "@stores/userStore";
import { useCreateOrder, useSubscriptionStatus, useWallet } from "@hooks/api/useMokafaatQueries";
import { LoadingSpinner } from "@components/LoadingSpinner";
import { AxiosError } from "axios";
import { isUserSubscribed } from "@utils/subscription";
import { useQueryClient } from "@tanstack/react-query";
import { mokafaatKeys } from "@hooks/api/useMokafaatQueries";
import { initMoyasarPayment } from "@utils/moyasar";

const PaymentPage: React.FC = () => {
  const { category, merchantSlug } = useParams<{
    category: string;
    merchantSlug: string;
  }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isRTL = useIsRTL();
  const token = useUserStore((s) => s.token);
  const createOrder = useCreateOrder();
  const queryClient = useQueryClient();
  const { data: subscriptionStatusData } = useSubscriptionStatus(!!token);
  const isSubscribed = isUserSubscribed(subscriptionStatusData);

  const { data: walletData } = useWallet();
  const walletBalance = (() => {
    const root = (walletData as Record<string, unknown>)?.data ?? walletData;
    const w = (root as Record<string, unknown>)?.wallet as Record<string, unknown> | undefined;
    return Number(w?.wallet_balance ?? 0);
  })();

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showMoyasarForm, setShowMoyasarForm] = useState(false);
  const moyasarInitedRef = useRef(false);
  const moyasarConfigRef = useRef<{
    amountHalala: number;
    currency: string;
    description: string;
    publishableKey: string;
    callbackUrl: string;
    metadata: Record<string, unknown>;
  } | null>(null);

  // Get data from URL parameters
  const offerSlug = searchParams.get("offer");
  const quantity = parseInt(searchParams.get("quantity") || "1");

  // بيانات الطلب: من sessionStorage (محفوظة من صفحة التفاصيل) أو location.state أو static data
  const state = (() => {
    // أولاً: جرب sessionStorage
    try {
      const stored = sessionStorage.getItem("mokafaat_payment");
      if (stored) {
        return JSON.parse(stored) as {
          orderId?: string | number;
          order?: Record<string, unknown>;
          restaurant?: unknown;
          offer?: unknown;
        };
      }
    } catch {}
    // ثانياً: location.state (للتوافق)
    return location.state as {
      orderId?: string | number;
      order?: Record<string, unknown>;
      restaurant?: unknown;
      offer?: unknown;
    } | null | undefined;
  })();
  const orderIdFromUrl = searchParams.get("order_id");
  const orderIdFromState = state?.orderId ?? (orderIdFromUrl ? orderIdFromUrl : undefined);
  const orderFromState = state?.order;

  // Auto-create pending order on mount (for abandoned-cart tracking)
  const preOrderCreatedRef = useRef(false);
  useEffect(() => {
    if (!token || !offerSlug || preOrderCreatedRef.current || orderIdFromState) return;
    preOrderCreatedRef.current = true;
    createOrder.mutate(
      {
        order_type: "offer",
        item_id: offerSlug,
        quantity: 1,
        branch_id: undefined,
        use_wallet: false,
      },
      {
        onError: () => {
          preOrderCreatedRef.current = false;
        },
      },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, offerSlug, orderIdFromState]);
  const company = (state?.restaurant ?? (merchantSlug ? getRestaurantById(merchantSlug) : null)) as ReturnType<typeof getRestaurantById>;
  const offer = (state?.offer ?? (offerSlug && merchantSlug ? getOfferById(merchantSlug, offerSlug) : null)) as ReturnType<typeof getOfferById>;
  const categoryInfo = category
    ? offerCategories.find((cat) => cat.key === category)
    : null;

  // المبلغ الذي يدفعه المستخدم حسب حالة الاشتراك
  const unitPrice = (() => {
    if (!offer) return 0;
    // غير مشترك + فيه سعر لغير المشتركين
    if (!isSubscribed && offer.nonSubscriberPrice != null && offer.nonSubscriberPrice > 0) {
      return Number(offer.nonSubscriberPrice);
    }
    // مشترك أو سعر عادي
    if (offer.platformPrice !== undefined && offer.platformPrice !== null) {
      return Number(offer.platformPrice);
    }
    return Number(offer.discountPrice ?? 0);
  })();
  const totalPrice = offer ? unitPrice * quantity : 0;

  const [initialLoad, setInitialLoad] = useState(true);
  useEffect(() => {
    // انتظر لحظة قبل ما تقرر إن العرض مش موجود - sessionStorage يحتاج وقت
    const timer = setTimeout(() => setInitialLoad(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!initialLoad && !company && !offer) {
      navigate("/offers");
    }
  }, [initialLoad, company, offer, navigate]);

  useEffect(() => {
    if (!token && company && offer) {
      navigate(`/login?returnUrl=${encodeURIComponent(location.pathname + location.search)}`);
    }
  }, [token, company, offer, navigate, location.pathname, location.search]);

  useEffect(() => {
    if (!showMoyasarForm || moyasarInitedRef.current || !moyasarConfigRef.current) return;
    const config = moyasarConfigRef.current;
    moyasarInitedRef.current = true;
    initMoyasarPayment({
      ...config,
      elementSelector: ".mysr-form-offer",
      methods: ["creditcard"],
    }).catch(() => {
      setErrorMsg(isRTL ? "تعذر تحميل بوابة الدفع. حدّث الصفحة أو تواصل مع الدعم." : "Failed to load payment gateway. Refresh or contact support.");
      setShowMoyasarForm(false);
      moyasarInitedRef.current = false;
    });
  }, [showMoyasarForm, isRTL]);

  if (!company || !offer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {initialLoad ? (
          <LoadingSpinner />
        ) : (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              {isRTL ? "العرض غير موجود" : "Offer not found"}
            </h1>
            <button
              onClick={() => navigate("/offers")}
              className="px-6 py-3 bg-[#400198] text-white rounded-lg hover:bg-[#54015d] transition-colors"
            >
              {isRTL ? "العودة للعروض" : "Back to Offers"}
            </button>
          </div>
        )}
      </div>
    );
  }

  const walletCoversAll = walletBalance >= totalPrice && totalPrice > 0;
  const walletPartial = walletBalance > 0 && walletBalance < totalPrice;
  const walletEmpty = walletBalance <= 0;
  const remainingAfterWallet = Math.max(0, totalPrice - walletBalance);

  const paymentMethods = [
    { id: "card", name: { ar: "بطاقة ائتمانية", en: "Credit Card" }, icons: [Visa, Master], disabled: false },
    { id: "applepay", name: { ar: "آبل باي", en: "Apple Pay" }, icons: [ApplePay], disabled: false },
    { id: "mada", name: { ar: "مدى", en: "Mada" }, icons: [Mada], disabled: false },
    {
      id: "wallet",
      name: {
        ar: walletCoversAll ? `المحفظة (${walletBalance} ر.س)` : walletPartial ? `المحفظة (${walletBalance} ر.س) + بطاقة` : `المحفظة (0 ر.س)`,
        en: walletCoversAll ? `Wallet (${walletBalance} SAR)` : walletPartial ? `Wallet (${walletBalance} SAR) + Card` : `Wallet (0 SAR)`,
      },
      icons: [Wallet],
      disabled: walletEmpty,
    },
  ];

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
  };

  const handleConfirmPayment = () => {
    if (!selectedMethod) return;
    submitPayment(selectedMethod === "wallet");
  };

  const submitPayment = async (useWalletPayment = false) => {
    if (!offerSlug || !offer) return;
    setErrorMsg(null);
    // فقط نمنع لو العرض حصري للمشتركين وما فيه سعر لغير المشتركين
    const requiresSub = offer.requiresSubscription && (offer.nonSubscriberPrice == null || offer.nonSubscriberPrice <= 0);
    if (!isSubscribed && requiresSub) {
      setErrorMsg(isRTL ? "يجب أن يكون لديك اشتراك فعال للحصول على هذا العرض. يرجى الاشتراك أولاً." : "You need an active subscription for this offer. Please subscribe first.");
      return;
    }

    // تحقق قبل الدفع — هل لسا يقدر يدفع؟
    if (orderIdFromState != null) {
      try {
        const { api } = await import("@network/apiClient");
        const validateRes = await api.post(`/api/orders/${orderIdFromState}/validate-payment`);
        const vData = (validateRes.data as Record<string, unknown>);
        if (vData.status === false) {
          setErrorMsg(String(vData.msg || (isRTL ? "لا يمكن إتمام الدفع" : "Cannot complete payment")));
          return;
        }
      } catch (err) {
        const errData = (err as { response?: { data?: { msg?: string; status?: boolean } } })?.response?.data;
        if (errData?.status === false) {
          setErrorMsg(String(errData.msg || (isRTL ? "لا يمكن إتمام الدفع" : "Cannot complete payment")));
          return;
        }
      }
    }

    // لو اختار المحفظة — دائماً ننشئ طلب جديد مع use_wallet
    // لو فيه طلب مسبق (من شراء سريع) ومش محفظة — نستخدمه
    if (!useWalletPayment && orderIdFromState != null) {
      const paymentUrlFromState = (orderFromState?.payment_url ?? orderFromState?.redirect_url) as string | undefined;
      if (paymentUrlFromState && typeof paymentUrlFromState === "string") {
        window.location.href = paymentUrlFromState;
        return;
      }
      const paymentInfoFromState = orderFromState?.payment_info as Record<string, unknown> | undefined;
      if (paymentInfoFromState && typeof paymentInfoFromState === "object") {
        const amountHalala = Math.max(100, Math.floor((totalPrice || 0) * 100));
        const publishableKey = (paymentInfoFromState.publishable_key as string | undefined) || "";
        const callbackUrl = `${window.location.origin}/orders/callback?` +
          new URLSearchParams({
            order_id: String(orderIdFromState),
            type: "offer",
            ...(category ? { category } : {}),
            ...(merchantSlug ? { restaurant_id: String(merchantSlug) } : {}),
          }).toString();
        if (publishableKey && amountHalala >= 100) {
          moyasarConfigRef.current = {
            amountHalala,
            currency: (paymentInfoFromState.currency as string) || "SAR",
            description: (paymentInfoFromState.description as string) || (isRTL ? "إتمام الدفع للطلب" : "Complete order payment"),
            publishableKey,
            callbackUrl,
            metadata: (paymentInfoFromState.metadata as Record<string, unknown>) || {},
          };
          moyasarInitedRef.current = false;
          setShowMoyasarForm(true);
          return;
        }
      }
      setErrorMsg(
        isRTL
          ? "لا تتوفر بيانات الدفع لهذا الطلب. ارجع لصفحة العرض واضغط على شراء مرة أخرى."
          : "Payment info is not available for this order. Go back and click Buy again."
      );
      return;
    }

    // إلغاء الطلب القديم (pending) لو موجود قبل إنشاء جديد
    if (orderIdFromState != null) {
      try {
        const { api } = await import("@network/apiClient");
        await api.post(`/api/orders/${orderIdFromState}/cancel`);
      } catch { /* ignore cancel errors */ }
    }

    // إنشاء طلب جديد (محفظة أو بطاقة)
    createOrder.mutate(
      {
        order_type: "offer",
        item_id: offerSlug,
        quantity,
        branch_id: undefined,
        use_wallet: useWalletPayment,
      },
      {
        onSuccess: (res: unknown) => {
          const response = res as { data?: unknown };
          const data = response?.data ?? res;
          const root = (data as Record<string, unknown>) ?? {};
          if (root.status === false) {
            const msg = (root.msg as string) || (root.message as string) || (isRTL ? "فشل إنشاء الطلب" : "Failed to create order");
            const errNum = root.errNum as string | undefined;
            if (errNum === "E005") {
              queryClient.invalidateQueries({ queryKey: mokafaatKeys.subscriptionStatus });
            }
            setErrorMsg(msg);
            return;
          }
          const inner = (root.data ?? root) as Record<string, unknown>;
          const order = (inner?.order ?? root.order) as Record<string, unknown> | undefined;
          const paymentUrl = (root.payment_url ?? inner?.payment_url ?? root.redirect_url ?? inner?.redirect_url) as string | undefined;
          if (paymentUrl && typeof paymentUrl === "string") {
            window.location.href = paymentUrl;
            return;
          }
          const paymentInfo = (order?.payment_info ?? inner?.payment_info) as Record<string, unknown> | undefined;
          if (paymentInfo && typeof paymentInfo === "object") {
            const amountHalala = Math.max(100, Math.floor((totalPrice || 0) * 100));
            const publishableKey = (paymentInfo.publishable_key as string | undefined) || "";
            const callbackUrl = `${window.location.origin}/orders/callback?` +
              new URLSearchParams({
                type: "offer",
                ...(category ? { category } : {}),
                ...(merchantSlug ? { restaurant_id: String(merchantSlug) } : {}),
              }).toString();
            if (publishableKey && amountHalala >= 100) {
              moyasarConfigRef.current = {
                amountHalala,
                currency: (paymentInfo.currency as string) || "SAR",
                description: (paymentInfo.description as string) || (isRTL ? "إتمام الدفع للطلب" : "Complete order payment"),
                publishableKey,
                callbackUrl,
                metadata: (paymentInfo.metadata as Record<string, unknown>) || {},
              };
              moyasarInitedRef.current = false;
              setShowMoyasarForm(true);
              return;
            }
          }
          const orderId = (root.order_id ?? inner?.order_id ?? order?.id) as string | number | undefined;
          const requiresPayment = order?.requires_payment === true;

          // دفع كامل من المحفظة — الأوردر active مباشرة
          if (!requiresPayment && orderId != null) {
            window.location.href = `/orders/${orderId}`;
            return;
          }

          if (orderId != null) {
            window.location.href = `/orders/${orderId}`;
            return;
          }
          setErrorMsg(isRTL ? "لم يتم إرجاع رابط الدفع. جرّب مرة أخرى." : "Payment link was not returned. Please try again.");
        },
        onError: (err) => {
          if (err instanceof AxiosError && err.response?.status === 401) {
            setErrorMsg(isRTL ? "يجب تسجيل الدخول" : "Login required");
            return;
          }
          const data = (err as AxiosError<{ msg?: string; message?: string; errNum?: string }>)?.response?.data;
          if (data?.errNum === "E005" && (data?.msg || data?.message)) {
            queryClient.invalidateQueries({ queryKey: mokafaatKeys.subscriptionStatus });
            setErrorMsg(String(data.msg || data.message));
            return;
          }
          setErrorMsg(isRTL ? "فشل إنشاء الطلب" : "Failed to create order");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Restaurant Header */}
      <section className="relative w-full bg-[#1D0843] overflow-hidden min-h-[200px] flex items-center justify-center">
        <div className="absolute inset-0 bg-primary opacity-30" />
        <div className="relative pt-24 pb-10 px-6 mx-auto max-w-screen-xl text-center lg:pt-24 lg:pb-10 lg:px-12 flex flex-col justify-center z-10">
          {/* Back Button */}
          <button
            onClick={() => navigate(`/offers/${category}/${merchantSlug}`)}
            className="absolute top-4 left-4 text-white hover:text-purple-300 transition-colors flex items-center gap-2"
          >
            <FiArrowLeft className="text-xl" />
            <span className="text-sm">{isRTL ? "العودة" : "Back"}</span>
          </button>

          {/* Restaurant Logo */}
          <div className="w-14 h-14 mx-auto mb-4 rounded-full overflow-hidden">
            <img
              src={getCompanyImage(company.logo)}
              alt={company.name[isRTL ? "ar" : "en"]}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-2xl font-bold mb-2 tracking-tight leading-none text-white">
            {isRTL ? "إتمام الدفع" : "Complete Payment"}
          </h1>

          {/* Description */}
          <p className="text-white/80 text-base mb-4">
            {stripHtml(
              isRTL
                ? "إتمام عملية الدفع للعرض المحدد"
                : "Complete payment for the selected offer"
            )}
          </p>

          {/* Breadcrumb */}
          <div className="flex items-center justify-center text-sm md:text-base">
            <Link
              to="/"
              className="text-white hover:text-purple-300 transition-colors cursor-pointer text-xs"
            >
              {isRTL ? "الرئيسية" : "Home"}
            </Link>
            <span className="text-white text-xs mx-2">|</span>
            <Link
              to="/offers"
              className="text-white hover:text-purple-300 transition-colors cursor-pointer text-xs"
            >
              {isRTL ? "العروض" : "Offers"}
            </Link>
            <span className="text-white text-xs mx-2">|</span>
            <Link
              to={`/offers/${category}`}
              className="text-white hover:text-purple-300 transition-colors cursor-pointer text-xs"
            >
              {offer?.categoryName || (isRTL ? categoryInfo?.ar : categoryInfo?.en) || category}
            </Link>
            <span className="text-white text-xs mx-2">|</span>
            <Link
              to={`/offers/${category}/${merchantSlug}`}
              className="text-white hover:text-purple-300 transition-colors cursor-pointer text-xs"
            >
              {isRTL ? company.name.ar : company.name.en}
            </Link>
            <span className="text-white text-xs mx-2">|</span>
            <span className="text-[#fd671a] font-medium text-xs">
              {isRTL ? "الدفع" : "Payment"}
            </span>
          </div>
        </div>

        {/* Pattern Background */}
        <div className="absolute -bottom-10 transform z-9">
          <img
            src={AboutPattern}
            alt="Pattern"
            className="w-full h-96 animate-float"
          />
        </div>
      </section>

      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {isRTL ? "ملخص الطلب" : "Order Summary"}
              </h2>

              {/* Company Logo */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg overflow-hidden">
                  <img
                    src={getOfferImage(company.logo)}
                    alt={company.name[isRTL ? "ar" : "en"]}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">
                    {company.name[isRTL ? "ar" : "en"]}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {company.category[isRTL ? "ar" : "en"]}
                  </p>
                </div>
              </div>

              {/* Offer Details */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden">
                  <img
                    src={getOfferImage(offer.image)}
                    alt={offer.title[isRTL ? "ar" : "en"]}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800 text-sm">
                    {offer.title[isRTL ? "ar" : "en"]}
                  </h3>
                  <p className="text-gray-600 text-xs">
                    {isRTL ? `الكمية: ${quantity}` : `Quantity: ${quantity}`}
                  </p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {isRTL ? "السعر الأصلي" : "Original Price"}
                  </span>
                  <span className="flex items-center gap-1">
                    {offer.originalPrice}
                    <CurrencyIcon size={12} />
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {isRTL ? "الخصم" : "Discount"}
                  </span>
                  <span className="text-green-600">
                    -{offer.discountPercentage}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {isRTL ? "السعر بعد الخصم" : "Discounted Price"}
                  </span>
                  <span className="flex items-center gap-1">
                    {offer.discountPrice}
                    <CurrencyIcon size={12} />
                  </span>
                </div>
                {offer.platformPrice != null && offer.platformPrice !== offer.discountPrice && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {isRTL ? "المبلغ على المنصة" : "Platform price"}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      {unitPrice}
                      <CurrencyIcon size={12} />
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-800">
                    {isRTL ? "المجموع" : "Total"}
                  </span>
                  <span className="text-xl font-bold text-[#400198] flex items-center gap-1">
                    {totalPrice > 0 ? (
                      <>
                        {totalPrice}
                        <CurrencyIcon size={16} />
                      </>
                    ) : (
                      <span className="text-green-600">
                        {isRTL ? "مجاني" : "Free"}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-6">
              {showMoyasarForm ? (
                <>
                  <h2 className="text-lg font-semibold text-gray-800 mb-6">
                    {isRTL ? "إتمام الدفع عبر ميسر" : "Complete payment via Moyasar"}
                  </h2>
                  {errorMsg && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {errorMsg}
                    </div>
                  )}
                  <p className="text-gray-600 mb-4">
                    {isRTL ? "أدخل بيانات البطاقة أدناه:" : "Enter your card details below:"}
                  </p>
                  <div className="mysr-form-offer min-h-[200px]" />
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoyasarForm(false);
                      moyasarInitedRef.current = false;
                      moyasarConfigRef.current = null;
                      setErrorMsg(null);
                    }}
                    className="mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    {isRTL ? "العودة لاختيار طريقة الدفع" : "Back to payment methods"}
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-gray-800 mb-6">
                    {isRTL ? "اختر طريقة الدفع" : "Choose Payment Method"}
                  </h2>

                  {errorMsg && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {errorMsg}
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/subscription/plans?from=${encodeURIComponent(location.pathname + location.search)}`, {
                            state: {
                              from: `${location.pathname}${location.search}`,
                            },
                          })
                        }
                        className="mt-3 text-[#400198] font-medium underline hover:no-underline block"
                      >
                        {isRTL ? "الذهاب لصفحة الاشتراك" : "Go to subscription page"}
                      </button>
                    </div>
                  )}

                  <div className="space-y-3 mb-6">
                    {paymentMethods.map((method) => (
                      <label
                        key={method.id}
                        className={`flex items-center justify-between p-4 border-2 rounded-xl transition-all cursor-pointer ${
                          method.disabled ? "opacity-40 cursor-not-allowed bg-gray-50" :
                          selectedMethod === method.id ? "border-[#400198] bg-purple-50 shadow-sm" :
                          createOrder.isPending ? "opacity-60 pointer-events-none border-gray-200" :
                          "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method.id}
                            checked={selectedMethod === method.id}
                            onChange={() => !method.disabled && handlePaymentMethodSelect(method.id)}
                            disabled={createOrder.isPending || method.disabled}
                            className="w-5 h-5 text-purple-600 border-gray-300 focus:ring-purple-500"
                          />
                          <div>
                            <span className="font-medium text-gray-800 block">
                              {method.name[isRTL ? "ar" : "en"]}
                            </span>
                            {method.id === "wallet" && walletPartial && (
                              <span className="text-xs text-gray-500">
                                {isRTL
                                  ? `سيتم خصم ${walletBalance} ر.س من المحفظة + ${remainingAfterWallet.toFixed(2)} ر.س بالبطاقة`
                                  : `${walletBalance} SAR from wallet + ${remainingAfterWallet.toFixed(2)} SAR by card`}
                              </span>
                            )}
                            {method.id === "wallet" && walletCoversAll && (
                              <span className="text-xs text-green-600">
                                {isRTL ? "الرصيد كافي لدفع المبلغ كاملاً" : "Balance covers full amount"}
                              </span>
                            )}
                            {method.id === "wallet" && walletEmpty && (
                              <span className="text-xs text-red-500">
                                {isRTL ? "لا يوجد رصيد في المحفظة" : "No wallet balance"}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {method.icons.map((icon, i) => (
                            <img key={i} src={icon} alt="" className="h-8 w-auto object-contain" />
                          ))}
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* زر تأكيد الدفع */}
                  {selectedMethod && !createOrder.isPending && (
                    <button
                      type="button"
                      onClick={handleConfirmPayment}
                      className="w-full py-3.5 bg-[#400198] text-white rounded-xl font-medium hover:bg-[#33007a] transition-colors mb-4"
                    >
                      {selectedMethod === "wallet" && walletCoversAll
                        ? (isRTL ? `ادفع ${totalPrice} ر.س من المحفظة` : `Pay ${totalPrice} SAR from wallet`)
                        : selectedMethod === "wallet" && walletPartial
                          ? (isRTL ? `ادفع ${walletBalance} من المحفظة + ${remainingAfterWallet.toFixed(2)} بالبطاقة` : `Pay ${walletBalance} wallet + ${remainingAfterWallet.toFixed(2)} card`)
                          : (isRTL ? `ادفع ${totalPrice} ر.س` : `Pay ${totalPrice} SAR`)}
                    </button>
                  )}

                  {createOrder.isPending && (
                    <div className="flex items-center justify-center gap-2 text-gray-600 py-4">
                      <LoadingSpinner />
                      <span>{isRTL ? "جاري معالجة الدفع..." : "Processing payment..."}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <GetStartedSection className="mt-16 mb-28" />
    </div>
  );
};

export default PaymentPage;
