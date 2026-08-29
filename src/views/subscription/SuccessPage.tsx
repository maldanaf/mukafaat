"use client";

import React, { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "@/lib/router-compat";
import { Helmet } from "@/lib/helmet-compat";
import { useTranslation } from "react-i18next";
import { usePaymentCallback } from "@hooks/api/useMokafaatQueries";
import { Button } from "@ui";
import SubscriptionInvoice from "./SubscriptionInvoice";

/**
 * صفحة نجاح الاشتراك — تعرض الفاتورة مباشرة (رقم الفاتورة والتفاصيل وتحميل
 * الـPDF إن توفّر)، وللاشتراك المُهدى زر «عرض فاتورة الهدية».
 */
const SubscriptionSuccessPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentCallback = usePaymentCallback();
  const calledRef = useRef(false);

  const id = searchParams.get("id");
  const status = searchParams.get("status");
  const isGift = searchParams.get("from") === "subscribe_for_other";
  const subscriptionId = searchParams.get("subscription_id");

  useEffect(() => {
    if (calledRef.current || !id || !status || status.toLowerCase() !== "paid")
      return;
    calledRef.current = true;
    paymentCallback.mutate({ id, status });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, status]);

  return (
    <>
      <Helmet>
        <title>{t("home.subscription.thankYouForSubscribing")} | Mokafaat</title>
      </Helmet>

      <section className="min-h-screen bg-[linear-gradient(150deg,#1B1150_0%,#400198_55%,#6703EB_100%)] px-4 py-14">
        <div className="mx-auto max-w-lg">
          <div
            className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/10"
            aria-hidden
          >
            <span className="text-5xl">🎉</span>
          </div>

          <h1 className="mb-3 text-center text-2xl font-bold text-white md:text-3xl">
            {t("home.subscription.thankYouForSubscribing")}
          </h1>
          <p className="mb-8 text-center text-white/80">
            {t("home.subscription.thankYouDesc")}
          </p>

          {/* الفاتورة: للاشتراك الذاتي تُعرض هنا، وللهدية زر لفاتورة الهدية */}
          {!isGift && <SubscriptionInvoice subscriptionId={subscriptionId} />}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {isGift && subscriptionId && (
              <Button
                variant="accent"
                size="lg"
                className="rounded-full"
                onClick={() => navigate(`/profile/gifts/${subscriptionId}`)}
              >
                {t("giftSubscription.view_invoice")}
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              className="rounded-full"
              onClick={() => navigate("/")}
            >
              {t("home.subscription.ok")}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default SubscriptionSuccessPage;
