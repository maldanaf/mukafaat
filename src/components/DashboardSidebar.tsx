"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNavigate } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@hooks";
import { useUserStore } from "@stores/userStore";
import { APP_ROUTES } from "@constants";
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
} from "react-icons/io5";

const menu = [
  {
    to: "/profile",
    end: true,
    labelKey: "profileDashboard.menu_account",
    icon: IoPersonOutline,
  },
  {
    to: "/saved",
    labelKey: "profileDashboard.menu_interests",
    icon: IoHeartOutline,
  },
  {
    to: "/orders",
    labelKey: "profileDashboard.menu_orders",
    icon: IoReceiptOutline,
  },
  {
    to: "/wallet",
    labelKey: "profileDashboard.menu_wallet",
    icon: IoWalletOutline,
  },
  {
    to: "/about",
    labelKey: "profileDashboard.menu_how_to_use",
    icon: IoDocumentTextOutline,
  },
  {
    to: "/profile/subscribe-for-other",
    labelKey: "profileDashboard.menu_subscribe_other",
    icon: IoPeopleOutline,
  },
  {
    to: "/subscription/plans",
    labelKey: "profileDashboard.menu_upgrade",
    icon: IoSparklesOutline,
  },
  {
    to: "/contact",
    labelKey: "profileDashboard.menu_contact",
    icon: IoMailOutline,
  },
];

export default function DashboardSidebar() {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const navigate = useNavigate();
  const pathname = usePathname();
  const logout = useUserStore((s) => s.logout);

  return (
    <nav
      className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <ul className="divide-y divide-gray-100">
        {menu.map((item) => {
          const Icon = item.icon;
          const isActive = item.end
            ? pathname === item.to
            : pathname.startsWith(item.to);
          return (
            <li key={`${item.to}-${item.labelKey}`}>
              <Link
                href={item.to}
                className={`flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#440798]/10 text-[#440798]"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0 opacity-90" />
                <span className="flex-1 text-start">{t(item.labelKey)}</span>
                <IoChevronBack
                  className={`w-4 h-4 shrink-0 text-gray-400 ${
                    isRTL ? "" : "rotate-180"
                  }`}
                />
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <IoLogOutOutline className="w-5 h-5 shrink-0" />
            <span className="flex-1 text-start">
              {t("profileDashboard.menu_logout")}
            </span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
