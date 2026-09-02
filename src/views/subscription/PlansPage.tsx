"use client";

import React, { useMemo, useState } from "react";
import { useNavigate, useLocation, Link } from "@/lib/router-compat";
import { Helmet } from "@/lib/helmet-compat";
import { useTranslation } from "react-i18next";
import { LogoLight } from "@assets";
import { useIsRTL } from "@hooks";
import {
  useSubscriptionPlans,
  useProfile,
  useSubscriptionStatus,
} from "@hooks/api/useMokafaatQueries";
import {
  IoClose,
  IoCheckmarkCircle,
  IoPeopleOutline,
  IoShieldCheckmark,
  IoTimeOutline,
  IoAlertCircleOutline,
  IoLogInOutline,
} from "react-icons/io5";
import { AxiosError } from "axios";
import { Button, Skeleton, EmptyState, ErrorState, FOCUS } from "@ui";
import CurrencyIcon from "@components/CurrencyIcon";
import MembershipTierCard from "@components/MembershipTierCard";
import { useUserStore } from "@stores/userStore";
import {
  parseCurrentSubscription,
  isCurrentPlan,
  needsRenewal,
  formatEndDate,
  type CurrentSubscription,
} from "./currentSubscription";
import {
  formatPrice,
  getDiscountPercent,
  getPlanDurationLabel,
  getPlanFamilySeats,
  getPlanFeatures,
  getPlanName,
  getPlanPricing,
  parseMembershipTier,
  parsePlansList,
  type RawPlan,
} from "@utils/subscriptionPricing";

/**
 * صفحة الباقات — مطابقة لكرت الباقة في التطبيق
 * (`choose_package_view.dart`): الاسم + شارة المدة، ثم السعر النهائي
 * والسعر القديم مشطوباً مع شارة نسبة الخصم، ثم عدد أفراد العائلة المسموح،
 * ثم المزايا المشتقّة من الوصف.
 *
 * الرؤية (`visibility`) وسعر الموقع (`price_web`) يعالجهما الخادم تلقائياً
 * عبر رأس `X-Platform: web` المضبوط في `apiClient.ts`.
 */
type PlanItem = RawPlan;

const SubscriptionPlansPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isRTL = useIsRTL();

  const [subscribeErrorMsg, setSubscribeErrorMsg] = useState<string | null>(null);

  const token = useUserStore((s) => s.token);
  const { data: plansData, isLoading, isError, error, refetch } = useSubscriptionPlans();
  const { data: profileData } = useProfile();
  const { data: statusData, isLoading: statusLoading } = useSubscriptionStatus(!!token);
  const tier = useMemo(() => parseMembershipTier(profileData), [profileData]);

  /** اشتراك المستخدم الحالي (إن وُجد) — يميّز كرت باقته في القائمة */
  const currentSubscription = useMemo(
    () => (token ? parseCurrentSubscription(statusData) : null),
    [token, statusData],
  );

  const isUnauthorized =
    isError && error instanceof AxiosError && error.response?.status === 401;

  const plans: PlanItem[] = useMemo(() => parsePlansList(plansData), [plansData]);

  const handleClose = () => {
    const params = new URLSearchParams(location.search);
    const from = params.get("from");
    navigate(from || "/profile", { replace: true });
  };

  const handleBuy = (plan: PlanItem) => {
    setSubscribeErrorMsg(null);

    if (typeof window !== "undefined") {
      // Next.js لا يدعم navigation state — نمرّر الباقة عبر sessionStorage
      sessionStorage.setItem("subscription_plan", JSON.stringify(plan));
    }

    // الاشتراك يلزمه حساب: كان الزائر يصل لشاشة الدفع ثم يُصدّ هناك.
    // نعيده بعد الدخول إلى الباقة نفسها لا إلى قائمة الباقات.
    if (!token) {
      navigate(
        `/login?returnUrl=${encodeURIComponent(
          `/subscription/payment?plan_id=${plan.id}`,
        )}`,
      );
      return;
    }

    navigate(`/subscription/payment?plan_id=${plan.id}`);
  };

  return (
    <>
      <Helmet>
        <title>{t("home.subscription.choosePlan")} | Mokafaat</title>
      </Helmet>

      <section className="min-h-screen bg-[linear-gradient(165deg,#1B1150_0%,#400198_60%,#6703EB_100%)] px-4 pb-14 pt-24">
        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={handleClose}
            className={`absolute top-4 ${isRTL ? "right-4" : "left-4"} flex min-h-[44px] items-center gap-2 rounded-mk-md px-3 text-white transition-colors hover:bg-white/10 ${FOCUS}`}
          >
            <IoClose className="text-2xl" />
            <span>{t("subscription.close")}</span>
          </button>

          <div className="mb-8 text-center">
            {/*
              شعار مكافآت بدل أيقونة عامة: الصفحة بلا تخطيط الموقع
              (no-layout) فلا هيدر فيها ولا شعار، والمستخدم قد يصلها
              من رابط مباشر بلا سياق يعرّفه بالمنصّة.
            */}
            <Link to="/" className="mx-auto mb-5 inline-block">
              <img
                src={LogoLight}
                alt="مكافآت"
                className="mx-auto h-11 w-auto object-contain"
              />
            </Link>
            <h1 className="mb-2 text-2xl font-bold text-white md:text-3xl">
              {t("home.subscription.choosePlan")}
            </h1>
            <p className="mx-auto max-w-xl text-sm text-white/80">
              {t("home.subscription.choosePlanDesc")}
            </p>
          </div>

          {isLoading && (
            <div
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              role="status"
              aria-label={t("home.subscription.loading")}
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-mk-xl bg-white p-6">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="mt-3 h-4 w-24" />
                  <Skeleton className="mt-5 h-9 w-28" />
                  <Skeleton className="mt-6 h-3 w-full" />
                  <Skeleton className="mt-2 h-3 w-5/6" />
                  <Skeleton className="mt-6 h-12 w-full rounded-full" />
                </div>
              ))}
            </div>
          )}

          {isUnauthorized && (
            <div className="space-y-4 rounded-mk-md border border-amber-500/50 bg-amber-500/20 p-6 text-center text-white">
              <p>{t("home.subscription.loginRequiredToViewPlans")}</p>
              <Button
                variant="accent"
                size="lg"
                className="rounded-full"
                onClick={() => navigate("/login?returnUrl=/subscription/plans")}
              >
                {t("home.subscription.goToLogin")}
              </Button>
            </div>
          )}

          {isError && !isUnauthorized && (
            <div className="rounded-mk-xl bg-white p-2">
              <ErrorState
                title={t("home.subscription.errorLoadingPlans")}
                onRetry={() => refetch()}
              />
            </div>
          )}

          {subscribeErrorMsg && (
            <div className="mb-6 flex flex-col items-center justify-center gap-3 rounded-mk-md border border-amber-500/50 bg-amber-500/20 p-4 text-center text-white sm:flex-row">
              <p className="flex-1">{subscribeErrorMsg}</p>
              <button
                type="button"
                onClick={() => setSubscribeErrorMsg(null)}
                className={`min-h-[44px] rounded-full border border-white/50 px-4 text-sm font-medium text-white transition-colors hover:bg-white/10 ${FOCUS}`}
              >
                {t("home.subscription.ok")}
              </button>
            </div>
          )}

          {!isLoading && !isError && tier && (
            <div className="mb-8">
              <MembershipTierCard tier={tier} />
            </div>
          )}

          {/* زائر بلا جلسة — لا نصمت، بل ندعوه لتسجيل الدخول ليرى اشتراكه */}
          {!isLoading && !isError && !isUnauthorized && !token && (
            <div className="mb-6 flex flex-col items-center gap-3 rounded-mk-md border border-white/25 bg-white/10 p-4 text-center text-white sm:flex-row sm:text-start">
              <IoLogInOutline className="h-6 w-6 shrink-0 text-mk-gold" aria-hidden />
              <p className="flex-1 text-sm">
                {t("subscription.guestSubscriptionHint")}
              </p>
              <Button
                variant="gold"
                size="md"
                className="rounded-full"
                onClick={() => navigate("/login?returnUrl=/subscription/plans")}
              >
                {t("subscription.guestLogin")}
              </Button>
            </div>
          )}

          {!isLoading && !isError && plans.length > 0 && (
            <div className="grid items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => {
                const isCurrent = isCurrentPlan(plan, currentSubscription);
                return (
                  <PlanCard
                    key={String(plan.id)}
                    plan={plan}
                    isRTL={!!isRTL}
                    lang={i18n.language || "ar"}
                    current={isCurrent ? currentSubscription : null}
                    statusLoading={!!token && statusLoading}
                    onBuy={() => handleBuy(plan)}
                  />
                );
              })}
            </div>
          )}

          {!isLoading && !isError && plans.length === 0 && (
            <div className="rounded-mk-xl bg-white p-2">
              <EmptyState title={t("home.subscription.noPlansAvailable")} description="" />
            </div>
          )}
        </div>
      </section>
    </>
  );
};

