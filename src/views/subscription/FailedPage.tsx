"use client";

import React from "react";
import { useNavigate, useSearchParams } from "@/lib/router-compat";
import { Helmet } from "@/lib/helmet-compat";
import { useTranslation } from "react-i18next";
import { Button } from "@ui";

/** فشل الدفع — رسالة صريحة من البوابة إن وُجدت، مع إعادة المحاولة بنفس الباقة */
const SubscriptionFailedPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const message = searchParams.get("message");
  const planId = searchParams.get("plan_id");

  const hasStoredPlan =
    typeof window !== "undefined" &&
    !!window.sessionStorage.getItem("subscription_plan");

  return (
    <>
      <Helmet>
        <title>{t("home.subscription.paymentFailed")} | Mokafaat</title>
      </Helmet>

      <section className="flex min-h-screen flex-col items-center justify-center bg-[linear-gradient(150deg,#1B1150_0%,#400198_55%,#6703EB_100%)] px-4 py-12">
        <div
          className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20"
          aria-hidden
        >
          <span className="text-4xl">⚠️</span>
        </div>

        <h1 className="mb-4 text-center text-2xl font-bold text-white md:text-3xl">
          {t("home.subscription.paymentFailed")}
        </h1>
        <p className="mb-4 max-w-md text-center text-white/80">
          {t("home.subscription.paymentFailedDesc")}
        </p>

        {message && (
          <p
            role="alert"
            className="mb-8 max-w-md rounded-mk-md border border-red-400/50 bg-red-500/20 px-4 py-3 text-center text-sm text-white"
          >
            {message}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="accent"
            size="lg"
            className="rounded-full"
            onClick={() =>
              navigate(
                hasStoredPlan && planId
                  ? `/subscription/payment?plan_id=${planId}`
                  : "/subscription/plans",
              )
            }
          >
            {t("home.subscription.tryAgain")}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="rounded-full"
            onClick={() => navigate("/")}
          >
            {t("home.subscription.backToHome")}
          </Button>
        </div>
      </section>
    </>
  );
};

export default SubscriptionFailedPage;
