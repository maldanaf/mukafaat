"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  useParams,
  useSearchParams,
  useNavigate,
  useLocation,
  Link,
} from "@/lib/router-compat";
import { useIsRTL, useTamara } from "@hooks";
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
import DiscountCodeInput from "@components/DiscountCodeInput";
import type { DiscountCodeResult } from "@network/services/mokafaatService";
import { AxiosError } from "axios";
import { isUserSubscribed } from "@utils/subscription";
import { useQueryClient } from "@tanstack/react-query";
import { mokafaatKeys } from "@hooks/api/useMokafaatQueries";
import { initMoyasarPayment, isApplePayAvailable } from "@utils/moyasar";
import { startArbPayment } from "@utils/arbPayment";
import { startTamaraPayment } from "@utils/tamaraPayment";
import { getPaymentGateway, gatewayFromPaymentInfo } from "@utils/paymentGateway";

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
  // آبل باي متاح في Safari/أجهزة آبل فقط — نفحصه بعد التركيب تفادياً
  // لاختلاف تصيير الخادم عن العميل.
  const [applePayReady, setApplePayReady] = useState(false);
  useEffect(() => setApplePayReady(isApplePayAvailable()), []);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showMoyasarForm, setShowMoyasarForm] = useState(false);
  const [discount, setDiscount] = useState<DiscountCodeResult | null>(null);
  const moyasarInitedRef = useRef(false);
  const moyasarConfigRef = useRef<{
    amountHalala: number;
    currency: string;
    description: string;
    publishableKey: string;
    callbackUrl: string;
    metadata: Record<string, unknown>;
    methods?: string[];
    supportedNetworks?: string[];
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
  // السعر الفعلي الذي يدفعه المستخدم (بعد الخصم لو في كود مطبّق)
  const effectivePrice = discount ? Number(discount.final_amount) : totalPrice;

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
      applePay: { country: "SA", label: config.description },
    }).catch(() => {
      setErrorMsg(isRTL ? "تعذر تحميل بوابة الدفع. حدّث الصفحة أو تواصل مع الدعم." : "Failed to load payment gateway. Refresh or contact support.");
      setShowMoyasarForm(false);
      moyasarInitedRef.current = false;
    });
  }, [showMoyasarForm, isRTL]);

  // تمارا تدفع المبلغ كاملاً — لا تُدمج مع رصيد المحفظة.
  //
  // يجب أن يبقى فوق الـ return المبكر وإلا اختلف عدد الخطافات بين
  // تصييرين فيسقط المكوّن بـ «Rendered more hooks than during the
  // previous render» — نفس ما كان يحدث في صفحة دفع البطاقات.
  const { available: tamaraAvailable, instalments: tamaraInstalments } =
    useTamara(effectivePrice);

  if (!company || !offer) {
    return (
      <div className="min-h-screen bg-mk-tint3 flex items-center justify-center">
        {initialLoad ? (
          <LoadingSpinner />
        ) : (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-mk-text mb-4">
              {isRTL ? "العرض غير موجود" : "Offer not found"}
            </h1>
            <button
              onClick={() => navigate("/offers")}
              className="px-6 py-3 bg-[#400198] text-white rounded-mk-sm hover:bg-[#54015d] transition-colors"
            >
              {isRTL ? "العودة للعروض" : "Back to Offers"}
            </button>
          </div>
        )}
      </div>
    );
  }

  const walletCoversAll = walletBalance >= effectivePrice && effectivePrice > 0;
  const walletPartial = walletBalance > 0 && walletBalance < effectivePrice;
  const walletEmpty = walletBalance <= 0;

  const remainingAfterWallet = Math.max(0, effectivePrice - walletBalance);

  const paymentMethods = [
    { id: "card", name: { ar: "بطاقة ائتمانية", en: "Credit Card" }, icons: [Visa, Master], disabled: false },
    ...(applePayReady
      ? [{ id: "applepay", name: { ar: "آبل باي", en: "Apple Pay" }, icons: [ApplePay], disabled: false }]
      : []),
    { id: "mada", name: { ar: "مدى", en: "Mada" }, icons: [Mada], disabled: false },
    // تمارا: خيار إضافي يظهر عند تفعيله من اللوحة وكون المبلغ داخل حدود الحساب
    ...(tamaraAvailable
      ? [{
          id: "tamara",
          name: {
            ar: `تمارا — قسّمها على ${tamaraInstalments} دفعات`,
            en: `tamara — Split in ${tamaraInstalments}`,
          },
          icons: [] as string[],
          disabled: false,
        }]
      : []),
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

  // رابط كول باك ميسر → صفحة الكول باك في الفرونت (ميسر يضيف id و status)
  const buildMoyasarCallbackUrl = (orderId?: string | number) =>
    `${window.location.origin}/orders/callback?` +
    new URLSearchParams({
      type: "offer",
      ...(orderId != null ? { order_id: String(orderId) } : {}),
      ...(category ? { category } : {}),
      ...(merchantSlug ? { restaurant_id: String(merchantSlug) } : {}),
    }).toString();

  // رابط العودة لبوابات إعادة التوجيه (الراجحي / تمارا) → صفحة الكول باك في الفرونت
  const buildOfferReturnUrl = (
    orderId: string | number,
    gateway: "arb" | "tamara" = "arb",
  ) =>
    `${window.location.origin}/orders/callback?` +
    new URLSearchParams({
      gateway,
      type: "offer",
      order_id: String(orderId),
      ...(category ? { category } : {}),
      ...(merchantSlug ? { restaurant_id: String(merchantSlug) } : {}),
    }).toString();

  /** بدء الدفع عبر تمارا لطلب قائم */
  const startTamaraForOrder = (orderId: string | number) =>
    startTamaraPayment({
      orderId,
      returnUrl: buildOfferReturnUrl(orderId, "tamara"),
    }).then((r) => {
      if (!r.ok) setErrorMsg(r.error || (isRTL ? "تعذّر بدء الدفع عبر تمارا" : "Failed to start Tamara payment"));
    });

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

    // 💳 محفظة + طلب pending موجود → ادفع على نفس الطلب (لا تكنسل ولا تنشئ جديد)
    // لكن لو في كود خصم متطبّق، نعدّي على createOrder عشان الـ backend يحدّث الطلب بالخصم الجديد
    if (useWalletPayment && orderIdFromState != null && !discount) {
      try {
        const { api } = await import("@network/apiClient");
        const res = await api.post(`/api/orders/${orderIdFromState}/pay-wallet`);
        const d = (res.data as Record<string, unknown>) ?? {};
        if (d.status === false) {
          setErrorMsg(
            String(d.msg || (isRTL ? "فشل الدفع بالمحفظة" : "Wallet payment failed")),
          );
          return;
        }
        window.location.href = `/orders/${orderIdFromState}`;
        return;
      } catch (err) {
        const errData =
          (err as { response?: { data?: { msg?: string } } })?.response?.data;
        setErrorMsg(
          String(errData?.msg || (isRTL ? "فشل الدفع بالمحفظة" : "Wallet payment failed")),
        );
        return;
      }
    }

    // 💳 طلب pending موجود → ادفع عليه مباشرة بالبوابة الفعّالة
    // (لو في كود خصم متطبّق نعدّي على createOrder ليحدّث الطلب أولاً)
    if (!useWalletPayment && orderIdFromState != null && !discount) {
      // تمارا: اختيار صريح من المستخدم — يسبق البوابة الافتراضية
      if (selectedMethod === "tamara") {
        await startTamaraForOrder(orderIdFromState);
        return;
      }

      const paymentInfoFromState = orderFromState?.payment_info as
        | Record<string, unknown>
        | undefined;
      const gateway =
        gatewayFromPaymentInfo(paymentInfoFromState) ?? (await getPaymentGateway());

      if (gateway === "arb") {
        const r = await startArbPayment({
          orderId: orderIdFromState,
          returnUrl: buildOfferReturnUrl(orderIdFromState),
        });
        if (!r.ok) {
          setErrorMsg(r.error || (isRTL ? "تعذّر بدء عملية الدفع" : "Failed to start payment"));
        }
        return;
      }

      // ميسر: نموذج البطاقة داخل الصفحة
      const paymentUrlFromState = (orderFromState?.payment_url ??
        orderFromState?.redirect_url) as string | undefined;
      if (paymentUrlFromState && typeof paymentUrlFromState === "string") {
        window.location.href = paymentUrlFromState;
        return;
      }
      if (paymentInfoFromState && typeof paymentInfoFromState === "object") {
        const amountHalala = Math.max(100, Math.floor((effectivePrice || 0) * 100));
        const publishableKey = (paymentInfoFromState.publishable_key as string | undefined) || "";
        const callbackUrl = buildMoyasarCallbackUrl(orderIdFromState);
        if (publishableKey && amountHalala >= 100) {
          moyasarConfigRef.current = {
            amountHalala,
            currency: (paymentInfoFromState.currency as string) || "SAR",
            description:
              (paymentInfoFromState.description as string) ||
              (isRTL ? "إتمام الدفع للطلب" : "Complete order payment"),
            publishableKey,
            callbackUrl,
            metadata: (paymentInfoFromState.metadata as Record<string, unknown>) || {},
            methods: selectedMethod === "applepay" ? ["applepay"] : ["creditcard"],
            supportedNetworks:
              selectedMethod === "mada" ? ["mada"] : ["visa", "mastercard", "mada"],
          };
          moyasarInitedRef.current = false;
          setShowMoyasarForm(true);
          return;
        }
      }
      setErrorMsg(
        isRTL
          ? "لا تتوفر بيانات الدفع لهذا الطلب. ارجع لصفحة العرض واضغط على شراء مرة أخرى."
          : "Payment info is not available for this order. Go back and click Buy again.",
      );
      return;
    }

    // إنشاء طلب جديد (لما يكون مفش طلب pending سابق)
    createOrder.mutate(
      {
        order_type: "offer",
        item_id: offerSlug,
        quantity,
        branch_id: undefined,
        use_wallet: useWalletPayment,
        discount_code: discount?.code,
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
          const orderId = (root.order_id ?? inner?.order_id ?? order?.id) as string | number | undefined;
          const requiresPayment = order?.requires_payment === true;

          // دفع كامل من المحفظة — الأوردر active مباشرة
          if (!requiresPayment && orderId != null) {
            window.location.href = `/orders/${orderId}`;
            return;
          }

          // 💳 يتطلب دفع → ابدأ الدفع بالبوابة الفعّالة
          if (requiresPayment && orderId != null) {
            const paymentInfo = (order?.payment_info ?? inner?.payment_info) as
              | Record<string, unknown>
              | undefined;
            const gatewayFromOrder = gatewayFromPaymentInfo(paymentInfo);

            const startMoyasar = () => {
              // المبلغ من السيرفر بعد الخصم (fallback على الحساب المحلي)
              const serverHalala = Number(paymentInfo?.amount_halala);
              const serverAmount = Number(paymentInfo?.amount);
              const fallbackAmount = discount ? Number(discount.final_amount) : (totalPrice || 0);
              const amountHalala =
                Number.isFinite(serverHalala) && serverHalala > 0
                  ? Math.floor(serverHalala)
                  : Number.isFinite(serverAmount) && serverAmount > 0
                    ? Math.floor(serverAmount * 100)
                    : Math.max(100, Math.floor(fallbackAmount * 100));
              const publishableKey = (paymentInfo?.publishable_key as string | undefined) || "";
              if (!publishableKey || amountHalala < 100) {
                setErrorMsg(
                  isRTL
                    ? "بيانات الدفع غير مكتملة. تواصل مع الدعم."
                    : "Incomplete payment information. Please contact support.",
                );
                return;
              }
              moyasarConfigRef.current = {
                amountHalala,
                currency: (paymentInfo?.currency as string) || "SAR",
                description:
                  (paymentInfo?.description as string) ||
                  (isRTL ? "إتمام الدفع للطلب" : "Complete order payment"),
                publishableKey,
                callbackUrl: buildMoyasarCallbackUrl(orderId),
                metadata: (paymentInfo?.metadata as Record<string, unknown>) || {},
                methods: selectedMethod === "applepay" ? ["applepay"] : ["creditcard"],
                supportedNetworks:
                  selectedMethod === "mada" ? ["mada"] : ["visa", "mastercard", "mada"],
              };
              moyasarInitedRef.current = false;
              setShowMoyasarForm(true);
            };

            // تمارا: اختيار صريح من المستخدم — يسبق البوابة الافتراضية
            if (selectedMethod === "tamara") {
              void startTamaraForOrder(orderId);
              return;
            }

            if (gatewayFromOrder === "arb") {
              startArbPayment({
                orderId,
                returnUrl: buildOfferReturnUrl(orderId),
              }).then((r) => {
                if (!r.ok) setErrorMsg(r.error || (isRTL ? "تعذّر بدء عملية الدفع" : "Failed to start payment"));
              });
              return;
            }
            if (gatewayFromOrder === "moyasar") {
              startMoyasar();
              return;
            }
            // الباك-إند ما أرسل البوابة → اقرأ الإعداد العام
            getPaymentGateway().then((gateway) => {
              if (gateway === "arb") {
                startArbPayment({
                  orderId,
                  returnUrl: buildOfferReturnUrl(orderId),
                }).then((r) => {
                  if (!r.ok) setErrorMsg(r.error || (isRTL ? "تعذّر بدء عملية الدفع" : "Failed to start payment"));
                });
              } else {
                startMoyasar();
              }
            });
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
          // اعرض رسالة الخطأ الفعلية من السيرفر لو موجودة
          if (data?.msg || data?.message) {
            setErrorMsg(String(data.msg || data.message));
            return;
          }
          setErrorMsg(isRTL ? "فشل إنشاء الطلب" : "Failed to create order");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-mk-tint3">
      {/* Restaurant Header */}
      <section className="relative w-full bg-[linear-gradient(150deg,#1B1150_0%,#400198_55%,#6703EB_100%)] overflow-hidden min-h-[200px] flex items-center justify-center">
        <div className="absolute inset-0 bg-primary opacity-30" />
        <div className="relative w-full pt-10 pb-10 px-6 mx-auto max-w-site text-center lg:pt-12 lg:pb-10 lg:px-12 flex flex-col justify-center z-10">
          {/* Back Button */}
          <button
            onClick={() => navigate(`/offers/${category}/${merchantSlug}`)}
            className="mb-5 inline-flex w-fit items-center gap-2 self-start rounded-full border border-white/25 bg-white/10 px-4 py-2 text-white transition-colors hover:bg-white/20"
          >
            <FiArrowLeft className="text-lg rtl:rotate-180" />
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
              className="text-white hover:text-mk-lilac transition-colors cursor-pointer text-xs"
            >
              {isRTL ? "الرئيسية" : "Home"}
            </Link>
            <span className="text-white text-xs mx-2">|</span>
            <Link
              to="/offers"
              className="text-white hover:text-mk-lilac transition-colors cursor-pointer text-xs"
            >
              {isRTL ? "العروض" : "Offers"}
            </Link>
            <span className="text-white text-xs mx-2">|</span>
            <Link
              to={`/offers/${category}`}
              className="text-white hover:text-mk-lilac transition-colors cursor-pointer text-xs"
            >
              {offer?.categoryName || (isRTL ? categoryInfo?.ar : categoryInfo?.en) || category}
            </Link>
            <span className="text-white text-xs mx-2">|</span>
            <Link
              to={`/store/${merchantSlug}`}
              className="text-white hover:text-mk-lilac transition-colors cursor-pointer text-xs"
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
            <div className="bg-white rounded-mk-md p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-mk-text mb-4">
                {isRTL ? "ملخص الطلب" : "Order Summary"}
              </h2>

              {/* Company Logo */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-mk-sm overflow-hidden">
                  <img
                    src={getOfferImage(company.logo)}
                    alt={company.name[isRTL ? "ar" : "en"]}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-medium text-mk-text">
                    {company.name[isRTL ? "ar" : "en"]}
                  </h3>
                  <p className="text-sm text-mk-muted">
                    {company.category[isRTL ? "ar" : "en"]}
                  </p>
                </div>
              </div>

              {/* Offer Details */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-mk-sm overflow-hidden">
                  <img
                    src={getOfferImage(offer.image)}
                    alt={offer.title[isRTL ? "ar" : "en"]}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-mk-text text-sm">
                    {offer.title[isRTL ? "ar" : "en"]}
                  </h3>
                  <p className="text-mk-muted text-xs">
                    {isRTL ? `الكمية: ${quantity}` : `Quantity: ${quantity}`}
                  </p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-mk-muted">
                    {isRTL ? "السعر الأصلي" : "Original Price"}
                  </span>
                  <span className="flex items-center gap-1">
                    {offer.originalPrice}
                    <CurrencyIcon size={12} />
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-mk-muted">
                    {isRTL ? "الخصم" : "Discount"}
                  </span>
                  <span className="text-green-600">
                    -{offer.discountPercentage}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-mk-muted">
                    {isRTL ? "السعر بعد الخصم" : "Discounted Price"}
                  </span>
                  <span className="flex items-center gap-1">
                    {offer.discountPrice}
                    <CurrencyIcon size={12} />
                  </span>
                </div>
                {offer.platformPrice != null && offer.platformPrice !== offer.discountPrice && (
                  <div className="flex justify-between text-sm">
                    <span className="text-mk-muted">
                      {isRTL ? "المبلغ على المنصة" : "Platform price"}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      {unitPrice}
                      <CurrencyIcon size={12} />
                    </span>
                  </div>
                )}
              </div>

              {/* Discount Code */}
              <div className="border-t pt-4 mb-4">
                <DiscountCodeInput
                  scope="offer"
                  amount={totalPrice}
                  itemId={offerSlug ?? undefined}
                  merchantId={(offer as unknown as { merchantId?: number | string })?.merchantId}
                  onChange={setDiscount}
                />
              </div>

              <div className="border-t pt-4">
                {discount ? (
                  <div className="space-y-1 mb-2">
                    <div className="flex justify-between text-sm text-mk-muted">
                      <span>{isRTL ? "المجموع قبل الكود" : "Subtotal"}</span>
                      <span className="line-through">{totalPrice} {isRTL ? "ر.س" : "SAR"}</span>
                    </div>
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span>{isRTL ? "خصم الكود" : "Code discount"}</span>
                      <span>− {discount.discount_amount} {isRTL ? "ر.س" : "SAR"}</span>
                    </div>
                  </div>
                ) : null}
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-mk-text">
                    {isRTL ? "المجموع" : "Total"}
                  </span>
                  <span className="text-xl font-bold text-[#400198] flex items-center gap-1">
                    {(discount ? discount.final_amount : totalPrice) > 0 ? (
                      <>
                        {discount ? discount.final_amount : totalPrice}
                        <CurrencyIcon size={16} />
                      </>
                    ) : (
                      <span className="text-green-600">
                        {isRTL ? "بدون رسوم" : "No fees"}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-mk-md p-6">
              {showMoyasarForm ? (
                <>
                  <h2 className="text-lg font-semibold text-mk-text mb-6">
                    {isRTL ? "إتمام الدفع عبر ميسر" : "Complete payment via Moyasar"}
                  </h2>
                  {errorMsg && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-mk-sm text-red-700 text-sm">
                      {errorMsg}
                    </div>
                  )}
                  <p className="text-mk-muted mb-4">
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
                    className="mt-4 px-4 py-2 border border-mk-border-2 text-mk-text-strong rounded-mk-sm hover:bg-mk-tint3"
                  >
                    {isRTL ? "العودة لاختيار طريقة الدفع" : "Back to payment methods"}
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-mk-text mb-6">
                    {isRTL ? "اختر طريقة الدفع" : "Choose Payment Method"}
                  </h2>

                  {errorMsg && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-mk-sm text-red-700 text-sm">
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
                        className={`flex items-center justify-between p-4 border-2 rounded-mk-md transition-all cursor-pointer ${
                          method.disabled ? "opacity-40 cursor-not-allowed bg-mk-tint3" :
                          selectedMethod === method.id ? "border-[#400198] bg-mk-tint3 shadow-mk-card" :
                          createOrder.isPending ? "opacity-60 pointer-events-none border-mk-border" :
                          "border-mk-border hover:border-mk-lilac hover:bg-mk-tint3/50"
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
                            className="w-5 h-5 text-mk-primary border-mk-border-2 focus:ring-mk-primary-light"
                          />
                          <div>
                            <span className="font-medium text-mk-text block">
                              {method.name[isRTL ? "ar" : "en"]}
                            </span>
                            {method.id === "wallet" && walletPartial && (
                              <span className="text-xs text-mk-muted">
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
                      className="w-full py-3.5 bg-[#400198] text-white rounded-mk-md font-medium hover:bg-[#33007a] transition-colors mb-4"
                    >
                      {selectedMethod === "wallet" && walletCoversAll
                        ? (isRTL ? `ادفع ${effectivePrice} ر.س من المحفظة` : `Pay ${effectivePrice} SAR from wallet`)
                        : selectedMethod === "wallet" && walletPartial
                          ? (isRTL ? `ادفع ${walletBalance} من المحفظة + ${remainingAfterWallet.toFixed(2)} بالبطاقة` : `Pay ${walletBalance} wallet + ${remainingAfterWallet.toFixed(2)} card`)
                          : (isRTL ? `ادفع ${effectivePrice} ر.س` : `Pay ${effectivePrice} SAR`)}
                    </button>
                  )}

                  {createOrder.isPending && (
                    <div className="flex items-center justify-center gap-2 text-mk-muted py-4">
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
