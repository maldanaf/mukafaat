"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { Helmet } from "@/lib/helmet-compat";
import { useTranslation } from "react-i18next";
import { useIsRTL, useTamara } from "@hooks";
import PlanChangeModal, { type PlanChangePreview } from "@components/PlanChangeModal";
import { FiArrowLeft } from "react-icons/fi";
import { IoPeopleOutline } from "react-icons/io5";
import { AxiosError } from "axios";
import CurrencyIcon from "@components/CurrencyIcon";
import { LoadingSpinner } from "@components/LoadingSpinner";
import PromoCodeInput from "@components/payment/PromoCodeInput";
import PaymentMethodSelector, {
  type PaymentMethodType,
} from "@components/payment/PaymentMethodSelector";
import { useSubscribe, useWalletBalance } from "@hooks/api/useMokafaatQueries";
import type {
  CouponValidateResult,
  DiscountCodeResult,
} from "@network/services/mokafaatService";
import {
  formatPrice,
  getPlanDurationLabel,
  getPlanFamilySeats,
  getPlanName,
  getPlanPricing,
  type RawPlan,
} from "@utils/subscriptionPricing";
import { initMoyasarPayment, isApplePayAvailable } from "@utils/moyasar";
import { startArbPayment } from "@utils/arbPayment";
import { startTamaraPayment } from "@utils/tamaraPayment";
import { getPaymentGateway, gatewayFromPaymentInfo } from "@utils/paymentGateway";
import { Button, FOCUS } from "@ui";

/** الباقة كما وصلت من /api/subscription/plans (تشمل حقول خصم المستوى) */
export type SubscriptionPlanState = RawPlan;

interface MoyasarConfig {
  amountHalala: number;
  currency: string;
  description: string;
  publishableKey: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
  methods: string[];
  supportedNetworks?: string[];
}

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * صفحة الدفع — نفس ترتيب شاشة «طريقة الدفع» في التطبيق
 * (`subscription_payment_method_view.dart`): ملخص الباقة، كوبون خصم وكود خصم
 * بإعادة حساب الإجمالي من الخادم، ثم وسائل الدفع (مدى / Apple Pay /
 * بطاقة ائتمانية-مدى / الدفع من النقاط)، ثم نموذج ميسر.
 */
const SubscriptionPaymentPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isRTL = useIsRTL();

  // الباقة تُمرَّر عبر sessionStorage (Next.js بلا navigation state)
  const plan: SubscriptionPlanState | undefined = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    try {
      const stored = sessionStorage.getItem("subscription_plan");
      return stored ? (JSON.parse(stored) as SubscriptionPlanState) : undefined;
    } catch {
      return undefined;
    }
  }, []);

  const [method, setMethod] = useState<PaymentMethodType>("mada");
  const [coupon, setCoupon] = useState<CouponValidateResult | null>(null);
  const [discount, setDiscount] = useState<DiscountCodeResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  /** methods = اختيار الوسيلة | card = نموذج ميسر بعد الضغط على إتمام الدفع */
  const [step, setStep] = useState<"methods" | "card">("methods");

  const moyasarConfigRef = useRef<MoyasarConfig | null>(null);
  const moyasarInitedRef = useRef(false);
  const [moyasarMountKey, setMoyasarMountKey] = useState(0);

  const subscribeMutation = useSubscribe();
  const { data: walletData } = useWalletBalance();

  const walletBalance = useMemo(() => {
    const root = (walletData as Record<string, unknown>)?.data ?? walletData;
    const wallet =
      ((root as Record<string, unknown>)?.wallet as Record<string, unknown>) ??
      (root as Record<string, unknown>) ??
      {};
    return num(wallet.total_balance ?? wallet.balance ?? 0);
  }, [walletData]);

  const applePaySupported = useMemo(() => isApplePayAvailable(), []);

  const planName = plan ? getPlanName(plan, !!isRTL) : "";
  const pricing = useMemo(() => getPlanPricing(plan), [plan]);
  const durationLabel = plan ? getPlanDurationLabel(plan, t) : "";
  const seats = getPlanFamilySeats(plan);

  /** الأساس = السعر بعد خصم مستوى العضوية (الخادم يطبّقه أولاً) */
  const baseAmount = pricing.final;
  const couponAmount = Math.min(num(coupon?.discount), baseAmount);
  const afterCoupon = Math.max(Math.round((baseAmount - couponAmount) * 100) / 100, 0);
  const codeAmount = Math.min(num(discount?.discount_amount), afterCoupon);
  const total = Math.max(Math.round((afterCoupon - codeAmount) * 100) / 100, 0);

  // تمارا: خيار إضافي يظهر عند تفعيله من اللوحة وكون المبلغ داخل حدود الحساب
  const { available: tamaraAvailable, instalments: tamaraInstalments } =
    useTamara(total);

  // تغيير الباقة (ترقية/تقليل): نعرض المعاينة ولا ننفّذ إلا بموافقة صريحة
  const [changePreview, setChangePreview] = useState<PlanChangePreview | null>(null);
  const [changeBusy, setChangeBusy] = useState(false);

  // كود الخصم يُحتسب على المبلغ بعد الكوبون — نُلغيه عند تغيّر الكوبون
  const onCouponChange = useCallback((c: CouponValidateResult | null) => {
    setCoupon(c);
    setDiscount(null);
  }, []);

  useEffect(() => {
    if (step !== "card" || !moyasarConfigRef.current || moyasarInitedRef.current)
      return;
    const cfg = moyasarConfigRef.current;
    moyasarInitedRef.current = true;
    void initMoyasarPayment({
      ...cfg,
      elementSelector: ".mysr-form-subscription",
      applePay: { country: "SA", label: cfg.description },
    }).catch(() => {
      moyasarInitedRef.current = false;
      setErrorMsg(t("payment.gatewayLoadFailed"));
      setStep("methods");
    });
  }, [step, moyasarMountKey, t]);

  useEffect(() => {
    if (!plan?.id) navigate("/subscription/plans", { replace: true });
  }, [plan, navigate]);

  const backToMethods = useCallback(() => {
    moyasarInitedRef.current = false;
    moyasarConfigRef.current = null;
    setErrorMsg(null);
    setStep("methods");
    setMoyasarMountKey((k) => k + 1);
  }, []);

  const handleConfirmPayment = (confirmChange = false) => {
    if (!plan?.id) return;
    setErrorMsg(null);

    if (method === "applePay" && !applePaySupported) {
      setErrorMsg(t("payment.applePayUnavailable"));
      return;
    }

    subscribeMutation.mutate(
      {
        planId: plan.id,
        paymentMethod: method === "wallet" ? undefined : "card",
        useWallet: method === "wallet" || undefined,
        couponCode: coupon?.coupon_code,
        discountCode: discount?.code,
        confirmChange,
      },
      {
        onSuccess: (res: unknown) => {
          const response = res as { data?: unknown };
          const data = (response?.data ?? res) as Record<string, unknown> | undefined;
          if (!data) {
            navigate("/subscription/success", { replace: true });
            return;
          }
          if (data.status === false) {
            const msg = (data.msg as string) || t("home.subscription.paymentFailed");
            const errNum = data.errNum as string | undefined;
            // الخادم يطلب تأكيد تغيير الباقة ويرسل المعاينة معه
            if (errNum === "E007" && data.change_preview) {
              setChangePreview(data.change_preview as PlanChangePreview);
              setChangeBusy(false);
              return;
            }
            if (errNum === "E006" || String(msg).includes("اشتراك فعال")) {
              setErrorMsg(msg);
              return;
            }
            setErrorMsg(msg);
            return;
          }

          const inner = (data.data ?? data) as Record<string, unknown> | undefined;
          const subscription =
            (inner?.subscription as Record<string, unknown> | undefined) ??
            (data.subscription as Record<string, unknown> | undefined);
          const paymentInfo =
            (subscription?.payment_info as Record<string, unknown> | undefined) ??
            (inner?.payment_info as Record<string, unknown> | undefined) ??
            (data.payment_info as Record<string, unknown> | undefined);
          const requiresPayment =
            (subscription?.requires_payment as boolean | undefined) ??
            (inner?.requires_payment as boolean | undefined) ??
            (data.requires_payment as boolean | undefined) ??
            !!paymentInfo;
          const subscriptionId =
            (subscription?.id as string | number | undefined) ??
            (inner?.subscription_id as string | number | undefined) ??
            (data.subscription_id as string | number | undefined);

          // مدفوع بالكامل (مجاني/نقاط/خصومات) — لا حاجة لبوابة الدفع
          if (!requiresPayment && !paymentInfo) {
            const params = new URLSearchParams({ type: "subscription" });
            if (subscriptionId != null)
              params.set("subscription_id", String(subscriptionId));
            navigate(`/subscription/success?${params.toString()}`, { replace: true });
            return;
          }

          if (!requiresPayment) {
            setErrorMsg(t("payment.gatewayInitFailed"));
            return;
          }

          const successParams = {
            type: "subscription",
            plan_id: String(plan.id),
            ...(subscriptionId != null
              ? { subscription_id: String(subscriptionId) }
              : {}),
          };

          // الراجحي: تحويل لصفحة البنك ثم العودة
          const startArb = () => {
            if (subscriptionId == null) {
              setErrorMsg(t("payment.gatewayInitFailed"));
              return;
            }
            const returnUrl = `${window.location.origin}/orders/callback?${new URLSearchParams(
              { gateway: "arb", ...successParams },
            ).toString()}`;
            startArbPayment({ subscriptionId, returnUrl }).then((r) => {
              if (!r.ok) setErrorMsg(r.error || t("home.subscription.paymentFailed"));
            });
          };

          // تمارا: تحويل لصفحة تمارا ثم العودة (الباك-إند يفعّل الاشتراك)
          const startTamara = () => {
            if (subscriptionId == null) {
              setErrorMsg(t("payment.gatewayInitFailed"));
              return;
            }
            const returnUrl = `${window.location.origin}/orders/callback?${new URLSearchParams(
              { gateway: "tamara", ...successParams },
            ).toString()}`;
            startTamaraPayment({ subscriptionId, returnUrl }).then((r) => {
              if (!r.ok) setErrorMsg(r.error || t("payment.tamaraError"));
            });
          };

          // ميسر: نموذج الدفع داخل الصفحة
          const startMoyasar = () => {
            const amountHalalaRaw =
              (paymentInfo?.amount_halala as number | undefined) ??
              (typeof paymentInfo?.amount === "number"
                ? (paymentInfo.amount as number) * 100
                : undefined);
            const amountHalala = Number.isFinite(amountHalalaRaw as number)
              ? (amountHalalaRaw as number)
              : undefined;
            const publishableKey =
              (paymentInfo?.publishable_key as string | undefined) || "";

            if (!publishableKey || !amountHalala) {
              setErrorMsg(t("payment.paymentDataIncomplete"));
              return;
            }

            const callbackUrl = `${window.location.origin}/orders/callback?${new URLSearchParams(
              successParams,
            ).toString()}`;

            moyasarConfigRef.current = {
              amountHalala,
              currency: (paymentInfo?.currency as string | undefined) || "SAR",
              description:
                (paymentInfo?.description as string | undefined) ||
                planName ||
                t("home.subscription.paymentTitle"),
              publishableKey,
              callbackUrl,
              metadata:
                (paymentInfo?.metadata as Record<string, unknown> | undefined) || {},
              methods: method === "applePay" ? ["applepay"] : ["creditcard"],
              supportedNetworks:
                method === "mada" ? ["mada"] : ["visa", "mastercard", "mada"],
            };
            moyasarInitedRef.current = false;
            setMoyasarMountKey((k) => k + 1);
            setStep("card");
          };

          // تمارا: اختيار صريح من المستخدم — له الأولوية على البوابة الافتراضية
          if (method === "tamara") {
            startTamara();
            return;
          }

          const gatewayFromServer = gatewayFromPaymentInfo(paymentInfo);
          if (gatewayFromServer === "arb") {
            startArb();
            return;
          }
          if (gatewayFromServer === "moyasar") {
            startMoyasar();
            return;
          }
          getPaymentGateway().then((gateway) => {
            if (gateway === "arb") startArb();
            else startMoyasar();
          });
        },
        onError: (err) => {
          if (err instanceof AxiosError) {
            if (err.response?.status === 401) {
              setErrorMsg(t("home.subscription.loginRequiredToViewPlans"));
              return;
            }
            const msg = (err.response?.data as { msg?: string } | undefined)?.msg;
            setErrorMsg(msg || t("home.subscription.paymentFailed"));
            return;
          }
          setErrorMsg(t("home.subscription.paymentFailed"));
        },
      },
    );
  };

  if (!plan?.id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(150deg,#1B1150_0%,#400198_55%,#6703EB_100%)]">
        <LoadingSpinner />
      </div>
    );
  }

  const row = (label: string, value: React.ReactNode, tone?: "muted" | "green") => (
    <div
      className={`flex items-center justify-between text-sm ${
        tone === "green" ? "text-mk-green" : "text-mk-muted"
      }`}
    >
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>{t("home.subscription.paymentTitle")}</title>
      </Helmet>

      <section className="min-h-screen bg-[linear-gradient(150deg,#1B1150_0%,#400198_55%,#6703EB_100%)] px-4 pb-14 pt-20">
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            onClick={() =>
              step === "card" ? backToMethods() : navigate("/subscription/plans")
            }
            className={`mb-5 flex min-h-[44px] items-center gap-2 rounded-mk-md px-2 text-white transition-colors hover:bg-white/10 ${FOCUS}`}
          >
            <FiArrowLeft className={`text-2xl ${isRTL ? "" : "rotate-180"}`} />
            <span>{t("subscription.back")}</span>
          </button>

          <h1 className="mb-1 text-center text-2xl font-bold text-white">
            {step === "card"
              ? t("payment.completePayment")
              : t("home.subscription.paymentTitle")}
          </h1>
          <p className="mb-6 text-center text-sm text-white/80">
            {step === "card"
              ? t("payment.completePaymentDesc")
              : t("home.subscription.paymentDesc")}
          </p>

          {errorMsg && (
            <div
              role="alert"
              className="mb-5 rounded-mk-md border border-red-400/50 bg-red-500/20 p-4 text-sm text-white"
            >
              {errorMsg}
            </div>
          )}

          {step === "methods" && (
            <>
              {/* ملخص الباقة والسعر */}
              <div className="mb-5 rounded-mk-xl border border-mk-border bg-white p-5 shadow-mk-card">
                <div className="flex items-start gap-2">
                  <h2 className="min-w-0 flex-1 text-lg font-bold text-mk-text">
                    {planName}
                  </h2>
                  {durationLabel && (
                    <span className="shrink-0 rounded-full bg-mk-tint px-3 py-1 text-xs font-bold text-mk-primary">
                      {durationLabel}
                    </span>
                  )}
                </div>

                {seats > 0 && (
                  <div className="mt-3 flex items-center gap-2 rounded-mk-md border border-mk-accent/25 bg-mk-accent/10 px-3 py-2">
                    <IoPeopleOutline
                      className="h-[18px] w-[18px] shrink-0 text-mk-accent"
                      aria-hidden
                    />
                    <span className="text-[13px] font-bold text-mk-accent">
                      {t("subscription.familyMembersUpTo").replace(
                        "{{count}}",
                        String(seats),
                      )}
                    </span>
                  </div>
                )}

                <div className="mt-4 space-y-1.5 border-t border-mk-divider pt-3">
                  {row(
                    t("home.subscription.originalPrice"),
                    <span className={pricing.hasDiscount ? "line-through" : ""}>
                      {formatPrice(pricing.original)}
                    </span>,
                  )}
                  {pricing.tierAmount > 0 &&
                    row(
                      `${
                        pricing.tierType === "renewal"
                          ? t("home.subscription.tierDiscountRenewal")
                          : t("home.subscription.tierDiscountNew")
                      }${pricing.tierPercent > 0 ? ` (${formatPrice(pricing.tierPercent)}%)` : ""}`,
                      `− ${formatPrice(pricing.tierAmount)}`,
                      "green",
                    )}
                  {couponAmount > 0 &&
                    row(
                      `${t("payment.couponLabel")} · ${coupon?.coupon_code ?? ""}`,
                      `− ${formatPrice(couponAmount)}`,
                      "green",
                    )}
                  {codeAmount > 0 &&
                    row(
                      `${t("payment.discountCodeLabel")} · ${discount?.code ?? ""}`,
                      `− ${formatPrice(codeAmount)}`,
                      "green",
                    )}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-mk-divider pt-3">
                  <span className="text-sm font-bold text-mk-text-strong">
                    {t("payment.total")}
                  </span>
                  <span className="flex items-center gap-1.5 text-2xl font-bold text-mk-primary">
                    {formatPrice(total)}
                    <CurrencyIcon size={18} className="text-mk-primary" />
                  </span>
                </div>
              </div>

              {/* حقل واحد لكود الخصم أو الكوبون — كان حقلين يبدوان مكرّرين */}
              <div className="mb-5 rounded-mk-xl border border-mk-border bg-white p-5 shadow-mk-card">
                <PromoCodeInput
                  scope="subscription"
                  amount={afterCoupon}
                  itemId={plan.id}
                  onCouponChange={onCouponChange}
                  onDiscountChange={setDiscount}
                />
              </div>

              {/* وسائل الدفع */}
              <div className="mb-5 rounded-mk-xl border border-mk-border bg-white p-5 shadow-mk-card">
                <PaymentMethodSelector
                  value={method}
                  onChange={setMethod}
                  walletBalance={walletBalance}
                  walletDisabled={walletBalance <= 0}
                  tamaraAllowed={tamaraAvailable}
                  tamaraInstalments={tamaraInstalments}
                />
                {method === "applePay" && !applePaySupported && (
                  <p className="rounded-mk-sm bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    {t("payment.applePayUnavailable")}
                  </p>
                )}
              </div>

              <Button
                variant="accent"
                size="lg"
                block
                className="rounded-full"
                disabled={subscribeMutation.isPending}
                onClick={() => handleConfirmPayment()}
              >
                {subscribeMutation.isPending
                  ? t("home.subscription.loading")
                  : `${t("home.subscription.confirmPayment")} · ${formatPrice(total)} ${t("payment.currency")}`}
              </Button>
            </>
          )}

          {step === "card" && (
            <div className="rounded-mk-xl border border-mk-border bg-white p-4 shadow-mk-card">
              <div
                key={moyasarMountKey}
                className="mysr-form-subscription min-h-[220px]"
              />
            </div>
          )}
        </div>
      </section>

      {changePreview && (
        <PlanChangeModal
          preview={changePreview}
          busy={changeBusy}
          onClose={() => setChangePreview(null)}
          onConfirm={() => {
            setChangeBusy(true);
            setChangePreview(null);
            handleConfirmPayment(true);
          }}
        />
      )}
    </>
  );
};

export default SubscriptionPaymentPage;