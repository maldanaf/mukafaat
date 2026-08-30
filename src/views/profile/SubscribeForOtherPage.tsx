"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Navigate } from "@/lib/router-compat";
import { Helmet } from "@/lib/helmet-compat";
import { useTranslation } from "react-i18next";
import { useIsRTL, useTamara } from "@hooks";
import {
  useGeoCountries,
  useRegions,
  useCities,
  useGiftPlans,
  useSubscribeForOther,
} from "@hooks/api/useMokafaatQueries";
import { parseGeoCountries } from "@utils/geo";
import CurrencyIcon from "@components/CurrencyIcon";
import {
  formatPrice,
  getPlanPricing,
  parseGiftPlansMeta,
  parsePlansList,
  type RawPlan,
} from "@utils/subscriptionPricing";
import CountryCodeSelect from "@components/CountryCodeSelect";
import { toast } from "react-toastify";
import { useUserStore } from "@stores/userStore";
import { useHydrated } from "@hooks/useHydrated";
import { initMoyasarPayment, isApplePayAvailable } from "@utils/moyasar";
import PaymentMethodSelector, {
  type PaymentMethodType,
} from "@components/payment/PaymentMethodSelector";
import { startArbPayment } from "@utils/arbPayment";
import { startTamaraPayment } from "@utils/tamaraPayment";
import { gatewayFromPaymentInfo } from "@utils/paymentGateway";
import { Button, FOCUS } from "@ui";
import {
  IoGiftOutline,
  IoPersonOutline,
  IoCardOutline,
  IoSparklesOutline,
} from "react-icons/io5";
import {
  AccountLoading,
  AccountPageHead,
  AccountPanel,
} from "./components/AccountKit";

/** الباقة كما ترجع من /api/subscription/gift/plans (بأسعارها بعد الخصومات) */
type PlanItem = RawPlan;

function getPlanName(plan: PlanItem, rtl: boolean): string {
  return (
    (plan.name as string) ??
    (rtl ? plan.name_ar ?? plan.name_en : plan.name_en ?? plan.name_ar) ??
    ""
  );
}

