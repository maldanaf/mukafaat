"use client";

import { Link, useLocation } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { LuHouse, LuTag, LuTicket, LuCreditCard, LuUser } from "react-icons/lu";

/** شريط التبويبات السفلي — نسخة الموبايل فقط */
const MobileTabBar: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const path = location?.pathname ?? "/";

  const tabs = [
    { to: "/", label: t("home.navbar.home", "الرئيسية"), Icon: LuHouse, match: (p: string) => p === "/" },
    { to: "/offers", label: t("home.navbar.offers", "العروض"), Icon: LuTag, match: (p: string) => p.startsWith("/offers") },
    { to: "/coupons", label: t("home.navbar.coupons", "كوبونز"), Icon: LuTicket, match: (p: string) => p.startsWith("/coupons") },
    { to: "/cards", label: t("home.navbar.cards", "البطاقات"), Icon: LuCreditCard, match: (p: string) => p.startsWith("/cards") },
    { to: "/profile", label: t("home.navbar.profile", "حسابي"), Icon: LuUser, match: (p: string) => p.startsWith("/profile") },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[95] border-t border-[#EDE9F7] bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_24px_rgba(46,16,101,0.08)] lg:hidden">
      <div className="grid grid-cols-5">
        {tabs.map(({ to, label, Icon, match }) => {
          const active = match(path);
          return (
            <Link
              key={to}
              to={to}
              className="flex min-h-[56px] touch-manipulation select-none flex-col items-center justify-center gap-1 py-2 active:bg-[#FBF9FF]"
              aria-current={active ? "page" : undefined}
            >
              <span
                className={`flex h-8 w-12 items-center justify-center rounded-full transition-colors ${
                  active ? "bg-[#F1EBFB] text-[#4C1D95]" : "text-[#9A93AD]"
                }`}
              >
                <Icon size={20} />
              </span>
              <span
                className={`text-[10.5px] ${active ? "font-bold text-[#4C1D95]" : "font-medium text-[#9A93AD]"}`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileTabBar;
