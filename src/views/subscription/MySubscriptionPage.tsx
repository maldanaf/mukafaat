"use client";

import type { TFunction } from "i18next";

import React, { useMemo } from "react";
import { useNavigate } from "@/lib/router-compat";
import { Helmet } from "@/lib/helmet-compat";
import { useTranslation } from "react-i18next";
import {
  IoCalendarOutline,
  IoWarningOutline,
  IoCheckmarkCircle,
} from "react-icons/io5";
import { TbPackage } from "react-icons/tb";
import { Button, Skeleton, FOCUS } from "@ui";
import CurrencyIcon from "@components/CurrencyIcon";
import {
  useSubscriptionPlans,
  useSubscriptionStatus,
} from "@hooks/api/useMokafaatQueries";
import {
  getPlanDurationLabel,
  getPlanName,
  getPlanPricing,
  type RawPlan,
} from "@utils/subscriptionPricing";

/** عتبة التنبيه البصري لقرب الانتهاء */
const ENDING_SOON_DAYS = 7;

/**
 * صفحة «اشتراكي» — كل ما يخصّ اشتراك العميل في مكان واحد:
 *  • اشتراكه الفعّال ومتى ينتهي وكم بقي عليه
 *  • الباقات المتاحة، ومنها يرقّي أو يقلّل مباشرةً بلا تنقّل
 *
 * التغيير نفسه يمرّ بصفحة الدفع التي تعرض نافذة التأكيد (PlanChangeModal)
 * لأن الخادم يطلب `confirm_change` بعد عرض المعاينة.
 */
const MySubscriptionPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: statusData, isLoading: statusLoading } = useSubscriptionStatus();
  const { data: plansData, isLoading: plansLoading } = useSubscriptionPlans();

  /** الاشتراك الفعّال كما يرسله /api/subscription/status */
  const subscription = useMemo(() => {
    const root = (statusData as Record<string, unknown>)?.data ?? statusData;
    const sub = (root as Record<string, unknown>)?.subscription;
    return (sub && typeof sub === "object"
      ? (sub as Record<string, unknown>)
      : null);
  }, [statusData]);

  const plans = useMemo(() => {
    const root = (plansData as Record<string, unknown>)?.data ?? plansData;
    const list =
      (root as Record<string, unknown>)?.plans ??
      (Array.isArray(root) ? root : []);
    return Array.isArray(list) ? (list as RawPlan[]) : [];
  }, [plansData]);

  const hasActive =
    subscription?.has_subscription === true && subscription?.is_active === true;

  const currentPlanId = String(subscription?.subscription_plan_id ?? "");
  const daysRemaining = Number(subscription?.days_remaining ?? 0);
  const currentPrice = Number(subscription?.price ?? 0);
  const endingSoon = daysRemaining <= ENDING_SOON_DAYS;

  const loading = statusLoading || plansLoading;

  /** التغيير يمرّ بصفحة الدفع — هي التي تعرض نافذة التأكيد بالمعاينة */
  const goToPlan = (plan: RawPlan) => {
    navigate("/subscription/payment", { state: { plan } });
  };

  return (
    <>
      <Helmet>
        <title>{t("subscription.mySubscription", "اشتراكي")}</title>
      </Helmet>

      <section className="mx-auto w-full max-w-[900px] px-4 py-6">
        <h1 className="mb-5 text-[20px] font-bold text-mk-text-strong">
          {t("subscription.mySubscription", "اشتراكي")}
        </h1>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-[150px] w-full rounded-mk-xl" />
            <Skeleton className="h-[90px] w-full rounded-mk-xl" />
            <Skeleton className="h-[90px] w-full rounded-mk-xl" />
          </div>
        ) : (
          <>
            {hasActive ? (
              <ActiveCard
                planName={String(subscription?.plan_name ?? "")}
                price={currentPrice}
                days={daysRemaining}
                endDate={String(subscription?.end_date ?? "")}
                endingSoon={endingSoon}
                t={t}
              />
            ) : (
              <NoSubscriptionCard t={t} />
            )}

            <div className="mt-7">
              <h2 className="m-0 text-[16px] font-bold text-mk-text-strong">
                {hasActive
                  ? t("subscription.availablePlansChange", "تغيير الباقة")
                  : t("subscription.availablePlans", "الباقات المتاحة")}
              </h2>
              {hasActive && (
                <p className="m-0 mt-1 text-[12.5px] text-mk-muted">
                  {t(
                    "subscription.availablePlansChangeHint",
                    "يمكنك الترقية أو التقليل، وفرق التقليل يُودَع في محفظتك",
                  )}
                </p>
              )}

              <div className="mt-4 space-y-3">
                {plans.map((plan) => {
                  const planId = String(plan.id ?? "");
                  const isCurrent = hasActive && planId === currentPlanId;
                  const pricing = getPlanPricing(plan);
                  const isUpgrade = pricing.final > currentPrice;

                  return (
                    <PlanRow
                      key={planId}
                      plan={plan}
                      isCurrent={isCurrent}
                      hasActive={hasActive}
                      isUpgrade={isUpgrade}
                      onChoose={() => goToPlan(plan)}
                      t={t}
                    />
                  );
                })}
              </div>
            </div>
          </>
        )}
      </section>
    </>
  );
};

