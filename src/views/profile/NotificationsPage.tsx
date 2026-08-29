"use client";

import React, { useMemo, useState } from "react";
import { Navigate, Link } from "@/lib/router-compat";
import { Helmet } from "@/lib/helmet-compat";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@hooks";
import { toast } from "react-toastify";
import { useUserStore } from "@stores/userStore";
import { useHydrated } from "@hooks/useHydrated";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from "@hooks/api/useMokafaatQueries";
import { Button, FOCUS } from "@ui";
import {
  IoNotificationsOutline,
  IoNavigateOutline,
  IoReceiptOutline,
  IoCheckmarkDoneOutline,
  IoTrashOutline,
  IoSettingsOutline,
} from "react-icons/io5";
import {
  AccountEmpty,
  AccountError,
  AccountLoading,
  AccountPageHead,
  IconBox,
  type TintName,
} from "./components/AccountKit";

/* ===================== نموذج البيانات ===================== */

export interface NotificationItem {
  id: number | string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  is_read: boolean;
  created_at?: string;
  time_ago?: string;
}

interface NotificationsPayload {
  items: NotificationItem[];
  unreadCount: number;
  currentPage: number;
  lastPage: number;
  total: number;
}

function parseNotifications(payload: unknown): NotificationsPayload {
  const raw = (payload ?? {}) as Record<string, unknown>;
  const data = (raw.data ?? raw) as Record<string, unknown>;
  const list = data.notifications;
  return {
    items: Array.isArray(list) ? (list as NotificationItem[]) : [],
    unreadCount: Number(data.unread_count ?? 0) || 0,
    currentPage: Number(data.current_page ?? 1) || 1,
    lastPage: Number(data.last_page ?? 1) || 1,
    total: Number(data.total ?? 0) || 0,
  };
}

/* ===================== التصنيف (مطابق للتطبيق) ===================== */

export type NotificationTab = "general" | "nearby" | "orders";

/**
 * نفس `notificationTabOf` في `notifications_view.dart`:
 * الفلترة محلية لأن الـ API لا يوفّر فلترة بالنوع.
 */
export function notificationTabOf(type: string): NotificationTab {
  const tp = String(type ?? "").toLowerCase().trim();
  if (tp.includes("proximity") || tp.includes("nearby")) return "nearby";
  if (
    tp.startsWith("order_") ||
    tp.startsWith("payment_") ||
    tp === "verification_code" ||
    tp === "manual_activation_request"
  ) {
    return "orders";
  }
  return "general";
}

const TABS: {
  key: NotificationTab;
  labelKey: string;
  Icon: typeof IoNotificationsOutline;
  tint: TintName;
}[] = [
  {
    key: "general",
    labelKey: "notificationsPage.tab_general",
    Icon: IoNotificationsOutline,
    tint: "purple",
  },
  {
    key: "nearby",
    labelKey: "notificationsPage.tab_nearby",
    Icon: IoNavigateOutline,
    tint: "teal",
  },
  {
    key: "orders",
    labelKey: "notificationsPage.tab_orders",
    Icon: IoReceiptOutline,
    tint: "orange",
  },
];

/** وجهة الضغط على الإشعار — نفتح الطلب إن وُجد معرّفه */
function notificationHref(item: NotificationItem): string | null {
  const d = (item.data ?? {}) as Record<string, unknown>;
  const orderId = d.order_id ?? d.orderId;
  if (orderId != null && String(orderId) !== "") return `/orders/${orderId}`;
  return null;
}

/* ===================== الصفحة ===================== */

const NotificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const hydrated = useHydrated();
  const user = useUserStore((s) => s.user);

  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<NotificationTab>("general");

  const { data, isLoading, isError, isFetching, refetch } = useNotifications(
    page,
    !!user,
  );
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const removeOne = useDeleteNotification();

  const parsed = useMemo(() => parseNotifications(data), [data]);

  const counts = useMemo(() => {
    const c: Record<NotificationTab, number> = {
      general: 0,
      nearby: 0,
      orders: 0,
    };
    parsed.items.forEach((n) => {
      if (!n.is_read) c[notificationTabOf(n.type)] += 1;
    });
    return c;
  }, [parsed.items]);

  const visible = useMemo(
    () => parsed.items.filter((n) => notificationTabOf(n.type) === tab),
    [parsed.items, tab],
  );

  if (!hydrated) return <AccountLoading rows={4} />;

  if (!user) {
    return (
      <Navigate
        to={`/login?returnUrl=${encodeURIComponent("/profile/notifications")}`}
        replace
      />
    );
  }

  const handleOpen = (item: NotificationItem) => {
    if (!item.is_read) markRead.mutate(item.id);
  };

  const handleMarkAll = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => toast.success(t("notificationsPage.mark_all_done")),
      onError: () => toast.error(t("notificationsPage.action_failed")),
    });
  };

  const handleRemove = (item: NotificationItem) => {
    removeOne.mutate(item.id, {
      onError: () => toast.error(t("notificationsPage.action_failed")),
    });
  };

  return (
    <>
      <Helmet>
        <title>{t("notificationsPage.meta_title")} | Mokafaat</title>
      </Helmet>

      <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
        <AccountPageHead
          title={t("notificationsPage.title")}
          subtitle={
            parsed.unreadCount > 0
              ? t("notificationsPage.unread_badge", { count: parsed.unreadCount })
              : undefined
          }
          icon={<IoNotificationsOutline />}
          tint="amber"
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                icon={<IoCheckmarkDoneOutline />}
                disabled={parsed.unreadCount === 0 || markAllRead.isPending}
                loading={markAllRead.isPending}
                onClick={handleMarkAll}
              >
                {t("notificationsPage.mark_all")}
              </Button>
              <Button
                variant="soft"
                size="sm"
                to="/profile/notifications/settings"
                icon={<IoSettingsOutline />}
              >
                {t("notificationsPage.settings_cta")}
              </Button>
            </>
          }
        />

        {/* تبويبات التصنيف — عام / الأقرب / طلبات (فلترة محلية كالتطبيق) */}
        <div
          role="tablist"
          aria-label={t("notificationsPage.title")}
          className="no-scrollbar flex gap-1.5 overflow-x-auto rounded-mk-lg border border-mk-border bg-white p-1.5 shadow-mk-card"
        >
          {TABS.map(({ key, labelKey, Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(key)}
                className={`flex min-h-[44px] flex-1 shrink-0 items-center justify-center gap-1.5 rounded-mk-md px-3 text-[12.5px] font-bold transition-all duration-200 ${FOCUS} ${
                  active
                    ? "bg-grad-brand text-white shadow-mk-glow"
                    : "text-mk-muted hover:bg-mk-tint3"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{t(labelKey)}</span>
                {counts[key] > 0 && (
                  <span
                    className={`shrink-0 rounded-full px-1.5 text-[10px] font-bold leading-[18px] ${
                      active ? "bg-white/25 text-white" : "bg-grad-accent text-white"
                    }`}
                  >
                    {counts[key]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {isLoading && <AccountLoading rows={5} />}

        {!isLoading && isError && (
          <AccountError
            description={t("notificationsPage.load_error")}
            onRetry={() => void refetch()}
          />
        )}

        {!isLoading && !isError && visible.length === 0 && (
          <AccountEmpty
            icon={<IoNotificationsOutline />}
            title={t("notificationsPage.empty_title")}
            description={t("notificationsPage.tab_empty")}
          />
        )}

        {!isLoading && !isError && visible.length > 0 && (
          <ul className="m-0 list-none space-y-2.5 p-0">
            {visible.map((item) => {
              const href = notificationHref(item);
              const meta =
                TABS.find((x) => x.key === notificationTabOf(item.type)) ?? TABS[0];
              const Body = (
                <>
                  <IconBox
                    tint={item.is_read ? "grey" : meta.tint}
                    size="md"
                    solid={!item.is_read}
                    className="mt-0.5"
                  >
                    <meta.Icon className="h-[19px] w-[19px]" />
                  </IconBox>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start gap-2">
                      <span
                        className={`flex-1 text-[13.5px] ${
                          item.is_read
                            ? "font-medium text-mk-text"
                            : "font-bold text-mk-text"
                        }`}
                      >
                        {item.title}
                      </span>
                      {!item.is_read && (
                        <span
                          aria-label={t("notificationsPage.unread")}
                          className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-grad-accent shadow-mk-badge"
                        />
                      )}
                    </span>
                    {item.message && (
                      <span className="mt-1 block text-[12.5px] leading-relaxed text-mk-muted">
                        {item.message}
                      </span>
                    )}
                    <span className="mt-1.5 block text-[11px] text-mk-faint">
                      {item.time_ago || item.created_at}
                    </span>
                  </span>
                </>
              );

              return (
                <li
                  key={String(item.id)}
                  className={`mk-lift flex items-start gap-3 rounded-mk-lg border p-3.5 sm:p-4 ${
                    item.is_read
                      ? "border-mk-border bg-white shadow-mk-card"
                      : "border-mk-border-strong bg-grad-mist shadow-mk-raised"
                  }`}
                >
                  {href ? (
                    <Link
                      to={href}
                      onClick={() => handleOpen(item)}
                      className={`flex flex-1 items-start gap-3 rounded-mk-md ${FOCUS}`}
                    >
                      {Body}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpen(item)}
                      className={`flex flex-1 items-start gap-3 rounded-mk-md text-start ${FOCUS}`}
                    >
                      {Body}
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={t("notificationsPage.delete")}
                    title={t("notificationsPage.delete")}
                    onClick={() => handleRemove(item)}
                    disabled={removeOne.isPending}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-mk-sm text-mk-faint transition-colors hover:bg-[#FDE9EB] hover:text-mk-red disabled:opacity-50 ${FOCUS}`}
                  >
                    <IoTrashOutline className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* ترقيم الصفحات — الـ API يعيد 20 إشعاراً لكل صفحة */}
        {!isLoading && !isError && parsed.lastPage > 1 && (
          <div className="flex items-center justify-center gap-3 pt-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {t("notificationsPage.prev")}
            </Button>
            <span className="text-[12px] text-mk-muted">
              {t("notificationsPage.page_of", {
                page: parsed.currentPage,
                total: parsed.lastPage,
              })}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= parsed.lastPage || isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("notificationsPage.next")}
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationsPage;
