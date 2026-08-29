"use client";

import React, { useMemo, useState } from "react";
import { Navigate } from "@/lib/router-compat";
import { Helmet } from "@/lib/helmet-compat";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@hooks";
import { useUserStore } from "@stores/userStore";
import { useHydrated } from "@hooks/useHydrated";
import { useShareSheetStore } from "@stores/shareSheetStore";
import { useReferrals, useReferralRewards } from "@hooks/api/useMokafaatQueries";
import { Button, ShareIcon, FOCUS } from "@ui";
import CurrencyIcon from "@components/CurrencyIcon";
import { formatPrice } from "@utils/subscriptionPricing";
import {
  IoCopyOutline,
  IoCheckmarkCircle,
  IoGiftOutline,
  IoPeopleOutline,
  IoTrophyOutline,
} from "react-icons/io5";
import {
  AccountEmpty,
  AccountError,
  AccountLoading,
  AccountPageHead,
  AccountPanel,
  AccountProgress,
  AccountStat,
  IconBox,
  StatusBadge,
} from "./components/AccountKit";

interface RewardCoupon {
  code?: string;
  discount_percent?: number;
  max_discount_amount?: number;
  end_date?: string | null;
  is_used?: boolean;
  is_expired?: boolean;
}

interface RewardItem {
  id: number | string;
  role?: string;
  type?: string;
  status?: string;
  months?: number;
  amount?: number;
  referrals_count?: number;
  granted_at?: string | null;
  applied_at?: string | null;
  coupon?: RewardCoupon | null;
  title_ar?: string | null;
}

interface InviteItem {
  id: number | string;
  name?: string | null;
  phone?: string | null;
  status?: string;
  created_at?: string | null;
}

interface ReferralData {
  enabled?: boolean;
  code?: string | null;
  link?: string | null;
  required_count?: number;
  signups_count?: number;
  qualified_count?: number;
  pending_count?: number;
  progress?: number;
  remaining?: number;
  rewards_earned?: number;
  rewards?: RewardItem[];
  invites?: InviteItem[];
  referrer_reward?: Record<string, unknown> | null;
  referee_reward?: Record<string, unknown> | null;
}

function parseReferral(payload: unknown): ReferralData | null {
  const raw = payload as Record<string, unknown> | undefined;
  if (!raw) return null;
  const data = (raw.data ?? raw) as Record<string, unknown>;
  const referral = (data.referral ?? data) as Record<string, unknown> | undefined;
  if (!referral || typeof referral !== "object") return null;
  return referral as ReferralData;
}

function parseRewards(payload: unknown): RewardItem[] {
  const raw = payload as Record<string, unknown> | undefined;
  if (!raw) return [];
  const data = (raw.data ?? raw) as Record<string, unknown>;
  const list = data.rewards ?? raw.rewards ?? data;
  return Array.isArray(list) ? (list as RewardItem[]) : [];
}

/** نص المكافأة حسب نوعها (شهور مجانية / كاش باك / كوبون) */
function useRewardTitle() {
  const { t } = useTranslation();
  return (reward: RewardItem): string => {
    const type = String(reward.type ?? "");
    if (type === "coupon") {
      return t("referrals.reward_coupon", {
        percent: formatPrice(Number(reward.coupon?.discount_percent ?? 0)),
      });
    }
    if (type === "cashback" || type === "wallet_credit") {
      return t("referrals.reward_cashback", {
        amount: formatPrice(Number(reward.amount ?? 0)),
      });
    }
    return t("referrals.reward_months", { count: Number(reward.months ?? 0) });
  };
}

/** نص المكافأة الموعودة من إعدادات البرنامج (`referrer_reward` / `referee_reward`) */
function usePromisedRewardTitle() {
  const { t } = useTranslation();
  return (reward: Record<string, unknown> | null | undefined): string | null => {
    if (!reward || reward.enabled === false) return null;
    const type = String(reward.type ?? "");
    if (type === "coupon") {
      return t("referrals.reward_coupon", {
        percent: formatPrice(Number(reward.coupon_percent ?? 0)),
      });
    }
    if (type === "cashback" || type === "wallet_credit") {
      return t("referrals.reward_cashback", {
        amount: formatPrice(Number(reward.cashback_amount ?? 0)),
      });
    }
    return t("referrals.reward_months", { count: Number(reward.months ?? 0) });
  };
}

