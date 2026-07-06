"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  useParams,
  useSearchParams,
  useNavigate,
  useLocation,
  Link,
} from "@/lib/router-compat";
import { Helmet } from "@/lib/helmet-compat";
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
  Cards1,
  Cards2,
  Cards3,
  Cards4,
  Cards5,
  Cards6,
  Cards7,
  Cards8,
} from "@assets";
import GetStartedSection from "@views/home/components/GetStartedSection";
import { useUserStore } from "@stores/userStore";
import {
  useCreateOrder,
  useSubscriptionStatus,
  useCardDetail,
  useWallet,
} from "@hooks/api/useMokafaatQueries";
import { LoadingSpinner } from "@components/LoadingSpinner";
import DiscountCodeInput from "@components/DiscountCodeInput";
import type { DiscountCodeResult } from "@network/services/mokafaatService";
import { AxiosError } from "axios";
import { isUserSubscribed } from "@utils/subscription";
import { useQueryClient } from "@tanstack/react-query";
import { mokafaatKeys } from "@hooks/api/useMokafaatQueries";
import { initMoyasarPayment } from "@utils/moyasar";
import { startArbPayment } from "@utils/arbPayment";
import type { CardCompany, CardOffer } from "@data/cards";

function getCardImage(logoName: string) {
  if (logoName.startsWith("http")) return logoName;
  switch (logoName) {
    case "Cards1": return Cards1;
    case "Cards2": return Cards2;
    case "Cards3": return Cards3;
    case "Cards4": return Cards4;
    case "Cards5": return Cards5;
    case "Cards6": return Cards6;
    case "Cards7": return Cards7;
    case "Cards8": return Cards8;
    default: return Cards1;
  }
}

