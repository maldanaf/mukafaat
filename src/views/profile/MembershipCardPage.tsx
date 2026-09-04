"use client";

import React, { useMemo, useState } from "react";
import { Navigate } from "@/lib/router-compat";
import { Helmet } from "@/lib/helmet-compat";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@hooks";
import { toast } from "react-toastify";
import { useUserStore } from "@stores/userStore";
import { useHydrated } from "@hooks/useHydrated";
import { useProfile } from "@hooks/api/useMokafaatQueries";
import { parseMembershipTier } from "@utils/subscriptionPricing";
import MembershipCard from "@components/account/MembershipCard";
import MembershipTierCard from "@components/MembershipTierCard";
import { Button, ShareIcon, Skeleton } from "@ui";
import {
  IoCopyOutline,
  IoLinkOutline,
  IoCardOutline,
  IoSparklesOutline,
} from "react-icons/io5";
import {
  AccountError,
  AccountLoading,
  AccountPageHead,
  AccountPanel,
  AccountUpsell,
} from "./components/AccountKit";

interface ProfileUser {
  first_name?: string;
  last_name?: string;
  name?: string;
  id_number?: string;
  membership_number?: string;
  membership_qr_url?: string | null;
  membership_barcode_url?: string | null;
  membership_verify_url?: string | null;
  has_subscription?: boolean;
  subscription?: { status?: string } | null;
}

function parseProfileUser(payload: unknown): ProfileUser | null {
  const raw = payload as Record<string, unknown> | undefined;
  if (!raw) return null;
  const data = (raw.data ?? raw) as Record<string, unknown> | undefined;
  const userObj = (data?.user ?? data) as ProfileUser | undefined;
  return userObj ?? null;
}

async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* fallback below */
  }
  try {
    const el = document.createElement("textarea");
    el.value = value;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

/**
 * صفحة «بطاقتي والمستويات» (‎/profile/card):
 * البطاقة التعريفية (رقم العضوية + QR) ومستوى العضوية ومميزاته
 * والتقدّم للمستوى التالي — نفس شاشة «بطاقتي» في التطبيق.
 */
const MembershipCardPage: React.FC = () => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const hydrated = useHydrated();
  const user = useUserStore((s) => s.user);
  const [copied, setCopied] = useState<"number" | "link" | null>(null);

  const { data, isLoading, isError, refetch } = useProfile();
  const profileUser = useMemo(() => parseProfileUser(data), [data]);
  const tier = useMemo(() => parseMembershipTier(data), [data]);

  if (!hydrated) {
    return <Skeleton className="h-72 w-full rounded-mk-xl" />;
  }

  if (!user) {
    return (
      <Navigate
        to={`/login?returnUrl=${encodeURIComponent("/profile/card")}`}
        replace
      />
    );
  }

  const membershipNumber = String(profileUser?.membership_number ?? "").trim();
  const verifyUrl = String(profileUser?.membership_verify_url ?? "").trim();
  const fullName =
    [profileUser?.first_name, profileUser?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    profileUser?.name ||
    user.name ||
    "";
  const isActive =
    Boolean(profileUser?.has_subscription) &&
    String(profileUser?.subscription?.status ?? "").toLowerCase() === "active";

  const handleCopy = async (value: string, kind: "number" | "link") => {
    if (!value) return;
    const ok = await copyText(value);
    if (!ok) return;
    setCopied(kind);
    toast.success(t("membershipCard.copied"));
    window.setTimeout(() => setCopied(null), 2000);
  };

  const handleShare = async () => {
    const shareUrl = verifyUrl || membershipNumber;
    if (!shareUrl) return;
    const nav = navigator as Navigator & {
      share?: (d: { title?: string; text?: string; url?: string }) => Promise<void>;
    };
    if (nav.share) {
      try {
        await nav.share({
          title: t("membershipCard.title"),
          text: `${t("membershipCard.number_label")}: ${membershipNumber}`,
          url: verifyUrl || undefined,
        });
        return;
      } catch {
        /* المستخدم ألغى المشاركة */
      }
    }
    void handleCopy(shareUrl, "link");
  };

  return (
    <>
      <Helmet>
        <title>{t("membershipCard.meta_title")}</title>
      </Helmet>

      <div className="space-y-5" dir={isRTL ? "rtl" : "ltr"}>
        <AccountPageHead
          title={t("membershipCard.title")}
          subtitle={t("membershipCard.subtitle")}
          icon={<IoCardOutline />}
          tint="violet"
        />

        {isLoading && <AccountLoading hero rows={3} />}

        {!isLoading && isError && (
          <AccountError
            description={t("membershipCard.load_error")}
            onRetry={() => void refetch()}
          />
        )}

        {!isLoading && !isError && !membershipNumber && (
          <AccountUpsell
            icon={<IoSparklesOutline />}
            title={t("membershipCard.no_membership")}
            description={t(
              "account.card_upsell_desc",
              "اشترك لتحصل على بطاقة عضوية رقمية برقم خاص و‑QR يُقرأ لدى التجّار.",
            )}
            ctaLabel={t("membershipCard.subscribe_cta")}
            to="/subscription/plans"
          />
        )}

        {!isLoading && !isError && membershipNumber && (
          <>
            <MembershipCard
              fullName={fullName}
              membershipNumber={membershipNumber}
              idNumber={String(profileUser?.id_number ?? "").trim()}
              isActive={isActive}
              membershipQrUrl={profileUser?.membership_qr_url ?? undefined}
              membershipBarcodeUrl={profileUser?.membership_barcode_url ?? undefined}
            />

            <AccountPanel
              title={t("account.card_actions", "مشاركة البطاقة")}
              subtitle={t("membershipCard.number_label")}
              icon={<ShareIcon />}
              tint="teal"
            >
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<IoCopyOutline />}
                  onClick={() => void handleCopy(membershipNumber, "number")}
                >
                  {copied === "number"
                    ? t("membershipCard.copied")
                    : t("membershipCard.copy_number")}
                </Button>
                {verifyUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<IoLinkOutline />}
                    onClick={() => void handleCopy(verifyUrl, "link")}
                  >
                    {copied === "link"
                      ? t("membershipCard.copied")
                      : t("membershipCard.copy_link")}
                  </Button>
                )}
                <Button
                  variant="accent"
                  size="sm"
                  icon={<ShareIcon />}
                  onClick={() => void handleShare()}
                >
                  {t("membershipCard.share")}
                </Button>
              </div>
            </AccountPanel>

            {tier ? (
              <MembershipTierCard tier={tier} />
            ) : (
              <AccountPanel
                title={t("membershipTier.title")}
                icon={<IoSparklesOutline />}
                tint="amber"
              >
                <p className="m-0 text-center text-[13px] text-mk-muted">
                  {t("membershipTier.none")}
                </p>
              </AccountPanel>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default MembershipCardPage;