/** كرت باقة واحد — نفس ترتيب عناصر التطبيق */
const PlanCard: React.FC<{
  plan: RawPlan;
  isRTL: boolean;
  lang: string;
  /** غير null فقط إن كانت هذه هي باقة المستخدم الحالية */
  current: CurrentSubscription | null;
  statusLoading: boolean;
  onBuy: () => void;
}> = ({ plan, isRTL, lang, current, statusLoading, onBuy }) => {
  const { t } = useTranslation();
  const name = getPlanName(plan, isRTL);
  const pricing = getPlanPricing(plan);
  const durationLabel = getPlanDurationLabel(plan, t);
  const seats = getPlanFamilySeats(plan);
  const features = getPlanFeatures(plan, isRTL);
  const percent = getDiscountPercent(pricing);

  const isCurrent = !!current;
  const showRenew = isCurrent && needsRenewal(current);
  const isExpired = isCurrent && !current.isActive;
  const days = current?.daysRemaining ?? null;
  const endDateLabel = current?.endDate ? formatEndDate(current.endDate, lang) : null;

  return (
    <div
      className={
        isCurrent
          ? isExpired
            ? "relative flex flex-col rounded-mk-xl border-2 border-mk-red bg-[#fef5f6] p-6 pt-8 shadow-mk-hover ring-4 ring-mk-red/15"
            : "relative flex flex-col rounded-mk-xl border-2 border-mk-green bg-[#f2fbf7] p-6 pt-8 shadow-mk-hover ring-4 ring-mk-green/15"
          : "relative flex flex-col rounded-mk-xl border border-mk-border bg-white p-6 shadow-mk-raised transition-shadow hover:shadow-mk-hover"
      }
    >
      {isCurrent && (
        <span
          className={`absolute -top-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white shadow-mk-raised ${
            isRTL ? "right-5" : "left-5"
          } ${isExpired ? "bg-mk-red" : "bg-mk-green"}`}
        >
          <IoShieldCheckmark className="h-3.5 w-3.5" aria-hidden />
          {isExpired
            ? t("subscription.previousPlanBadge")
            : t("subscription.currentPlanBadge")}
        </span>
      )}

      <div className="flex items-start gap-2">
        <h2 className="min-w-0 flex-1 text-xl font-bold leading-snug text-mk-text">
          {name}
        </h2>
        {durationLabel && (
          <span className="shrink-0 rounded-full bg-mk-tint px-3 py-1 text-xs font-bold text-mk-primary">
            {durationLabel}
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="flex items-center gap-1.5 text-[32px] font-bold leading-none text-mk-primary">
          {formatPrice(pricing.final)}
          <CurrencyIcon size={19} className="text-mk-primary" />
        </span>
        {pricing.hasDiscount && (
          <>
            <span className="text-[17px] font-semibold text-mk-muted line-through decoration-2">
              {formatPrice(pricing.original)}
            </span>
            {percent > 0 && (
              <span className="rounded-full bg-mk-accent/10 px-2.5 py-1 text-xs font-bold text-mk-accent">
                {t("subscription.discountBadge").replace("{{percent}}", String(percent))}
              </span>
            )}
          </>
        )}
      </div>

      {/* سطر حالة الاشتراك الحالي */}
      {isCurrent && (endDateLabel || days !== null) && (
        <div
          className={`mt-4 space-y-1.5 rounded-mk-md border px-3 py-2.5 ${
            isExpired
              ? "border-mk-red/25 bg-mk-red/10"
              : showRenew
                ? "border-mk-gold/40 bg-mk-gold/10"
                : "border-mk-green/25 bg-mk-green/10"
          }`}
        >
          {endDateLabel && (
            <p
              className={`flex items-center gap-2 text-[13px] font-bold ${
                isExpired ? "text-mk-red" : "text-mk-green"
              }`}
            >
              <IoTimeOutline className="h-4 w-4 shrink-0" aria-hidden />
              {(isExpired
                ? t("subscription.subscriptionEndedOn")
                : t("subscription.activeUntil")
              ).replace("{{date}}", endDateLabel)}
            </p>
          )}
          {!isExpired && days !== null && days >= 0 && (
            <p
              className={`flex items-center gap-2 text-[13px] font-semibold ${
                showRenew ? "text-mk-amber" : "text-mk-text-strong"
              }`}
            >
              <IoAlertCircleOutline className="h-4 w-4 shrink-0" aria-hidden />
              {t("subscription.daysRemaining").replace("{{count}}", String(days))}
              {showRenew ? ` — ${t("subscription.expiringSoon")}` : ""}
            </p>
          )}
        </div>
      )}

      {seats > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-mk-md border border-mk-accent/25 bg-mk-accent/10 px-3 py-2.5">
          <IoPeopleOutline className="h-[18px] w-[18px] shrink-0 text-mk-accent" aria-hidden />
          <span className="text-[13px] font-bold text-mk-accent">
            {t("subscription.familyMembersUpTo").replace("{{count}}", String(seats))}
          </span>
        </div>
      )}

      {features.length > 0 && (
        <div className="mt-4 flex-1 border-t border-mk-divider pt-3">
          <p className="mb-2 text-[13px] font-bold text-mk-muted">
            {t("subscription.features")}
          </p>
          <ul className="space-y-2">
            {features.map((f, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-[13px] leading-relaxed text-mk-text-strong"
              >
                <IoCheckmarkCircle
                  aria-hidden
                  className="mt-0.5 h-4 w-4 shrink-0 text-mk-green"
                />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {isCurrent && !showRenew ? (
        <Button
          variant="soft"
          size="lg"
          block
          disabled
          icon={<IoShieldCheckmark className="h-4 w-4" aria-hidden />}
          className="mt-6 rounded-full !bg-mk-green/15 !text-mk-green"
        >
          {t("subscription.currentPlanBadge")}
        </Button>
      ) : (
        <Button
          variant="accent"
          size="lg"
          block
          loading={statusLoading}
          className="mt-6 rounded-full"
          onClick={onBuy}
        >
          {showRenew ? t("subscription.renewSubscription") : t("home.subscription.buy")}
        </Button>
      )}
    </div>
  );
};

export default SubscriptionPlansPage;