const PaymentPage = () => {
  const { merchantSlug: companyId } = useParams<{ merchantSlug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isRTL = useIsRTL();
  const token = useUserStore((s) => s.token);
  const createOrder = useCreateOrder();
  const queryClient = useQueryClient();
  const { data: subscriptionStatusData } = useSubscriptionStatus(!!token);
  const isSubscribed = isUserSubscribed(subscriptionStatusData);

  const offerId = searchParams.get("offer");
  const quantity = parseInt(searchParams.get("quantity") || "1", 10);
  const { data: cardDetailResponse, isLoading: isCardDetailLoading } = useCardDetail(
    offerId ?? undefined
  );

  const { data: walletData } = useWallet();
  const walletBalance = (() => {
    const root = (walletData as Record<string, unknown>)?.data ?? walletData;
    const w = (root as Record<string, unknown>)?.wallet as Record<string, unknown> | undefined;
    return Number(w?.wallet_balance ?? 0);
  })();

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
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
  } | null>(null);

  const state = location.state as {
    orderId?: string | number;
    order?: Record<string, unknown>;
    company?: unknown;
    offer?: unknown;
  } | null | undefined;
  const orderIdFromState = state?.orderId;
  const orderFromState = state?.order;

  // Auto-create pending order on mount (for abandoned-cart tracking)
  const preOrderCreatedRef = useRef(false);
  useEffect(() => {
    if (!token || !offerId || preOrderCreatedRef.current || orderIdFromState) return;
    preOrderCreatedRef.current = true;
    createOrder.mutate(
      {
        order_type: "card",
        item_id: offerId,
        quantity,
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
  }, [token, offerId, quantity, orderIdFromState]);

  const companyAndOffer = useMemo((): { company: CardCompany; offer: CardOffer } | null => {
    if (!cardDetailResponse || !offerId) return null;
    const data = (cardDetailResponse as Record<string, unknown>)?.data ?? cardDetailResponse;
    const c = (data as Record<string, unknown>)?.card as Record<string, unknown> | undefined;
    if (!c) return null;
    const merchant = (c.merchant as Record<string, unknown>) ?? {};
    const category = (c.category as Record<string, unknown>) ?? {};
    const offer: CardOffer = {
      id: String(c.id),
      title: { ar: String(c.name ?? ""), en: String(c.name ?? "") },
      description: { ar: String(c.description ?? ""), en: String(c.description ?? "") },
      price: Number(c.final_price ?? c.price ?? 0),
      originalPrice: c.old_price != null ? Number(c.old_price) : undefined,
      currency: "SAR",
      validity: { ar: String(c.validity_type ?? ""), en: String(c.validity_type ?? "") },
      features: [],
      image: String(c.image ?? ""),
      rating: 0,
      purchases: Number(c.purchase_count ?? 0),
      views: Number(c.views_count ?? 0),
      downloads: 0,
      bookmarks: 0,
    };
    const company: CardCompany = {
      id: String(merchant.id ?? c.id),
      name: { ar: String(merchant.name ?? ""), en: String(merchant.name ?? "") },
      logo: String(merchant.logo ?? c.image ?? ""),
      category: {
        key: String(category.id ?? "other"),
        ar: String(category.name ?? ""),
        en: String(category.name ?? ""),
      },
      description: { ar: String(c.description ?? ""), en: String(c.description ?? "") },
      color: "#400198",
      offers: [offer],
    };
    return { company, offer };
  }, [cardDetailResponse, offerId]);

  const company = (state?.company ?? companyAndOffer?.company) as CardCompany | null;
  const offer = (state?.offer ?? companyAndOffer?.offer) as CardOffer | null;

  const unitPrice = offer?.price ?? 0;
  const totalPrice = offer ? unitPrice * quantity : 0;
  // السعر الفعلي الذي يدفعه المستخدم (بعد الخصم لو في كود مطبّق)
  const effectivePrice = discount ? Number(discount.final_amount) : totalPrice;

  useEffect(() => {
    if (!company || !offer) return;
    if (!companyId || !offerId) {
      navigate("/cards");
    }
  }, [company, offer, companyId, offerId, navigate]);

  useEffect(() => {
    if (!token && company && offer) {
      navigate(
        `/login?returnUrl=${encodeURIComponent(location.pathname + location.search)}`
      );
    }
  }, [token, company, offer, navigate, location.pathname, location.search]);

  useEffect(() => {
    if (!showMoyasarForm || moyasarInitedRef.current || !moyasarConfigRef.current) return;
    const config = moyasarConfigRef.current;
    moyasarInitedRef.current = true;
    initMoyasarPayment({
      ...config,
      elementSelector: ".mysr-form-card",
      methods: ["creditcard"],
    }).catch(() => {
      setErrorMsg(
        isRTL
          ? "تعذر تحميل بوابة الدفع. حدّث الصفحة أو تواصل مع الدعم."
          : "Failed to load payment gateway. Refresh or contact support."
      );
      setShowMoyasarForm(false);
      moyasarInitedRef.current = false;
    });
  }, [showMoyasarForm, isRTL]);

  if (isCardDetailLoading && !companyAndOffer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!company || !offer || !companyId || !offerId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {isRTL ? "البطاقة غير موجودة" : "Card not found"}
          </h1>
          <button
            onClick={() => navigate("/cards")}
            className="px-6 py-3 bg-[#400198] text-white rounded-lg hover:bg-[#54015d] transition-colors"
          >
            {isRTL ? "العودة للبطاقات" : "Back to Cards"}
          </button>
        </div>
      </div>
    );
  }

  const walletCoversAll = walletBalance >= effectivePrice && effectivePrice > 0;
  const walletPartial = walletBalance > 0 && walletBalance < effectivePrice;
  const walletEmpty = walletBalance <= 0;
  const remainingAfterWallet = Math.max(0, effectivePrice - walletBalance);

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

  // رابط عودة الراجحي بعد الدفع → صفحة الكول باك في الفرونت
  const buildCardReturnUrl = (orderId: string | number) =>
    `${window.location.origin}/orders/callback?` +
    new URLSearchParams({
      gateway: "arb",
      type: "card",
      order_id: String(orderId),
      ...(companyId ? { company_id: String(companyId) } : {}),
    }).toString();

  const submitPayment = async (useWalletPayment = false) => {
    if (!offerId || !offer) return;
    setErrorMsg(null);
    if (!isSubscribed) {
      setErrorMsg(
        isRTL
          ? "يجب أن يكون لديك اشتراك فعال لشراء هذه البطاقة. يرجى الاشتراك أولاً."
          : "You need an active subscription to purchase this card. Please subscribe first."
      );
      return;
    }

    // تحقق قبل الدفع
    if (orderIdFromState != null) {
      try {
        const { api } = await import("@network/apiClient");
        const vRes = await api.post(`/api/orders/${orderIdFromState}/validate-payment`);
        const vData = vRes.data as Record<string, unknown>;
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

    // 💳 محفظة + طلب pending موجود → ادفع على نفس الطلب
    // لكن لو في كود خصم متطبّق، نعدّي على createOrder عشان الـ backend يحدّث الطلب
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

    // 💳 بوابة الراجحي + طلب pending موجود → ابدأ الدفع على نفس الطلب
    if (!useWalletPayment && orderIdFromState != null && !discount) {
      const r = await startArbPayment({
        orderId: orderIdFromState,
        returnUrl: buildCardReturnUrl(orderIdFromState),
      });
      if (!r.ok) {
        setErrorMsg(r.error || (isRTL ? "تعذّر بدء عملية الدفع" : "Failed to start payment"));
      }
      return;
    }

    createOrder.mutate(
      {
        order_type: "card",
        item_id: offerId,
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
            const msg =
              (root.msg as string) ||
              (root.message as string) ||
              (isRTL ? "فشل إنشاء الطلب" : "Failed to create order");
            const errNum = root.errNum as string | undefined;
            if (errNum === "E005") {
              queryClient.invalidateQueries({ queryKey: mokafaatKeys.subscriptionStatus });
            }
            setErrorMsg(msg);
            return;
          }
          const inner = (root.data ?? root) as Record<string, unknown>;
          const order = (inner?.order ?? root.order) as Record<string, unknown> | undefined;
          const orderId = (root.order_id ?? inner?.order_id ?? order?.id) as
            | string
            | number
            | undefined;
          const requiresPayment = order?.requires_payment === true;

          // دفع كامل من المحفظة أو مجاني — الأوردر active مباشرة
          if (!requiresPayment && orderId != null) {
            window.location.href = `/orders/${orderId}`;
            return;
          }

          // 💳 يتطلب دفع → ابدأ الدفع عبر بوابة الراجحي
          if (requiresPayment && orderId != null) {
            startArbPayment({
              orderId,
              returnUrl: buildCardReturnUrl(orderId),
            }).then((r) => {
              if (!r.ok) setErrorMsg(r.error || (isRTL ? "تعذّر بدء عملية الدفع" : "Failed to start payment"));
            });
            return;
          }

          if (orderId != null) {
            window.location.href = `/orders/${orderId}`;
            return;
          }
          setErrorMsg(
            isRTL ? "لم يتم إرجاع رابط الدفع. جرّب مرة أخرى." : "Payment link was not returned. Please try again."
          );
        },
        onError: (err) => {
          if (err instanceof AxiosError && err.response?.status === 401) {
            setErrorMsg(isRTL ? "يجب تسجيل الدخول" : "Login required");
            return;
          }
          const data = (err as AxiosError<{ msg?: string; message?: string; errNum?: string }>)
            ?.response?.data;
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
    <>
      <Helmet>
        <title>
          {isRTL ? "إتمام الدفع" : "Complete Payment"} - {company.name[isRTL ? "ar" : "en"]}
        </title>
        <link rel="canonical" href={`https://mukafaat.com/cards/${companyId}/payment`} />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header - نفس صفحة العروض */}
        <section className="relative w-full bg-[#1D0843] overflow-hidden min-h-[200px] flex items-center justify-center">
          <div className="absolute inset-0 bg-primary opacity-30" />
          <div className="relative pt-24 pb-10 px-6 mx-auto max-w-screen-xl text-center lg:pt-24 lg:pb-10 lg:px-12 flex flex-col justify-center z-10">
            <button
              onClick={() => navigate(`/cards/${companyId}`)}
              className="absolute top-4 left-4 text-white hover:text-purple-300 transition-colors flex items-center gap-2"
            >
              <FiArrowLeft className="text-xl" />
              <span className="text-sm">{isRTL ? "العودة" : "Back"}</span>
            </button>

            <div className="w-14 h-14 mx-auto mb-4 rounded-full overflow-hidden">
              <img
                src={getCardImage(company.logo)}
                alt={company.name[isRTL ? "ar" : "en"]}
                className="w-full h-full object-cover"
              />
            </div>

            <h1 className="text-2xl md:text-2xl font-bold mb-2 tracking-tight leading-none text-white">
              {isRTL ? "إتمام الدفع" : "Complete Payment"}
            </h1>

            <p className="text-white/80 text-base mb-4">
              {isRTL ? "إتمام عملية الدفع للبطاقة المحددة" : "Complete payment for the selected card"}
            </p>

            <div className="flex items-center justify-center text-sm md:text-base">
              <Link to="/" className="text-white hover:text-purple-300 transition-colors cursor-pointer text-xs">
                {isRTL ? "الرئيسية" : "Home"}
              </Link>
              <span className="text-white text-xs mx-2">|</span>
              <Link to="/cards" className="text-white hover:text-purple-300 transition-colors cursor-pointer text-xs">
                {isRTL ? "البطاقات" : "Cards"}
              </Link>
              <span className="text-white text-xs mx-2">|</span>
              <Link
                to={`/cards/${companyId}`}
                className="text-white hover:text-purple-300 transition-colors cursor-pointer text-xs"
              >
                {company.name[isRTL ? "ar" : "en"]}
              </Link>
              <span className="text-white text-xs mx-2">|</span>
              <span className="text-[#fd671a] font-medium text-xs">
                {isRTL ? "الدفع" : "Payment"}
              </span>
            </div>
          </div>

          <div className="absolute -bottom-10 transform z-9">
            <img src={AboutPattern} alt="" className="w-full h-96 animate-float" />
          </div>
        </section>

        <div className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ملخص الطلب - نفس تخطيط العروض */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-6 sticky top-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  {isRTL ? "ملخص الطلب" : "Order Summary"}
                </h2>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg overflow-hidden">
                    <img
                      src={getCardImage(company.logo)}
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

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden">
                    <img
                      src={getCardImage(offer.image)}
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

                <div className="space-y-2 mb-4">
                  {offer.originalPrice != null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {isRTL ? "السعر الأصلي" : "Original Price"}
                      </span>
                      <span className="flex items-center gap-1">
                        {offer.originalPrice}
                        <CurrencyIcon size={12} />
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {isRTL ? "سعر البطاقة" : "Card Price"}
                    </span>
                    <span className="flex items-center gap-1">
                      {unitPrice}
                      <CurrencyIcon size={12} />
                    </span>
                  </div>
                </div>

                {/* Discount Code */}
                <div className="border-t pt-4 mb-4">
                  <DiscountCodeInput
                    scope="card"
                    amount={totalPrice}
                    itemId={offerId ?? undefined}
                    merchantId={(offer as unknown as { merchantId?: number | string })?.merchantId}
                    onChange={setDiscount}
                  />
                </div>

                <div className="border-t pt-4">
                  {discount ? (
                    <div className="space-y-1 mb-2">
                      <div className="flex justify-between text-sm text-gray-600">
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
                    <span className="font-semibold text-gray-800">
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

            {/* طرق الدفع / نموذج ميسر */}
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
                    <div className="mysr-form-card min-h-[200px]" />
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
                        {!isSubscribed && (
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/subscription/plans?from=${encodeURIComponent(location.pathname + location.search)}`, {
                                state: { from: `${location.pathname}${location.search}` },
                              })
                            }
                            className="mt-3 text-[#400198] font-medium underline hover:no-underline block"
                          >
                            {isRTL ? "الذهاب لصفحة الاشتراك" : "Go to subscription page"}
                          </button>
                        )}
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
                                  {isRTL ? `${walletBalance} ر.س محفظة + ${remainingAfterWallet.toFixed(2)} ر.س بطاقة` : `${walletBalance} SAR wallet + ${remainingAfterWallet.toFixed(2)} SAR card`}
                                </span>
                              )}
                              {method.id === "wallet" && walletCoversAll && (
                                <span className="text-xs text-green-600">{isRTL ? "الرصيد كافي" : "Balance covers full amount"}</span>
                              )}
                              {method.id === "wallet" && walletEmpty && (
                                <span className="text-xs text-red-500">{isRTL ? "لا يوجد رصيد" : "No balance"}</span>
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
                    {selectedMethod && !createOrder.isPending && (
                      <button type="button" onClick={handleConfirmPayment}
                        className="w-full py-3.5 bg-[#400198] text-white rounded-xl font-medium hover:bg-[#33007a] transition-colors mb-4">
                        {selectedMethod === "wallet" && walletCoversAll
                          ? (isRTL ? `ادفع ${effectivePrice} ر.س من المحفظة` : `Pay ${effectivePrice} SAR from wallet`)
                          : selectedMethod === "wallet" && walletPartial
                            ? (isRTL ? `${walletBalance} محفظة + ${remainingAfterWallet.toFixed(2)} بطاقة` : `${walletBalance} wallet + ${remainingAfterWallet.toFixed(2)} card`)
                            : (isRTL ? `ادفع ${effectivePrice} ر.س` : `Pay ${effectivePrice} SAR`)}
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
    </>
  );
};

export default PaymentPage;
