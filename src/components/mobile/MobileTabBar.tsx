"use client";

import { Link, useLocation } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { LuHouse, LuTag, LuTicket, LuCreditCard, LuUser } from "react-icons/lu";
import { FOCUS } from "@ui";

/**
 * شريط التبويبات السفلي — نسخة الموبايل فقط.
 * الاتجاه «الحيوي التجاري»: التبويب النشط كبسولة بتدرّج الهوية مع توهّج،
 * وشريط علوي رفيع يؤكّد الموضع، وحركة قصيرة عند التبديل واللمس.
 */
const MobileTabBar: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const path = location?.pathname ?? "/";

  const tabs = [
    {
      to: "/",
      label: t("home.navbar.home", "الرئيسية"),
      Icon: LuHouse,
      match: (p: string) => p === "/" || /^\/(en|fr|hi|ur)\/?$/.test(p),
    },
    {
      to: "/offers",
      label: t("home.navbar.offers", "العروض"),
      Icon: LuTag,
      match: (p: string) => p.includes("/offers"),
    },
    {
      to: "/coupons",
      label: t("home.navbar.coupons", "كوبونز"),
      Icon: LuTicket,
      match: (p: string) => p.includes("/coupons"),
    },
    {
      to: "/cards",
      label: t("home.navbar.cards", "البطاقات"),
      Icon: LuCreditCard,
      match: (p: string) => p.includes("/cards"),
    },
    {
      to: "/profile",
      label: t("profileDashboard.title", "حسابي"),
      Icon: LuUser,
      match: (p: string) => p.includes("/profile"),
    },
  ];

  return (
    <nav
      aria-label={t("home.navbar.home", "الرئيسية")}
      className="fixed inset-x-0 bottom-0 z-[95] border-t border-mk-border bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-mk-bar backdrop-blur-md lg:hidden"
    >
      <div className="grid grid-cols-5">
        {tabs.map(({ to, label, Icon, match }) => {
          const active = match(path);
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-[58px] touch-manipulation select-none flex-col items-center justify-center gap-1 py-1.5 active:scale-[0.96] ${FOCUS}`}
            >
              {/* مؤشّر علوي للتبويب النشط */}
              <span
                aria-hidden
                className={`absolute inset-x-5 top-0 h-[3px] rounded-b-full bg-grad-accent transition-opacity duration-200 ${
                  active ? "opacity-100" : "opacity-0"
                }`}
              />
              <span
                className={`flex h-8 w-[52px] items-center justify-center rounded-full transition-all duration-200 ${
                  active
                    ? "bg-grad-brand text-white shadow-mk-glow"
                    : "text-mk-faint"
                }`}
              >
                <Icon size={19} />
              </span>
              <span
                className={`text-[10.5px] leading-none transition-colors ${
                  active ? "font-bold text-mk-primary" : "font-medium text-mk-faint"
                }`}
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
