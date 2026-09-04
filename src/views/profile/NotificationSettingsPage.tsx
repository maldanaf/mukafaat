"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Navigate } from "@/lib/router-compat";
import { Helmet } from "@/lib/helmet-compat";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@hooks";
import { toast } from "react-toastify";
import { useUserStore } from "@stores/userStore";
import { useHydrated } from "@hooks/useHydrated";
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from "@hooks/api/useMokafaatQueries";
import { Button, FOCUS } from "@ui";
import {
  IoNotificationsOutline,
  IoArrowBack,
  IoPricetagsOutline,
  IoChatbubbleEllipsesOutline,
} from "react-icons/io5";
import {
  AccountError,
  AccountLoading,
  AccountPageHead,
  AccountPanel,
  type TintName,
} from "./components/AccountKit";

/**
 * مفاتيح `/api/settings/notifications` التي يحفظها الباك-إند فعلاً
 * (`SettingsController::updateNotifications`). ترتيبها كترتيب شاشة التطبيق.
 */
const KEYS = [
  "app_notifications",
  "new_offers",
  "discount_offers",
  "trip_offers",
  "shopping_sections_offers",
  "offers_and_alerts",
  "email_newsletters",
  "sms_notifications",
  "whatsapp_notifications",
] as const;

type SettingKey = (typeof KEYS)[number];

/** المفتاح الرئيس: إطفاؤه/تشغيله يطبّق على الباقي (نفس `_onToggle` في التطبيق) */
const MASTER: SettingKey = "app_notifications";

/** مجموعات العرض على الويب — نفس عناوين التطبيق */
const GROUPS: {
  titleKey: string;
  keys: SettingKey[];
  icon: React.ReactNode;
  tint: TintName;
}[] = [
  {
    titleKey: "notificationSettings.group_general",
    keys: ["app_notifications"],
    icon: <IoNotificationsOutline />,
    tint: "purple",
  },
  {
    titleKey: "notificationSettings.group_offers",
    keys: [
      "new_offers",
      "discount_offers",
      "trip_offers",
      "shopping_sections_offers",
      "offers_and_alerts",
    ],
    icon: <IoPricetagsOutline />,
    tint: "orange",
  },
  {
    titleKey: "notificationSettings.group_channels",
    keys: ["email_newsletters", "sms_notifications", "whatsapp_notifications"],
    icon: <IoChatbubbleEllipsesOutline />,
    tint: "teal",
  },
];

type SettingsState = Record<SettingKey, boolean>;

const EMPTY: SettingsState = KEYS.reduce(
  (acc, k) => ({ ...acc, [k]: false }),
  {} as SettingsState,
);

function parseSettings(payload: unknown): SettingsState | null {
  const raw = (payload ?? {}) as Record<string, unknown>;
  const data = (raw.data ?? raw) as Record<string, unknown>;
  const notif = (data.notifications ?? data) as Record<string, unknown>;
  if (!notif || typeof notif !== "object") return null;
  const out = { ...EMPTY };
  KEYS.forEach((k) => {
    out[k] = Boolean(notif[k]);
  });
  return out;
}

/** مفتاح تبديل مطابق لسويتش التطبيق (زر ARIA بدل checkbox ليعمل في الاتجاهين) */
const Toggle: React.FC<{
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, checked, disabled, onChange }) => (
  <div
    className={`flex min-h-[56px] items-center justify-between gap-4 px-4 py-3 transition-colors sm:px-5 ${
      disabled ? "opacity-50" : "hover:bg-mk-tint3"
    }`}
  >
    <span className="text-[13.5px] font-semibold text-mk-text">{label}</span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-all duration-200 ${FOCUS} ${
        checked
          ? "bg-grad-brand shadow-[0_6px_14px_-6px_rgba(64,1,152,0.8)]"
          : "bg-mk-border-strong"
      } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        aria-hidden
        className="absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-200"
        style={{ insetInlineStart: checked ? 24 : 4 }}
      />
    </button>
  </div>
);

/**
 * صفحة «إعدادات الإشعارات» (‎/profile/notifications/settings)
 * مربوطة بـ GET/POST `/api/settings/notifications`.
 */
const NotificationSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const hydrated = useHydrated();
  const user = useUserStore((s) => s.user);

  const { data, isLoading, isError, refetch } = useNotificationSettings(!!user);
  const update = useUpdateNotificationSettings();

  const server = useMemo(() => parseSettings(data), [data]);
  const [state, setState] = useState<SettingsState | null>(null);

  useEffect(() => {
    if (server) setState(server);
  }, [server]);

  if (!hydrated) return <AccountLoading rows={4} />;

  if (!user) {
    return (
      <Navigate
        to={`/login?returnUrl=${encodeURIComponent(
          "/profile/notifications/settings",
        )}`}
        replace
      />
    );
  }

  const current = state ?? EMPTY;

  const persist = (next: SettingsState, previous: SettingsState) => {
    setState(next);
    update.mutate(next as unknown as Record<string, boolean>, {
      onSuccess: (res: unknown) => {
        const body = (res ?? {}) as Record<string, unknown>;
        if (body.status === false) {
          setState(previous);
          toast.error(
            (body.msg as string) || t("notificationSettings.save_failed"),
          );
          return;
        }
        toast.success(t("notificationSettings.saved"));
      },
      onError: () => {
        setState(previous);
        toast.error(t("notificationSettings.save_failed"));
      },
    });
  };

  const handleToggle = (key: SettingKey, value: boolean) => {
    const previous = current;
    // المفتاح الرئيس يطبّق قيمته على كل المفاتيح (كما في التطبيق)
    const next: SettingsState = key === MASTER
      ? KEYS.reduce(
          (acc, k) => ({ ...acc, [k]: value }),
          {} as SettingsState,
        )
      : { ...current, [key]: value, [MASTER]: value ? true : current[MASTER] };
    persist(next, previous);
  };

  const masterOff = !current[MASTER];

  return (
    <>
      <Helmet>
        <title>{t("notificationSettings.meta_title")}</title>
      </Helmet>

      <div className="space-y-5" dir={isRTL ? "rtl" : "ltr"}>
        <AccountPageHead
          title={t("notificationSettings.title")}
          subtitle={t("notificationSettings.subtitle")}
          icon={<IoNotificationsOutline />}
          tint="amber"
          actions={
            <Button
              variant="outline"
              size="sm"
              to="/profile/notifications"
              icon={<IoArrowBack className={isRTL ? "rotate-180" : ""} />}
            >
              {t("notificationSettings.back_to_list")}
            </Button>
          }
        />

        {isLoading && <AccountLoading rows={4} />}

        {!isLoading && isError && (
          <AccountError
            description={t("notificationSettings.load_error")}
            onRetry={() => void refetch()}
          />
        )}

        {!isLoading && !isError && (
          <div className="space-y-4">
            {GROUPS.map((group) => (
              <AccountPanel
                key={group.titleKey}
                title={t(group.titleKey)}
                icon={group.icon}
                tint={group.tint}
                flush
              >
                <div className="divide-y divide-mk-divider">
                  {group.keys.map((key) => (
                    <Toggle
                      key={key}
                      label={t(`notificationSettings.key_${key}`)}
                      checked={current[key]}
                      disabled={
                        update.isPending || (masterOff && key !== MASTER)
                      }
                      onChange={(v) => handleToggle(key, v)}
                    />
                  ))}
                </div>
              </AccountPanel>
            ))}

            <p className="rounded-mk-md border border-mk-border bg-white px-4 py-3 text-[12px] leading-relaxed text-mk-faint shadow-mk-card">
              {t("notificationSettings.hint")}
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationSettingsPage;
