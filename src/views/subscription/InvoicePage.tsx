"use client";

import React from "react";
import { useNavigate, useSearchParams } from "@/lib/router-compat";
import { Helmet } from "@/lib/helmet-compat";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@hooks";
import { FiArrowLeft } from "react-icons/fi";
import { FOCUS, Button } from "@ui";
import SubscriptionInvoice from "./SubscriptionInvoice";

/** صفحة فاتورة الاشتراك المستقلة — /subscription/invoice?subscription_id=… */
const SubscriptionInvoicePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isRTL = useIsRTL();
  const [searchParams] = useSearchParams();
  const subscriptionId = searchParams.get("subscription_id");

  return (
    <>
      <Helmet>
        <title>{t("invoice.title")} | Mokafaat</title>
      </Helmet>

      <section className="min-h-screen bg-[linear-gradient(150deg,#1B1150_0%,#400198_55%,#6703EB_100%)] px-4 pb-14 pt-20">
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className={`mb-5 flex min-h-[44px] items-center gap-2 rounded-mk-md px-2 text-white transition-colors hover:bg-white/10 ${FOCUS}`}
          >
            <FiArrowLeft className={`text-2xl ${isRTL ? "" : "rotate-180"}`} />
            <span>{t("subscription.back")}</span>
          </button>

          <h1 className="mb-6 text-center text-2xl font-bold text-white">
            {t("invoice.title")}
          </h1>

          <SubscriptionInvoice subscriptionId={subscriptionId} />

          <Button
            variant="outline"
            size="lg"
            block
            className="mt-5 rounded-full"
            onClick={() => navigate("/wallet")}
          >
            {t("invoice.allTransactions")}
          </Button>
        </div>
      </section>
    </>
  );
};

export default SubscriptionInvoicePage;
