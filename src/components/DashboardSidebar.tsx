"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNavigate } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@hooks";
import { useUserStore } from "@stores/userStore";
import {
  IoPersonOutline,
  IoHeartOutline,
  IoReceiptOutline,
  IoWalletOutline,
  IoDocumentTextOutline,
  IoPeopleOutline,
  IoSparklesOutline,
  IoMailOutline,
  IoLogOutOutline,
  IoChevronBack,
  IoGiftOutline,
  IoPeopleCircleOutline,
  IoCardOutline,
  IoNotificationsOutline,
  IoStorefrontOutline,
} from "react-icons/io5";
import { FOCUS, ShareIcon } from "@ui";
import { useNotificationsUnreadCount } from "@hooks/api/useMokafaatQueries";

interface MenuItem {
  to: string;
  end?: boolean;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  /** لون أيقونة العنصر — نفس فكرة مربّعات «المزيد» في التطبيق */
  tint: string;
  bg: string;
  /** يعرض شارة عدّاد غير المقروء بجانب العنصر */
  badge?: "notifications";
}

/**
 * قائمة لوحة الحساب مقسّمة لمجموعات كما في شاشة «المزيد» بالتطبيق:
 * حسابي · اشتراكي ومزاياي · المساعدة.
 */
const GROUPS: { titleKey: string; items: MenuItem[] }[] = [
  {
    titleKey: "profileDashboard.group_account",
    items: [
      {
        to: "/profile",
        end: true,
        labelKey: "profileDashboard.menu_account",
        icon: IoPersonOutline,
        tint: "#400198",
        bg: "#F1EBFB",
      },
      {
        to: "/profile/card",
        labelKey: "profileDashboard.menu_card",
        icon: IoCardOutline,
        tint: "#6703EB",
        bg: "#F0EAFD",
      },
      {
        to: "/profile/notifications",
        end: true,
        labelKey: "profileDashboard.menu_notifications",
        icon: IoNotificationsOutline,
        tint: "#B45309",
        bg: "#FDF1DF",
        badge: "notifications",
      },
      {
        to: "/saved",
        labelKey: "profileDashboard.menu_interests",
        icon: IoHeartOutline,
        tint: "#E8384F",
        bg: "#FDE9EB",
      },
      {
        to: "/orders",
        labelKey: "profileDashboard.menu_orders",
        icon: IoReceiptOutline,
        tint: "#0E9384",
        bg: "#E4F5F2",
      },
      {
        to: "/wallet",
        labelKey: "profileDashboard.menu_wallet",
        icon: IoWalletOutline,
        tint: "#FD671A",
        bg: "#FEF0E4",
      },
    ],
  },
  {
    titleKey: "profileDashboard.group_membership",
    items: [
      {
        to: "/subscription/plans",
        labelKey: "profileDashboard.menu_upgrade",
        icon: IoSparklesOutline,
        tint: "#B45309",
        bg: "#FDF1DF",
      },
      {
        to: "/profile/subscribe-for-other",
        labelKey: "profileDashboard.menu_subscribe_other",
        icon: IoPeopleOutline,
        tint: "#6703EB",
        bg: "#F0EAFD",
      },
      {
        to: "/profile/gifts",
        labelKey: "profileDashboard.menu_gifts",
        icon: IoGiftOutline,
        tint: "#C2246E",
        bg: "#FCE9F1",
      },
      {
        to: "/profile/family",
        labelKey: "profileDashboard.menu_family",
        icon: IoPeopleCircleOutline,
        tint: "#1D4ED8",
        bg: "#E8EEFD",
      },
      {
        to: "/profile/referrals",
        labelKey: "profileDashboard.menu_referrals",
        icon: ShareIcon,
        tint: "#0E9384",
        bg: "#E4F5F2",
      },
    ],
  },
  {
    titleKey: "profileDashboard.group_help",
    items: [
      {
        to: "/about",
        labelKey: "profileDashboard.menu_how_to_use",
        icon: IoDocumentTextOutline,
        tint: "#400198",
        bg: "#F1EBFB",
      },
      {
        to: "/store-request",
        labelKey: "profileDashboard.menu_store_request",
        icon: IoStorefrontOutline,
        tint: "#0E9384",
        bg: "#E4F5F2",
      },
      {
        to: "/contact",
        labelKey: "profileDashboard.menu_contact",
        icon: IoMailOutline,
        tint: "#6B6B85",
        bg: "#F2EFFA",
      },
    ],
  },
];

export default function DashboardSidebar() {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const navigate = useNavigate();
  const pathname = usePathname();
  const logout = useUserStore((s) => s.logout);
  const token = useUserStore((s) => s.token);
  const { data: unreadData } = useNotificationsUnreadCount(!!token);
  const unreadCount = (() => {
    const raw = (unreadData ?? {}) as Record<string, unknown>;
    const data = (raw.data ?? raw) as Record<string, unknown>;
    return Number(data?.count ?? 0) || 0;
  })();

  return (
    <nav
      aria-label={t("profileDashboard.title")}
      dir={isRTL ? "rtl" : "ltr"}
      className="flex flex-col gap-3"
    >
      {GROUPS.map((group) => (
        <div
          key={group.titleKey}
          className="overflow-hidden rounded-mk-lg border border-mk-border bg-white shadow-mk-card"
        >
          <p className="m-0 px-4 pb-1.5 pt-3.5 text-[11.5px] font-bold tracking-wide text-mk-faint">
            {t(group.titleKey)}
          </p>
          <ul className="m-0 list-none p-2 pt-0">
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = item.end
                ? pathname === item.to
                : pathname.startsWith(item.to);
              return (
                <li key={`${item.to}-${item.labelKey}`}>
                  <Link
                    href={item.to}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex min-h-[48px] items-center gap-3 rounded-mk-md px-2.5 py-2 text-[13.5px] font-semibold transition-colors ${FOCUS} ${
                      isActive
                        ? "bg-mk-tint text-mk-primary"
                        : "text-mk-text-strong hover:bg-mk-tint3"
                    }`}
                  >
                    <span
                      aria-hidden
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-mk-sm"
                      style={{ background: item.bg, color: item.tint }}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="flex-1 text-start">{t(item.labelKey)}</span>
                    {item.badge === "notifications" && unreadCount > 0 && (
                      <span className="shrink-0 rounded-full bg-mk-accent px-2 py-0.5 text-[10px] font-bold leading-4 text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                    <IoChevronBack
                      aria-hidden
                      className={`h-4 w-4 shrink-0 text-mk-faint ${isRTL ? "" : "rotate-180"}`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <button
        type="button"
        onClick={() => {
          logout();
          navigate("/");
        }}
        className={`flex min-h-[48px] w-full items-center gap-3 rounded-mk-lg border border-[#F7DDE1] bg-white px-4 text-[13.5px] font-bold text-mk-red shadow-mk-card transition-colors hover:bg-[#FFF7F8] ${FOCUS}`}
      >
        <IoLogOutOutline aria-hidden className="h-5 w-5 shrink-0" />
        <span className="flex-1 text-start">{t("profileDashboard.menu_logout")}</span>
      </button>
    </nav>
  );
}
