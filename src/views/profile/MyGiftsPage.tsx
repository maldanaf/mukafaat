"use client";

import React, { useMemo } from "react";
import { Navigate } from "@/lib/router-compat";
import { Helmet } from "@/lib/helmet-compat";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@hooks";
import { useUserStore } from "@stores/userStore";
import { useHydrated } from "@hooks/useHydrated";
import { useMyGifts } from "@hooks/api/useMokafaatQueries";
import { Button } from "@ui";
import CurrencyIcon from "@components/CurrencyIcon";
import { formatPrice } from "@utils/subscriptionPricing";
import { IoGiftOutline, IoReceiptOutline, IoPersonOutline } from "react-icons/io5";
import {
  AccountEmpty,
  AccountLoading,
  AccountPageHead,
  AccountPanel,
  IconBox,
  StatusBadge,
} from "./components/AccountKit";

interface GiftItem {
  id: number | string;
  plan_name?: string | null;
  price?: number;
  status?: string;
  payment_status?: string;
  start_date?: string | null;
  end_date?: string | null;
  recipient?: { name?: string; phone?: string } | null;
  invoice?: { invoice_number?: string } | null;
}

function parseGifts(payload: unknown): GiftItem[] {
  const raw = payload as Record<string, unknown> | undefined;
  if (!raw) return [];
  const data = (raw.data ?? raw) as Record<string, unknown>;
  const list = data.gifts ?? raw.gifts ?? data;
  return Array.isArray(list) ? (list as GiftItem[]) : [];
}

/** قائمة الاشتراكات التي أهداها المستخدم لآخرين + رابط فاتورة كل واحد */
const MyGiftsPage: React.FC = () => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const hydrated = useHydrated();
  const user = useUserStore((s) => s.user);
  const { data, isLoading } = useMyGifts(!!user);
  const gifts = useMemo(() => parseGifts(data), [data]);

  if (!hydrated) return <AccountLoading rows={3} />;

  if (!user) {
    return (
      <Navigate
        to={`/login?returnUrl=${encodeURIComponent("/profile/gifts")}`}
        replace
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>{t("giftSubscription.gifts_title")}</title>
      </Helmet>

      <div className="space-y-5" dir={isRTL ? "rtl" : "ltr"}>
        <AccountPageHead
          title={t("giftSubscription.gifts_title")}
          subtitle={t("account.gifts_subtitle", "الاشتراكات التي أهديتها وفواتيرها")}
          icon={<IoGiftOutline />}
          tint="pink"
          actions={
            <Button to="/profile/subscribe-for-other" size="sm" variant="accent">
              {t("profileDashboard.menu_subscribe_other")}
            </Button>
          }
        />

        <AccountPanel
          title={t("giftSubscription.gifts_title")}
          icon={<IoGiftOutline />}
          tint="pink"
          flush
        >
          {isLoading ? (
            <div className="p-4 sm:p-5">
              <AccountLoading rows={3} />
            </div>
          ) : gifts.length === 0 ? (
            <div className="p-4 sm:p-5">
              <AccountEmpty
                icon={<IoGiftOutline />}
                title={t("giftSubscription.gifts_empty")}
                actionLabel={t("profileDashboard.menu_subscribe_other")}
                actionTo="/profile/subscribe-for-other"
              />
            </div>
          ) : (
            <ul className="m-0 list-none divide-y divide-mk-divider p-0">
              {gifts.map((gift) => (
                <li
                  key={String(gift.id)}
                  className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <IconBox tint="pink" size="md">
                      <IoPersonOutline className="h-[19px] w-[19px]" />
                    </IconBox>
                    <div className="min-w-0">
                      <p className="m-0 truncate text-[14px] font-bold text-mk-text">
                        {gift.recipient?.name || gift.recipient?.phone || "—"}
                      </p>
                      <p className="m-0 mt-0.5 truncate text-[12px] text-mk-muted">
                        {gift.plan_name || "—"}
                        {gift.end_date ? ` · ${gift.end_date}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2.5">
                    {gift.status && (
                      <StatusBadge
                        status={gift.status}
                        label={
                          String(gift.status).toLowerCase() === "active"
                            ? t("family.status_active")
                            : String(gift.status).toLowerCase() === "pending"
                              ? t("family.status_pending")
                              : t("family.status_inactive")
                        }
                      />
                    )}
                    <span className="inline-flex items-center gap-1 rounded-full bg-mk-warm-tint px-2.5 py-1 text-[12.5px] font-bold text-mk-accent-dark">
                      {formatPrice(Number(gift.price ?? 0))}
                      <CurrencyIcon className="text-mk-accent-dark" size={11} />
                    </span>
                    <Button
                      to={`/profile/gifts/${gift.id}`}
                      variant="outline"
                      size="sm"
                      icon={<IoReceiptOutline />}
                    >
                      {t("giftSubscription.view_invoice")}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AccountPanel>
      </div>
    </>
  );
};

export default MyGiftsPage;