const SubscribeForOtherPage: React.FC = () => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const subscribeMutation = useSubscribeForOther();

  // كوبون الخصم — يُرسل للـ API فيرجع الأسعار محسوبة بعد خصم المستوى والكوبون
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");

  const { data: plansData, isLoading: plansLoading } = useGiftPlans({
    coupon_code: appliedCoupon || undefined,
  });
  const plans = useMemo(() => parsePlansList(plansData), [plansData]);
  const giftMeta = useMemo(() => parseGiftPlansMeta(plansData), [plansData]);

  // الدول المفعّلة فقط + علامة «دولة واحدة» (نخفي خطوة اختيار الدولة عندها)
  const { data: geoData } = useGeoCountries();
  const geo = useMemo(() => parseGeoCountries(geoData), [geoData]);
  const countries = geo.countries;

  const [name, setName] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [countryDial, setCountryDial] = useState("966");
  const [countryId, setCountryId] = useState<number | null>(null);
  const [regionId, setRegionId] = useState<string | number | null>(null);
  const [cityId, setCityId] = useState<number | null>(null);
  const [planId, setPlanId] = useState<string>("");
  const [gender, setGender] = useState<"male" | "female">("male");
  // وسيلة الدفع — نفس خيارات التطبيق (مدى / Apple Pay / بطاقة / المحفظة)
  const [payMethod, setPayMethod] = useState<PaymentMethodType>("mada");
  const useWallet = payMethod === "wallet";
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "card">("form");
  const moyasarConfigRef = useRef<{
    amountHalala: number;
    currency: string;
    description: string;
    publishableKey: string;
    callbackUrl: string;
    metadata: Record<string, unknown>;
  } | null>(null);
  const moyasarInitedRef = useRef(false);
  const [moyasarMountKey, setMoyasarMountKey] = useState(0);

  const { data: regions = [] } = useRegions(countryId);
  const effectiveRegionId =
    regionId != null ? regionId : (regions[0]?.id ?? null);
  const { data: cities = [] } = useCities(effectiveRegionId);

  useEffect(() => {
    if (!countries.length || countryId != null) return;
    // دولة واحدة مفعّلة ⇒ تُختار تلقائياً بلا خطوة اختيار
    if (geo.singleCountry && geo.onlyCountry) {
      setCountryId(geo.onlyCountry.id);
      return;
    }
    const sa = countries.find(
      (c) =>
        String(c.code ?? "").toUpperCase() === "SA" ||
        String(c.name ?? "").includes("سعود") ||
        String(c.name ?? "").toLowerCase().includes("saudi"),
    );
    const first = sa ?? countries[0];
    if (first?.id != null) setCountryId(Number(first.id));
  }, [countries, countryId, geo]);

  useEffect(() => {
    if (!regions.length) return;
    if (regionId !== null) return;
    setRegionId(regions[0].id);
  }, [regions, regionId]);

  useEffect(() => {
    if (step !== "card" || !moyasarConfigRef.current || moyasarInitedRef.current)
      return;
    const cfg = moyasarConfigRef.current;
    moyasarInitedRef.current = true;
    void initMoyasarPayment({
      ...cfg,
      elementSelector: ".mysr-form-subscribe-other",
      methods: payMethod === "applePay" ? ["applepay"] : ["creditcard"],
      supportedNetworks:
        payMethod === "mada" ? ["mada"] : ["visa", "mastercard", "mada"],
      applePay: { country: "SA", label: cfg.description },
    }).catch(() => {
      moyasarInitedRef.current = false;
      setErrorMsg(t("subscribeForOther.moyasar_load_failed"));
      setStep("form");
    });
  }, [step, moyasarMountKey, payMethod, t]);

  const selectedPlan = useMemo(
    () => plans.find((p) => String(p.id) === planId),
    [plans, planId],
  );
  const selectedPricing = useMemo(
    () => getPlanPricing(selectedPlan),
    [selectedPlan],
  );

  // تمارا: خيار إضافي يظهر عند تفعيله من اللوحة وكون المبلغ داخل حدود الحساب
  const { available: tamaraAvailable, instalments: tamaraInstalments } =
    useTamara(selectedPricing.final);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const trimmed = name.trim();
    const phone = phoneDigits.replace(/\D/g, "");
    if (!trimmed) {
      toast.error(t("subscribeForOther.err_name"));
      return;
    }
    if (phone.length < 8) {
      toast.error(t("subscribeForOther.err_phone"));
      return;
    }
    if (!planId) {
      toast.error(t("subscribeForOther.err_plan"));
      return;
    }
    const dial = countryDial.replace(/\D/g, "");
    const country_code = dial.startsWith("+") ? `+${dial.replace(/^\+/, "")}` : `+${dial}`;

    subscribeMutation.mutate(
      {
        name: trimmed,
        phone,
        country_code,
        plan_id: Number(planId),
        use_wallet: useWallet || undefined,
        ...(appliedCoupon && { coupon_code: appliedCoupon }),
        ...(countryId != null && { country_id: countryId }),
        ...(cityId != null && { city_id: cityId }),
        gender,
      },
      {
        onSuccess: (res: unknown) => {
          const raw = res as Record<string, unknown> | undefined;
          const data = (raw?.data ?? raw) as Record<string, unknown> | undefined;
          if (!data) {
            toast.success(t("subscribeForOther.success"));
            navigate("/subscription/success", { replace: true });
            return;
          }
          if (data.status === false) {
            const msg = (data.msg as string) || t("subscribeForOther.failed");
            const errNum = data.errNum as string | undefined;
            if (
              errNum === "E006" ||
              (msg && String(msg).includes("فعال"))
            ) {
              setErrorMsg(t("subscribeForOther.err_active_subscription"));
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

          // بوابات إعادة التوجيه (تمارا / الراجحي): تحويل لصفحتها بدل نموذج البطاقة
          if (requiresPayment) {
            const startRedirectGateway = (gateway: "arb" | "tamara") => {
              if (subscriptionId == null) {
                setErrorMsg(t("subscribeForOther.payment_incomplete"));
                return;
              }
              const returnUrl = `${window.location.origin}/orders/callback?${new URLSearchParams(
                {
                  gateway,
                  type: "subscription",
                  plan_id: String(planId),
                  subscription_id: String(subscriptionId),
                  from: "subscribe_for_other",
                },
              ).toString()}`;
              const start =
                gateway === "tamara" ? startTamaraPayment : startArbPayment;
              start({ subscriptionId, returnUrl }).then((r) => {
                if (!r.ok) setErrorMsg(r.error || t("subscribeForOther.failed"));
              });
            };

            // تمارا: اختيار صريح من المستخدم — يسبق البوابة الافتراضية
            if (payMethod === "tamara") {
              startRedirectGateway("tamara");
              return;
            }

            const startArb = () => {
              if (subscriptionId == null) {
                setErrorMsg(t("subscribeForOther.payment_incomplete"));
                return;
              }
              const returnUrl = `${window.location.origin}/orders/callback?${new URLSearchParams(
                {
                  gateway: "arb",
                  type: "subscription",
                  plan_id: String(planId),
                  subscription_id: String(subscriptionId),
                  from: "subscribe_for_other",
                },
              ).toString()}`;
              startArbPayment({ subscriptionId, returnUrl }).then((r) => {
                if (!r.ok) setErrorMsg(r.error || t("subscribeForOther.failed"));
              });
            };

            // الباك-إند يرسل `gateway` داخل payment_info؛ وإن غاب فالافتراضي ميسر
            // (المسار الذي يكمل بالأسفل بنموذج البطاقة).
            if (gatewayFromPaymentInfo(paymentInfo) === "arb") {
              startArb();
              return;
            }
          }

          if (paymentInfo && requiresPayment) {
            const amountHalalaRaw =
              (paymentInfo.amount_halala as number | undefined) ??
              (typeof paymentInfo.amount === "number"
                ? (paymentInfo.amount as number) * 100
                : undefined);
            const amountHalala = Number.isFinite(amountHalalaRaw as number)
              ? (amountHalalaRaw as number)
              : undefined;
            const currency =
              (paymentInfo.currency as string | undefined) || "SAR";
            const description =
              (paymentInfo.description as string | undefined) ||
              (selectedPlan ? getPlanName(selectedPlan, isRTL) : "") ||
              t("subscribeForOther.payment_title");
            const publishableKey =
              (paymentInfo.publishable_key as string | undefined) || "";
            const metadata =
              (paymentInfo.metadata as Record<string, unknown> | undefined) ||
              {};
            if (!publishableKey || !amountHalala) {
              setErrorMsg(t("subscribeForOther.payment_incomplete"));
              return;
            }
            const callbackUrl = `${window.location.origin}/orders/callback?${new URLSearchParams(
              {
                type: "subscription",
                plan_id: String(planId),
                from: "subscribe_for_other",
                // معرّف الاشتراك يسمح لصفحة النجاح بعرض فاتورة الإهداء
                ...(subscriptionId != null && {
                  subscription_id: String(subscriptionId),
                }),
              },
            ).toString()}`;
            moyasarConfigRef.current = {
              amountHalala,
              currency,
              description,
              publishableKey,
              callbackUrl,
              metadata,
            };
            moyasarInitedRef.current = false;
            setMoyasarMountKey((k) => k + 1);
            setStep("card");
            return;
          }
          if (!requiresPayment && !paymentInfo) {
            toast.success(t("subscribeForOther.success"));
            // مدفوع بالكامل (محفظة/مجاني) → فاتورة الإهداء مباشرة
            navigate(
              subscriptionId != null
                ? `/profile/gifts/${subscriptionId}`
                : "/subscription/success",
              { replace: true },
            );
            return;
          }
          setErrorMsg(t("subscribeForOther.payment_unexpected"));
        },
        onError: (err: unknown) => {
          const ax = err as { response?: { data?: { message?: string; msg?: string } } };
          const msg =
            ax?.response?.data?.message ?? ax?.response?.data?.msg;
          setErrorMsg(msg ?? t("subscribeForOther.failed"));
        },
      },
    );
  };

  const planLabel = (p: PlanItem) => {
    const n = getPlanName(p, isRTL);
    const pr = getPlanPricing(p);
    const suffix = t("subscribeForOther.currency_suffix");
    return pr.hasDiscount
      ? `${n} — ${formatPrice(pr.final)} ${suffix} (${formatPrice(pr.original)})`
      : `${n} — ${formatPrice(pr.final)} ${suffix}`;
  };


  const hydrated = useHydrated();

  if (!hydrated) return <AccountLoading rows={5} />;

  if (!user) {
    return (
      <Navigate
        to={`/login?returnUrl=${encodeURIComponent("/profile/subscribe-for-other")}`}
        replace
      />
    );
  }

  const inputClass =
    "w-full rounded-mk-md border border-mk-border-strong bg-white px-4 py-3 text-[13.5px] text-mk-text outline-none transition-colors placeholder:text-mk-faint focus:border-mk-primary focus:ring-2 focus:ring-[#400198]/15";
  const labelClass = "mb-1.5 block text-[12.5px] font-bold text-mk-text-strong";

  return (
    <>
      <Helmet>
        <title>{t("subscribeForOther.meta_title")} | Mokafaat</title>
      </Helmet>

      <div className="space-y-5" dir={isRTL ? "rtl" : "ltr"}>
        <AccountPageHead
          title={t("subscribeForOther.title")}
          subtitle={t("subscribeForOther.subtitle")}
          icon={<IoGiftOutline />}
          tint="pink"
        />

        {plansLoading ? (
          <AccountLoading rows={5} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <p
                role="alert"
                className="m-0 rounded-mk-md border border-[#F7DDE1] bg-[#FFF7F8] px-4 py-3 text-[13px] font-semibold text-mk-red"
              >
                {errorMsg}
              </p>
            )}

            {step === "card" && (
              <AccountPanel
                title={t("subscribeForOther.complete_payment")}
                icon={<IoCardOutline />}
                tint="violet"
              >
                <div
                  key={moyasarMountKey}
                  className="mysr-form-subscribe-other min-h-[120px]"
                />
                <button
                  type="button"
                  className="mt-3 text-[13px] font-semibold text-mk-primary hover:underline"
                  onClick={() => {
                    setStep("form");
                    moyasarInitedRef.current = false;
                    setErrorMsg(null);
                  }}
                >
                  {t("subscribeForOther.back_to_form")}
                </button>
              </AccountPanel>
            )}

            {step === "form" && (
              <>
                {/* ===== بيانات المُهدى إليه ===== */}
                <AccountPanel
                  title={t("subscribeForOther.label_name")}
                  subtitle={t("subscribeForOther.subtitle")}
                  icon={<IoPersonOutline />}
                  tint="purple"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>
                        {t("subscribeForOther.label_name")}
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t("subscribeForOther.placeholder_name")}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        {t("subscribeForOther.label_phone")}
                      </label>
                      <div className="flex gap-2" style={{ direction: "ltr" }}>
                        <div className="flex shrink-0 items-center rounded-mk-md border border-mk-border-strong bg-white px-1 py-1">
                          <CountryCodeSelect
                            value={countryDial}
                            onChange={setCountryDial}
                            className="w-auto"
                          />
                        </div>
                        <input
                          type="tel"
                          dir="ltr"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          autoComplete="tel"
                          className={`${inputClass} flex-1 text-start`}
                          placeholder={t("home.login.mobile_placeholder")}
                          value={phoneDigits}
                          onChange={(e) =>
                            setPhoneDigits(e.target.value.replace(/[^\d]/g, ""))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    className={`mt-4 grid grid-cols-1 gap-4 ${
                      geo.singleCountry ? "sm:grid-cols-2" : "sm:grid-cols-3"
                    }`}
                  >
                    {/* بند «الدولة الواحدة»: لا تظهر خطوة اختيار الدولة */}
                    {!geo.singleCountry && (
                      <div>
                        <label className={labelClass}>
                          {t("subscribeForOther.label_country")}
                        </label>
                        <select
                          value={countryId ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setCountryId(v ? Number(v) : null);
                            setRegionId(null);
                            setCityId(null);
                          }}
                          className={inputClass}
                        >
                          {countries.map((c) => (
                            <option key={String(c.id)} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className={labelClass}>
                        {t("subscribeForOther.label_region")}
                      </label>
                      <select
                        value={regionId != null ? String(regionId) : ""}
                        onChange={(e) => {
                          setRegionId(e.target.value ? e.target.value : null);
                          setCityId(null);
                        }}
                        className={inputClass}
                        disabled={!regions.length}
                      >
                        {regions.map((r) => (
                          <option key={String(r.id)} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>
                        {t("subscribeForOther.label_city")}
                      </label>
                      <select
                        value={cityId != null ? String(cityId) : ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setCityId(v ? Number(v) : null);
                        }}
                        className={inputClass}
                        disabled={!cities.length}
                      >
                        <option value="">
                          {t("subscribeForOther.placeholder_city")}
                        </option>
                        {cities.map((c) => (
                          <option key={String(c.id)} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <span className={labelClass}>
                      {t("subscribeForOther.label_gender")}
                    </span>
                    <div className="flex gap-2">
                      {(["male", "female"] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g)}
                          aria-pressed={gender === g}
                          className={`min-h-[44px] flex-1 rounded-mk-md text-[13.5px] font-bold transition-all duration-200 ${FOCUS} ${
                            gender === g
                              ? "bg-grad-accent text-white shadow-mk-glow-accent"
                              : "bg-mk-tint2 text-mk-text-strong hover:bg-mk-border-strong/60"
                          }`}
                        >
                          {g === "male"
                            ? t("subscribeForOther.gender_male")
                            : t("subscribeForOther.gender_female")}
                        </button>
                      ))}
                    </div>
                  </div>
                </AccountPanel>

                {/* ===== الباقة والكوبون ===== */}
                <AccountPanel
                  title={t("subscribeForOther.label_plan")}
                  icon={<IoSparklesOutline />}
                  tint="violet"
                >
                  <div>
                    <label className={labelClass}>
                      {t("subscribeForOther.label_plan")}
                    </label>
                    <select
                      value={planId}
                      onChange={(e) => setPlanId(e.target.value)}
                      className={inputClass}
                      required
                    >
                      <option value="">
                        {t("subscribeForOther.placeholder_plan")}
                      </option>
                      {plans.map((p) => (
                        <option key={String(p.id)} value={String(p.id)}>
                          {planLabel(p)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* كوبون الخصم — الأسعار تُعاد حسابها من الخادم */}
                  <div className="mt-4">
                    <label className={labelClass}>
                      {t("subscribeForOther.label_coupon")}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder={t("subscribeForOther.placeholder_coupon")}
                        className={inputClass}
                      />
                      {appliedCoupon ? (
                        <Button
                          variant="outline"
                          className="shrink-0"
                          onClick={() => {
                            setAppliedCoupon("");
                            setCouponInput("");
                          }}
                        >
                          {t("subscribeForOther.clear_coupon")}
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          className="shrink-0"
                          disabled={!couponInput.trim()}
                          onClick={() => setAppliedCoupon(couponInput.trim())}
                        >
                          {t("subscribeForOther.apply_coupon")}
                        </Button>
                      )}
                    </div>
                    {appliedCoupon && giftMeta.couponMessage && (
                      <p className="m-0 mt-1.5 text-[12px] font-semibold text-mk-amber">
                        {giftMeta.couponMessage}
                      </p>
                    )}
                    {appliedCoupon &&
                      !giftMeta.couponMessage &&
                      selectedPricing.couponDiscount > 0 && (
                        <p className="m-0 mt-1.5 text-[12px] font-semibold text-mk-green">
                          {t("giftSubscription.coupon_applied")}
                        </p>
                      )}
                  </div>

                  {/* تفاصيل السعر للباقة المختارة */}
                  {selectedPlan && (
                    <div className="mt-4 overflow-hidden rounded-mk-md border border-mk-border">
                      <p className="m-0 bg-grad-mist px-4 py-2.5 text-[12px] font-bold text-mk-muted">
                        {t("subscribeForOther.price_breakdown")}
                      </p>
                      <div className="space-y-1.5 bg-white px-4 py-3 text-[13px]">
                        <div className="flex items-center justify-between text-mk-muted">
                          <span>{t("giftSubscription.price_original")}</span>
                          <span
                            className={
                              selectedPricing.hasDiscount ? "line-through" : ""
                            }
                          >
                            {formatPrice(selectedPricing.original)}
                          </span>
                        </div>
                        {selectedPricing.tierAmount > 0 && (
                          <div className="flex items-center justify-between font-semibold text-mk-green">
                            <span>
                              {giftMeta.tier?.name
                                ? t("giftSubscription.tier_discount", {
                                    tier: giftMeta.tier.name,
                                  })
                                : t("giftSubscription.tier_discount_generic")}
                              {selectedPricing.tierPercent > 0
                                ? ` (${formatPrice(selectedPricing.tierPercent)}%)`
                                : ""}
                            </span>
                            <span>− {formatPrice(selectedPricing.tierAmount)}</span>
                          </div>
                        )}
                        {selectedPricing.couponDiscount > 0 && (
                          <div className="flex items-center justify-between font-semibold text-mk-green">
                            <span>{t("giftSubscription.coupon_discount")}</span>
                            <span>− {formatPrice(selectedPricing.couponDiscount)}</span>
                          </div>
                        )}
                        {selectedPricing.discountCodeDiscount > 0 && (
                          <div className="flex items-center justify-between font-semibold text-mk-green">
                            <span>{t("giftSubscription.code_discount")}</span>
                            <span>
                              − {formatPrice(selectedPricing.discountCodeDiscount)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between bg-grad-brand px-4 py-3.5 text-[15px] font-bold text-white">
                        <span>{t("giftSubscription.final_price")}</span>
                        <span className="inline-flex items-center gap-1">
                          {formatPrice(selectedPricing.final)}
                          <CurrencyIcon className="text-white" size={13} />
                        </span>
                      </div>
                    </div>
                  )}
                </AccountPanel>

                {/* ===== الدفع ===== */}
                <AccountPanel
                  title={t("subscribeForOther.complete_payment")}
                  icon={<IoCardOutline />}
                  tint="teal"
                >
                  <PaymentMethodSelector
                    value={payMethod}
                    onChange={setPayMethod}
                    tamaraAllowed={tamaraAvailable}
                    tamaraInstalments={tamaraInstalments}
                  />
                  {payMethod === "applePay" && !isApplePayAvailable() && (
                    <p className="m-0 mt-2 rounded-mk-sm border border-[#FBE3C4] bg-[#FEF3E2] px-3 py-2 text-[12px] font-semibold text-mk-amber">
                      {t("payment.applePayUnavailable")}
                    </p>
                  )}

                  <Button
                    type="submit"
                    variant="accent"
                    size="lg"
                    block
                    className="mt-4 mk-shine"
                    loading={subscribeMutation.isPending}
                    icon={<IoGiftOutline />}
                  >
                    {subscribeMutation.isPending
                      ? t("subscribeForOther.submitting")
                      : t("subscribeForOther.submit")}
                  </Button>
                </AccountPanel>
              </>
            )}
          </form>
        )}
      </div>
    </>
  );
};

export default SubscribeForOtherPage;
