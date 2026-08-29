"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "@/lib/router-compat";
import { Helmet } from "@/lib/helmet-compat";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@hooks";
import { FiArrowLeft, FiInfo } from "react-icons/fi";
import { AxiosError } from "axios";
import { Button, FOCUS } from "@ui";
import CurrencyIcon from "@components/CurrencyIcon";
import PaymentMethodSelector, {
  type PaymentMethodType,
} from "@components/payment/PaymentMethodSelector";
import {
  useWalletTopup,
  useWalletTopupOptions,
  usePaymentCallback,
} from "@hooks/api/useMokafaatQueries";
import { initMoyasarPayment, isApplePayAvailable } from "@utils/moyasar";
import { formatPrice } from "@utils/subscriptionPricing";
import { pointsUnit } from "@utils/points";

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

function readTopupOptions(payload: unknown): {
  amounts: number[];
  min: number;
  max: number;
} {
  const root = ((payload as Record<string, unknown>)?.data ?? payload ?? {}) as Record<
    string,
    unknown
  >;
  const raw = Array.isArray(root.amounts) ? (root.amounts as unknown[]) : [];
  const amounts = raw
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v) && v > 0);
  return {
    amounts: amounts.length ? amounts : [50, 100, 200, 300, 500, 1000],
    min: Number(root.min ?? 10) || 10,
    max: Number(root.max ?? 5000) || 5000,
  };
}

/**
 * شحن النقاط — نفس شاشة `wallet_topup_view.dart` في التطبيق:
 * تنويه «1 نقطة = 1 ريال سعودي»، باقات نقاط جاهزة أو عدد مخصّص،
 * ثم وسيلة الدفع ثم نموذج ميسر. الدفع يبقى بالريال والعرض بالنقاط.
 */
const WalletTopupPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isRTL = useIsRTL();
  const [searchParams] = useSearchParams();

  const { data: optionsData } = useWalletTopupOptions();
  const options = useMemo(() => readTopupOptions(optionsData), [optionsData]);

  const topupMutation = useWalletTopup();
  const paymentCallback = usePaymentCallback();

  const [selected, setSelected] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [method, setMethod] = useState<PaymentMethodType>("mada");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "card">("form");

  const moyasarConfigRef = useRef<MoyasarConfig | null>(null);
  const moyasarInitedRef = useRef(false);
  const [moyasarMountKey, setMoyasarMountKey] = useState(0);
  const callbackHandledRef = useRef(false);

  const applePaySupported = useMemo(() => isApplePayAvailable(), []);

  const amount = useMemo(() => {
    if (selected != null) return selected;
    const n = Number(custom.trim());
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [selected, custom]);

  // العودة من ميسر: نؤكّد العملية على الخادم ونبقى في نفس الصفحة برسالة صريحة
  const paymentId = searchParams.get("id");
  const paymentStatus = searchParams.get("status");
  useEffect(() => {
    if (callbackHandledRef.current || !paymentId || !paymentStatus) return;
    callbackHandledRef.current = true;
    const paid = paymentStatus.toLowerCase() === "paid";
    paymentCallback
      .mutateAsync({ id: paymentId, status: paymentStatus })
      .then(() => {
        if (paid) setSuccessMsg(t("wallet.topupSuccess"));
        else setErrorMsg(t("wallet.topupFailed"));
      })
      .catch(() => {
        if (paid) setSuccessMsg(t("wallet.topupSuccess"));
        else setErrorMsg(t("wallet.topupFailed"));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId, paymentStatus]);

  useEffect(() => {
    if (step !== "card" || !moyasarConfigRef.current || moyasarInitedRef.current)
      return;
    const cfg = moyasarConfigRef.current;
    moyasarInitedRef.current = true;
    void initMoyasarPayment({
      ...cfg,
      elementSelector: ".mysr-form-topup",
      applePay: { country: "SA", label: cfg.description },
    }).catch(() => {
      moyasarInitedRef.current = false;
      setErrorMsg(t("payment.gatewayLoadFailed"));
      setStep("form");
    });
  }, [step, moyasarMountKey, t]);

  const submit = useCallback(() => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (amount == null) {
      setErrorMsg(t("wallet.enterAmount"));
      return;
    }
    if (amount < options.min || amount > options.max) {
      setErrorMsg(
        t("wallet.amountRange")
          .replace("{{min}}", String(options.min))
          .replace("{{max}}", String(options.max)),
      );
      return;
    }
    if (method === "applePay" && !applePaySupported) {
      setErrorMsg(t("payment.applePayUnavailable"));
      return;
    }

    topupMutation.mutate(amount, {
      onSuccess: (res: unknown) => {
        const body = res as Record<string, unknown> | undefined;
        if (!body || body.status === false) {
          setErrorMsg((body?.msg as string) || t("wallet.topupFailed"));
          return;
        }
        const data = (body.data ?? body) as Record<string, unknown>;
        const topup = (data.topup ?? data) as Record<string, unknown>;
        const paymentInfo = topup.payment_info as Record<string, unknown> | undefined;
        const amountHalala = Number(
          paymentInfo?.amount_halala ?? Number(paymentInfo?.amount ?? amount) * 100,
        );
        const publishableKey = String(paymentInfo?.publishable_key ?? "");
        if (!publishableKey || !Number.isFinite(amountHalala) || amountHalala <= 0) {
          setErrorMsg(t("payment.paymentDataIncomplete"));
          return;
        }
        moyasarConfigRef.current = {
          amountHalala,
          currency: String(paymentInfo?.currency ?? "SAR"),
          description: String(paymentInfo?.description ?? t("wallet.topupTitle")),
          publishableKey,
          callbackUrl: `${window.location.origin}/wallet/topup`,
          metadata:
            (paymentInfo?.metadata as Record<string, unknown> | undefined) ?? {},
          methods: method === "applePay" ? ["applepay"] : ["creditcard"],
          supportedNetworks:
            method === "mada" ? ["mada"] : ["visa", "mastercard", "mada"],
        };
        moyasarInitedRef.current = false;
        setMoyasarMountKey((k) => k + 1);
        setStep("card");
      },
      onError: (err) => {
        if (err instanceof AxiosError) {
          const msg = (err.response?.data as { msg?: string } | undefined)?.msg;
          setErrorMsg(msg || t("wallet.topupFailed"));
          return;
        }
        setErrorMsg(t("wallet.topupFailed"));
      },
    });
  }, [amount, applePaySupported, method, options.max, options.min, t, topupMutation]);

  return (
    <>
      <Helmet>
        <title>{t("wallet.topupTitle")} | Mokafaat</title>
      </Helmet>

      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          onClick={() =>
            step === "card"
              ? (() => {
                  moyasarInitedRef.current = false;
                  moyasarConfigRef.current = null;
                  setStep("form");
                })()
              : navigate("/wallet")
          }
          className={`mb-4 flex min-h-[44px] items-center gap-2 rounded-mk-md px-2 text-mk-primary transition-colors hover:bg-mk-tint2 ${FOCUS}`}
        >
          <FiArrowLeft className={`text-xl ${isRTL ? "" : "rotate-180"}`} />
          <span className="font-semibold">{t("subscription.back")}</span>
        </button>

        <h1 className="mb-4 text-xl font-bold text-mk-text sm:text-2xl">
          {t("wallet.topupTitle")}
        </h1>

        {successMsg && (
          <div
            role="status"
            className="mb-4 rounded-mk-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
          >
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div
            role="alert"
            className="mb-4 rounded-mk-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {errorMsg}
          </div>
        )}

        {step === "card" ? (
          <div className="rounded-mk-xl border border-mk-border bg-white p-4 shadow-mk-card">
            <div key={moyasarMountKey} className="mysr-form-topup min-h-[220px]" />
          </div>
        ) : (
          <>
            {/* تنويه سعر النقطة */}
            <div className="mb-5 flex items-start gap-3 rounded-mk-lg border border-mk-primary/15 bg-[#F6F3FF] p-4">
              <span
                aria-hidden
                className="grid h-10 w-10 shrink-0 place-items-center rounded-mk-md bg-mk-primary/10 text-mk-primary"
              >
                <FiInfo className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-mk-primary">
                  {t("wallet.pointsRateTitle")}
                </p>
                <p className="mt-0.5 text-xs text-mk-muted">
                  {t("wallet.pointsRateDesc")}
                </p>
              </div>
            </div>

            <div className="mb-5 rounded-mk-xl border border-mk-border bg-white p-5 shadow-mk-card">
              <p className="mb-3 text-sm font-bold text-mk-primary">
                {t("wallet.pointsCountLabel")}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {options.amounts.map((a) => {
                  const active = selected === a;
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => {
                        setSelected(a);
                        setCustom("");
                      }}
                      className={`min-h-[64px] rounded-mk-md border px-3 py-3 text-center transition ${
                        active
                          ? "border-[1.8px] border-mk-primary bg-mk-tint2 text-mk-primary"
                          : "border-mk-border-strong bg-white text-mk-text-strong hover:border-mk-primary/40"
                      } ${FOCUS}`}
                      aria-pressed={active}
                    >
                      <span className="block text-lg font-bold">{formatPrice(a)}</span>
                      <span className="block text-[11px] text-mk-muted">
                        {pointsUnit(a, t)}
                      </span>
                    </button>
                  );
                })}
              </div>

              <label
                htmlFor="mk-topup-custom"
                className="mb-2 mt-5 block text-[13px] font-bold text-mk-muted"
              >
                {t("wallet.otherAmount")}
              </label>
              <div className="flex items-center gap-2 rounded-mk-md border border-mk-border-strong bg-white px-4">
                <input
                  id="mk-topup-custom"
                  type="number"
                  inputMode="numeric"
                  min={options.min}
                  max={options.max}
                  value={custom}
                  onChange={(e) => {
                    setCustom(e.target.value);
                    setSelected(null);
                  }}
                  placeholder={t("wallet.enterPointsAmount")}
                  className="min-h-[48px] flex-1 bg-transparent text-sm text-mk-text outline-none"
                />
                <span className="shrink-0 text-xs text-mk-muted">
                  {pointsUnit(Number(custom) || 0, t)}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-mk-muted">
                {t("wallet.amountRange")
                  .replace("{{min}}", String(options.min))
                  .replace("{{max}}", String(options.max))}
              </p>
            </div>

            <div className="mb-5 rounded-mk-xl border border-mk-border bg-white p-5 shadow-mk-card">
              <PaymentMethodSelector
                value={method}
                onChange={setMethod}
                walletAllowed={false}
              />
              <p className="text-center text-[11.5px] text-mk-muted">
                {t("wallet.topupGoesToCash")}
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              block
              className="rounded-full"
              disabled={topupMutation.isPending}
              onClick={submit}
            >
              {topupMutation.isPending ? (
                t("home.subscription.loading")
              ) : amount == null ? (
                t("home.subscription.confirmPayment")
              ) : (
                <span className="flex items-center gap-1.5">
                  {t("wallet.payAmount").replace("{{amount}}", formatPrice(amount))}
                  <CurrencyIcon size={15} className="text-white" />
                </span>
              )}
            </Button>
          </>
        )}
      </div>
    </>
  );
};

export default WalletTopupPage;