/** صفحة «شارك واربح»: الكود والرابط والتقدّم نحو الهدف والمكافآت المستلمة */
const ReferralsPage: React.FC = () => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const hydrated = useHydrated();
  const user = useUserStore((s) => s.user);
  const openShare = useShareSheetStore((s) => s.openShare);
  const rewardTitle = useRewardTitle();
  const promisedRewardTitle = usePromisedRewardTitle();

  const { data, isLoading, isError } = useReferrals(!!user);
  const { data: rewardsData } = useReferralRewards(!!user);

  const referral = useMemo(() => parseReferral(data), [data]);
  const rewards = useMemo(() => {
    const fromEndpoint = parseRewards(rewardsData);
    return fromEndpoint.length ? fromEndpoint : referral?.rewards ?? [];
  }, [rewardsData, referral]);

  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  const copy = (value: string, which: "code" | "link") => {
    try {
      void navigator.clipboard.writeText(value);
      setCopied(which);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* المتصفح قد يمنع الحافظة — نتجاهل بصمت */
    }
  };

  if (!hydrated) return <AccountLoading hero rows={3} />;

  if (!user) {
    return (
      <Navigate
        to={`/login?returnUrl=${encodeURIComponent("/profile/referrals")}`}
        replace
      />
    );
  }

  const required = Number(referral?.required_count ?? 0);
  const progress = Number(referral?.progress ?? 0);
  const remaining = Number(referral?.remaining ?? 0);
  const progressPct =
    required > 0 ? Math.min(100, Math.round((progress / required) * 100)) : 0;

  const myReward = promisedRewardTitle(referral?.referrer_reward);
  const friendReward = promisedRewardTitle(referral?.referee_reward);

  return (
    <>
      <Helmet>
        <title>{t("referrals.meta_title")} | Mokafaat</title>
      </Helmet>

      <div className="space-y-5" dir={isRTL ? "rtl" : "ltr"}>
        <AccountPageHead
          title={t("referrals.title")}
          subtitle={t("referrals.subtitle")}
          icon={<ShareIcon />}
          tint="teal"
        />

        {isLoading && <AccountLoading hero rows={3} />}

        {!isLoading && (isError || !referral) && (
          <AccountError description={t("referrals.load_error")} />
        )}

        {!isLoading && referral && referral.enabled === false && (
          <AccountEmpty
            icon={<IoGiftOutline />}
            title={t("referrals.title")}
            description={t("referrals.disabled")}
          />
        )}

        {!isLoading && referral && referral.enabled !== false && (
          <>
            {/* ===== كرت الدعوة البارز: الكود + الرابط ===== */}
            {(referral.code || referral.link) && (
              <section className="relative isolate overflow-hidden rounded-mk-2xl bg-grad-brand-deep p-5 text-white shadow-mk-glow sm:p-6">
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-20 end-[-50px] h-48 w-48 rounded-full bg-mk-accent/35 blur-3xl"
                />
                <div className="relative space-y-4">
                  <p className="m-0 text-[12.5px] font-bold tracking-wide text-mk-lilac">
                    {t("referrals.your_code")}
                  </p>

                  {referral.code && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex-1 select-all rounded-mk-md border-2 border-dashed border-white/40 bg-white/10 px-4 py-3.5 text-center text-[22px] font-bold tracking-[0.25em] backdrop-blur-sm">
                        {referral.code}
                      </span>
                      <Button
                        size="md"
                        variant="accent"
                        className="shrink-0 mk-shine"
                        icon={
                          copied === "code" ? <IoCheckmarkCircle /> : <IoCopyOutline />
                        }
                        onClick={() => copy(String(referral.code), "code")}
                      >
                        {copied === "code" ? t("referrals.copied") : t("referrals.copy")}
                      </Button>
                    </div>
                  )}

                  {referral.link && (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <span
                        className="min-w-0 flex-1 truncate rounded-mk-md border border-white/20 bg-white/10 px-4 py-3 text-[12.5px] backdrop-blur-sm"
                        dir="ltr"
                      >
                        {referral.link}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => copy(String(referral.link), "link")}
                          className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-mk-md border border-white/25 bg-white/10 px-4 text-[13px] font-semibold backdrop-blur-sm transition-colors hover:bg-white/20 ${FOCUS}`}
                        >
                          {copied === "link" ? (
                            <IoCheckmarkCircle className="h-4 w-4" />
                          ) : (
                            <IoCopyOutline className="h-4 w-4" />
                          )}
                          {copied === "link" ? t("referrals.copied") : t("referrals.copy")}
                        </button>
                        <Button
                          size="md"
                          className="shrink-0 bg-white text-mk-primary hover:bg-white/90"
                          icon={<ShareIcon size={16} />}
                          onClick={() =>
                            openShare({
                              url: String(referral.link),
                              title: t("referrals.title"),
                              text: t("referrals.subtitle"),
                            })
                          }
                        >
                          {t("referrals.share")}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* المكافأة الموعودة لي ولصديقي */}
                  {(myReward || friendReward) && (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {myReward && (
                        <div className="rounded-mk-md border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
                          <p className="m-0 text-[11px] text-mk-lilac">
                            {t("referrals.my_reward")}
                          </p>
                          <p className="m-0 mt-0.5 text-[13.5px] font-bold">{myReward}</p>
                        </div>
                      )}
                      {friendReward && (
                        <div className="rounded-mk-md border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
                          <p className="m-0 text-[11px] text-mk-lilac">
                            {t("referrals.friend_reward")}
                          </p>
                          <p className="m-0 mt-0.5 text-[13.5px] font-bold text-mk-accent-light">
                            {friendReward}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ===== التقدّم نحو الهدف ===== */}
            {required > 0 && (
              <AccountPanel
                title={t("referrals.progress_title")}
                icon={<IoTrophyOutline />}
                tint="amber"
                action={
                  <span className="text-[13px] font-bold text-mk-primary">
                    {t("referrals.progress_value", { progress, required })}
                  </span>
                }
              >
                <AccountProgress percent={progressPct} tone="accent" />
                <p className="m-0 mt-2.5 text-[12px] font-semibold text-mk-muted">
                  {remaining > 0
                    ? t("referrals.remaining", { count: remaining })
                    : t("referrals.goal_reached")}
                </p>
              </AccountPanel>
            )}

            {/* ===== أرقام سريعة ===== */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <AccountStat
                tint="purple"
                label={t("referrals.signups")}
                value={referral.signups_count ?? 0}
              />
              <AccountStat
                tint="teal"
                label={t("referrals.qualified")}
                value={referral.qualified_count ?? 0}
              />
              <AccountStat
                tint="amber"
                label={t("referrals.pending")}
                value={referral.pending_count ?? 0}
              />
              <AccountStat
                tint="orange"
                label={t("referrals.rewards_count")}
                value={referral.rewards_earned ?? rewards.length}
              />
            </div>
          </>
        )}

        {/* ===== المكافآت المستلمة ===== */}
        <AccountPanel
          title={t("referrals.rewards_title")}
          icon={<IoGiftOutline />}
          tint="pink"
          flush
        >
          {rewards.length === 0 ? (
            <div className="p-4 sm:p-5">
              <AccountEmpty
                icon={<IoGiftOutline />}
                title={t("referrals.no_rewards")}
                description=""
              />
            </div>
          ) : (
            <ul className="m-0 list-none divide-y divide-mk-divider p-0">
              {rewards.map((reward) => {
                const status = String(reward.status ?? "");
                const statusLabel =
                  status === "applied"
                    ? t("referrals.reward_status_applied")
                    : status === "pending"
                      ? t("referrals.reward_status_pending")
                      : t("referrals.reward_status_granted");
                return (
                  <li key={String(reward.id)} className="flex gap-3 px-4 py-4 sm:px-5">
                    <IconBox tint="pink" size="md">
                      <IoGiftOutline className="h-[19px] w-[19px]" />
                    </IconBox>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="m-0 text-[13.5px] font-bold text-mk-text">
                          {rewardTitle(reward)}
                        </p>
                        <StatusBadge status={status} label={statusLabel} />
                      </div>
                      {reward.coupon?.code && (
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11.5px] text-mk-muted">
                          <span className="rounded-mk-sm border border-dashed border-mk-border-strong bg-mk-tint3 px-2 py-1 font-mono font-bold text-mk-primary">
                            {reward.coupon.code}
                          </span>
                          {reward.coupon.end_date && (
                            <span>
                              {t("referrals.reward_valid_until", {
                                date: reward.coupon.end_date,
                              })}
                            </span>
                          )}
                          {reward.coupon.is_used && (
                            <span className="font-semibold text-mk-amber">
                              {t("referrals.reward_used")}
                            </span>
                          )}
                          {reward.coupon.is_expired && (
                            <span className="font-semibold text-mk-red">
                              {t("referrals.reward_expired")}
                            </span>
                          )}
                          {!!reward.coupon.max_discount_amount && (
                            <span className="inline-flex items-center gap-1">
                              {formatPrice(reward.coupon.max_discount_amount)}
                              <CurrencyIcon className="text-mk-muted" size={10} />
                            </span>
                          )}
                        </div>
                      )}
                      {reward.granted_at && (
                        <p className="m-0 mt-1 text-[11px] text-mk-faint">
                          {reward.granted_at}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </AccountPanel>

        {/* ===== من دعوتهم ===== */}
        {!!referral?.invites?.length && (
          <AccountPanel
            title={t("referrals.invites_title")}
            icon={<IoPeopleOutline />}
            tint="blue"
            flush
          >
            <ul className="m-0 list-none divide-y divide-mk-divider p-0">
              {referral.invites.map((invite) => (
                <li
                  key={String(invite.id)}
                  className="flex items-center gap-3 px-4 py-3 sm:px-5"
                >
                  <IconBox tint="blue" size="sm">
                    <IoPeopleOutline className="h-[17px] w-[17px]" />
                  </IconBox>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate text-[13.5px] font-semibold text-mk-text">
                      {invite.name || invite.phone || "—"}
                    </p>
                    {invite.created_at && (
                      <p className="m-0 text-[11px] text-mk-faint">{invite.created_at}</p>
                    )}
                  </div>
                  <StatusBadge
                    status={invite.status === "pending" ? "pending" : "qualified"}
                    label={
                      invite.status === "pending"
                        ? t("referrals.invite_status_pending")
                        : t("referrals.invite_status_qualified")
                    }
                  />
                </li>
              ))}
            </ul>
          </AccountPanel>
        )}
      </div>
    </>
  );
};

export default ReferralsPage;
