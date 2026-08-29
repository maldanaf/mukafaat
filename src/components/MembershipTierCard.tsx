"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@hooks";
import { IoTrendingUpOutline } from "react-icons/io5";
import TierIcon from "@components/account/TierIcon";
import CurrencyIcon from "@components/CurrencyIcon";
import { formatPrice, type MembershipTier } from "@utils/subscriptionPricing";

interface Props {
  tier: MembershipTier | null | undefined;
  className?: string;
}

/**
 * بطاقة «مستوى العضوية»: المستوى الحالي ومميزاته
 * (خصم التجديد وخصم الاشتراك الجديد) والتقدّم للمستوى التالي.
 * لا تُعرض إطلاقاً عند غياب بيانات المستوى من الـ API.
 */
const MembershipTierCard: React.FC<Props> = ({ tier, className = "" }) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();

  if (!tier || !tier.name) return null;

  const color = tier.color && /^#([0-9a-f]{3}){1,2}$/i.test(tier.color)
    ? tier.color
    : "#400198";

  const next = tier.next;
  const hasProgress =
    !!next && (next.minPaidOrders > 0 || next.minSpend > 0);

  const ordersPct =
    next && next.minPaidOrders > 0
      ? Math.min(100, Math.round((next.currentOrders / next.minPaidOrders) * 100))
      : 0;
  const spendPct =
    next && next.minSpend > 0
      ? Math.min(100, Math.round((next.currentSpend / next.minSpend) * 100))
      : 0;
  const progressPct = Math.max(ordersPct, spendPct);

  return (
    <div
      className={`rounded-mk-xl border border-mk-border bg-white shadow-mk-card overflow-hidden ${className}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div
        className="flex items-center gap-3 px-5 py-4 text-white"
        style={{
          backgroundImage: `linear-gradient(135deg, ${color} 0%, rgba(0,0,0,0.35) 220%)`,
        }}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15">
          <TierIcon icon={tier.icon} className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs opacity-80">{t("membershipTier.title")}</p>
          <p className="truncate text-lg font-bold">{tier.name}</p>
        </div>
        {tier.level > 0 && (
          <span className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            {t("membershipTier.level")} {tier.level}
          </span>
        )}
      </div>

      <div className="space-y-4 px-5 py-4">
        {tier.description && (
          <p className="text-sm leading-relaxed text-mk-muted">
            {tier.description}
          </p>
        )}

        {/* مميزات المستوى: خصم التجديد وخصم الاشتراك الجديد */}
        <div>
          <p className="mb-2 text-xs font-semibold text-mk-muted">
            {t("membershipTier.benefits")}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-mk-md border border-mk-divider bg-mk-tint3 px-3 py-2.5">
              <p className="text-xs text-mk-muted">
                {t("membershipTier.renewal_discount")}
              </p>
              <p className="text-base font-bold text-[#400198]">
                {tier.renewalDiscountPercent > 0
                  ? t("membershipTier.percent_off", {
                      percent: formatPrice(tier.renewalDiscountPercent),
                    })
                  : t("membershipTier.no_discount")}
              </p>
            </div>
            <div className="rounded-mk-md border border-mk-divider bg-mk-tint3 px-3 py-2.5">
              <p className="text-xs text-mk-muted">
                {t("membershipTier.new_subscription_discount")}
              </p>
              <p className="text-base font-bold text-[#400198]">
                {tier.newSubscriptionDiscountPercent > 0
                  ? t("membershipTier.percent_off", {
                      percent: formatPrice(tier.newSubscriptionDiscountPercent),
                    })
                  : t("membershipTier.no_discount")}
              </p>
            </div>
          </div>
          {tier.newSubscriptionDiscountPercent > 0 && (
            <p className="mt-1.5 text-[11px] text-mk-faint">
              {t("membershipTier.gift_discount")}:{" "}
              {t("membershipTier.percent_off", {
                percent: formatPrice(tier.newSubscriptionDiscountPercent),
              })}
            </p>
          )}
        </div>

        {/* التقدّم للمستوى التالي */}
        {hasProgress ? (
          <div className="rounded-mk-md border border-mk-divider bg-white px-3 py-3">
            <div className="mb-2 flex items-center gap-2">
              <IoTrendingUpOutline className="h-4 w-4 text-[#fd671a]" />
              <p className="text-sm font-semibold text-mk-text">
                {t("membershipTier.next_tier", { tier: next!.name })}
              </p>
            </div>
            <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-mk-tint2">
              <div
                className="h-full rounded-full bg-[#fd671a] transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-mk-muted">
              {next!.minPaidOrders > 0 && (
                <span>
                  {t("membershipTier.remaining_orders", {
                    count: next!.remainingOrders,
                  })}
                </span>
              )}
              {next!.minSpend > 0 && (
                <span className="inline-flex items-center gap-1">
                  {t("membershipTier.remaining_spend", {
                    amount: formatPrice(next!.remainingSpend),
                  })}
                  <CurrencyIcon className="text-mk-muted" size={11} />
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="rounded-mk-md bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700">
            {t("membershipTier.highest_tier")}
          </p>
        )}

        {/* أرقام التقييم الحالية */}
        {(tier.currentOrders != null || tier.currentSpend != null) && (
          <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-mk-divider pt-3 text-xs text-mk-muted">
            <span>
              {t("membershipTier.current_orders")}: {tier.currentOrders ?? 0}
            </span>
            <span className="inline-flex items-center gap-1">
              {t("membershipTier.current_spend")}:{" "}
              {formatPrice(tier.currentSpend ?? 0)}
              <CurrencyIcon className="text-mk-faint" size={10} />
            </span>
            {!!tier.evaluationMonths && (
              <span>
                {t("membershipTier.evaluation_period", {
                  months: tier.evaluationMonths,
                })}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MembershipTierCard;