/* ===================== بطاقة الاشتراك الفعّال ===================== */

const ActiveCard: React.FC<{
  planName: string;
  price: number;
  days: number;
  endDate: string;
  endingSoon: boolean;
  t: TFunction;
}> = ({ planName, price, days, endDate, endingSoon, t }) => (
  <div className="rounded-mk-xl bg-gradient-to-bl from-mk-primary-light to-mk-primary p-6 text-white shadow-mk-raised">
    <div className="flex items-center justify-between gap-3">
      <span className="rounded-full bg-[#6EE7A8] px-3 py-1 text-[11px] font-bold text-[#064E3B]">
        {t("subscription.statusActive", "فعّال")}
      </span>
      <span className="flex items-center gap-1 text-[13px] font-bold text-white/90">
        {price.toFixed(0)}
        <CurrencyIcon className="h-3.5 w-3.5" />
      </span>
    </div>

    <h2 className="m-0 mt-4 text-[22px] font-bold">{planName}</h2>

    <div className="mt-5 flex items-center gap-3 rounded-mk-md bg-white/15 px-4 py-3">
      {endingSoon ? (
        <IoWarningOutline className="h-5 w-5 shrink-0 text-[#FCD34D]" />
      ) : (
        <IoCalendarOutline className="h-5 w-5 shrink-0" />
      )}
      <div>
        <p className="m-0 text-[13.5px] font-bold">
          {t("subscription.daysLeft", "باقٍ {{days}} يوم").replace(
            "{{days}}",
            String(days),
          )}
        </p>
        <p className="m-0 mt-0.5 text-[11.5px] text-white/80">
          {t("subscription.endsOn", "ينتهي في {{date}}").replace(
            "{{date}}",
            endDate,
          )}
        </p>
      </div>
    </div>
  </div>
);

const NoSubscriptionCard: React.FC<{ t: TFunction }> = ({
  t,
}) => (
  <div className="rounded-mk-xl border border-mk-border bg-white p-8 text-center shadow-mk-card">
    <TbPackage className="mx-auto h-11 w-11 text-mk-muted" />
    <p className="m-0 mt-3 text-[14px] font-bold text-mk-text-strong">
      {t("subscription.noActiveSubscription", "لا يوجد اشتراك فعّال")}
    </p>
    <p className="m-0 mt-1.5 text-[12px] text-mk-muted">
      {t(
        "subscription.noSubscriptionHint",
        "اشترك للاستفادة من كل العروض والخصومات",
      )}
    </p>
  </div>
);

/* ===================== صف الباقة ===================== */

const PlanRow: React.FC<{
  plan: RawPlan;
  isCurrent: boolean;
  hasActive: boolean;
  isUpgrade: boolean;
  onChoose: () => void;
  t: TFunction;
}> = ({ plan, isCurrent, hasActive, isUpgrade, onChoose, t }) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language?.startsWith("ar") ?? true;
  const pricing = getPlanPricing(plan);
  const duration = getPlanDurationLabel(plan, t as (k: string) => string);

  const actionLabel = !hasActive
    ? t("subscription.subscribeNow", "اشترك الآن")
    : isUpgrade
      ? t("subscription.planActionUpgrade", "ترقية لهذه الباقة")
      : t("subscription.planActionDowngrade", "التغيير لهذه الباقة");

  return (
    <div
      className={`rounded-mk-xl bg-white p-5 shadow-mk-card ${
        isCurrent ? "border-[1.6px] border-mk-primary" : "border border-mk-border"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="m-0 text-[15px] font-bold text-mk-text-strong">
          {getPlanName(plan, isRTL)}
        </h3>
        {isCurrent && (
          <span className="flex shrink-0 items-center gap-1 rounded-mk-sm bg-[#F0E9FE] px-2.5 py-1 text-[11px] font-bold text-mk-primary">
            <IoCheckmarkCircle className="h-3.5 w-3.5" />
            {t("subscription.currentPlanBadge", "باقتك الحالية")}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-end gap-2">
        <span className="flex items-center gap-1 text-[22px] font-bold text-mk-primary">
          {pricing.final.toFixed(0)}
          <CurrencyIcon className="h-4 w-4" />
        </span>
        {duration && (
          <span className="pb-1 text-[11.5px] text-mk-muted">/ {duration}</span>
        )}
      </div>

      {!isCurrent && (
        <Button
          variant={isUpgrade || !hasActive ? "accent" : "outline"}
          size="md"
          block
          className={`mt-4 ${FOCUS}`}
          onClick={onChoose}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default MySubscriptionPage;
