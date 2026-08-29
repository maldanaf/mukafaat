"use client";

/**
 * قشرة «منطقة الحساب» — الإطار الذي يلفّ كل صفحات `/profile`.
 *
 * على الموبايل: شاشة بأسلوب «المزيد» في التطبيق — كرت مستخدم بتدرّج،
 * شبكة خدمات بأيقونات ملوّنة، ثم قوائم مرتّبة.
 * على الديسكتوب: نفس الكرت العلوي + قائمة لوحة الحساب الجانبية المشتركة.
 */

import React, { useMemo } from "react";
import { usePathname } from "next/navigation";
import { Link, useNavigate } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@hooks";
import { useUserStore } from "@stores/userStore";
import { useHydrated } from "@hooks/useHydrated";
import {
  useProfile,
  useSubscriptionStatus,
  useNotificationsUnreadCount,
} from "@hooks/api/useMokafaatQueries";
import { parseMembershipTier } from "@utils/subscriptionPricing";
import { isUserSubscribed } from "@utils/subscription";
import DashboardSidebar from "@components/DashboardSidebar";
import TierIcon from "@components/account/TierIcon";
import { Button, Skeleton, FOCUS } from "@ui";
import {
  IoPersonOutline,
  IoCardOutline,
  IoNotificationsOutline,
  IoHeartOutline,
  IoReceiptOutline,
  IoWalletOutline,
  IoSparklesOutline,
  IoPeopleOutline,
  IoGiftOutline,
  IoPeopleCircleOutline,
  IoShareSocialOutline,
  IoChevronBack,
  IoLogOutOutline,
} from "react-icons/io5";
import { AccountHero, ServiceGrid, type ServiceItem } from "./AccountKit";

/* ===================== خدمات الحساب (نفس ترتيب التطبيق) ===================== */

const SERVICES: ServiceItem[] = [
  { to: "/profile/card", label: "profileDashboard.menu_card", icon: IoCardOutline, tint: "violet" },
  { to: "/saved", label: "profileDashboard.menu_interests", icon: IoHeartOutline, tint: "red" },
  { to: "/orders", label: "profileDashboard.menu_orders", icon: IoReceiptOutline, tint: "teal" },
  { to: "/wallet", label: "profileDashboard.menu_wallet", icon: IoWalletOutline, tint: "orange" },
  {
    to: "/profile/notifications",
    label: "profileDashboard.menu_notifications",
    icon: IoNotificationsOutline,
    tint: "amber",
  },
  { to: "/profile/family", label: "profileDashboard.menu_family", icon: IoPeopleCircleOutline, tint: "blue" },
  { to: "/profile/referrals", label: "profileDashboard.menu_referrals", icon: IoShareSocialOutline, tint: "teal" },
  { to: "/profile/gifts", label: "profileDashboard.menu_gifts", icon: IoGiftOutline, tint: "pink" },
  {
    to: "/profile/subscribe-for-other",
    label: "profileDashboard.menu_subscribe_other",
    icon: IoPeopleOutline,
    tint: "violet",
  },
  { to: "/subscription/plans", label: "profileDashboard.menu_upgrade", icon: IoSparklesOutline, tint: "amber" },
  { to: "/profile", label: "profileDashboard.menu_account", icon: IoPersonOutline, tint: "purple" },
];

/** عنوان الصفحة الفرعية حسب المسار — يُستخدم في شريط الرجوع على الموبايل */
const PAGE_TITLES: { match: (p: string) => boolean; key: string }[] = [
  { match: (p) => p === "/profile/notifications/settings", key: "notificationSettings.title" },
  { match: (p) => p === "/profile/notifications", key: "profileDashboard.menu_notifications" },
  { match: (p) => p === "/profile/card", key: "profileDashboard.menu_card" },
  { match: (p) => p === "/profile/family", key: "profileDashboard.menu_family" },
  { match: (p) => p === "/profile/referrals", key: "profileDashboard.menu_referrals" },
  { match: (p) => p === "/profile/subscribe-for-other", key: "profileDashboard.menu_subscribe_other" },
  { match: (p) => /^\/profile\/gifts\/[^/]+\/?$/.test(p), key: "giftSubscription.invoice_title" },
  { match: (p) => p === "/profile/gifts", key: "profileDashboard.menu_gifts" },
];

/* ===================== القشرة ===================== */

const AccountShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const isRTL = useIsRTL();
  const navigate = useNavigate();
  const pathname = usePathname() ?? "/profile";
  const hydrated = useHydrated();
  const user = useUserStore((s) => s.user);
  const token = useUserStore((s) => s.token);
  const logout = useUserStore((s) => s.logout);

  const isIndex = pathname === "/profile" || pathname === "/profile/";

  const { data: profileData } = useProfile();
  const { data: subscriptionData } = useSubscriptionStatus(!!user);
  const { data: unreadData } = useNotificationsUnreadCount(!!token);

  const dateLocale = useMemo(() => {
    const base = i18n.language?.split("-")[0] || "en";
    if (base === "ar") return "ar-SA";
    if (base === "ur") return "ur-PK";
    if (base === "hi") return "hi-IN";
    return "en-US";
  }, [i18n.language]);

  const tier = useMemo(() => parseMembershipTier(profileData), [profileData]);

  /** بيانات كرت المستخدم — مستخرجة من نفس استجابة `/api/profile` */
  const hero = useMemo(() => {
    const raw = (profileData ?? {}) as Record<string, unknown>;
    const data = (raw.data ?? raw) as Record<string, unknown>;
    const u = (data.user ?? data) as Record<string, unknown>;
    const stats = (u?.stats ?? {}) as Record<string, number | undefined>;
    const fullName =
      [u?.first_name, u?.last_name].filter(Boolean).join(" ").trim() ||
      (u?.name as string) ||
      user?.name ||
      "";
    const subscription = (u?.subscription ?? null) as Record<string, unknown> | null;
    const plan = (subscription?.plan ?? null) as Record<string, unknown> | null;
    return {
      name: fullName,
      email: (u?.email as string) || user?.email || "",
      avatar: ((u?.avatar ?? u?.image) as string) || user?.avatar || null,
      membershipNumber: String(u?.membership_number ?? "").trim() || null,
      walletBalance: Number(u?.wallet_balance ?? 0) || 0,
      favoritesCount: Number(stats.favorites_count ?? 0) || 0,
      ordersCount: Number(stats.orders_count ?? 0) || 0,
      hasSubscription: Boolean(u?.has_subscription),
      planName:
        ((subscription?.plan_name ?? plan?.name) as string | undefined) ?? null,
      endDate: ((subscription?.end_date ?? subscription?.expires_at) as string | undefined) ?? null,
    };
  }, [profileData, user]);

  const unreadCount = useMemo(() => {
    const raw = (unreadData ?? {}) as Record<string, unknown>;
    const data = (raw.data ?? raw) as Record<string, unknown>;
    return Number(data?.count ?? 0) || 0;
  }, [unreadData]);

  const isSubscribed = hero.hasSubscription || isUserSubscribed(subscriptionData);

  const services = useMemo(
    () =>
      SERVICES.filter((s) => !(isIndex && s.to === "/profile")).map((s) => ({
        ...s,
        label: t(s.label),
        badge: s.to === "/profile/notifications" ? unreadCount : undefined,
      })),
    [t, unreadCount, isIndex],
  );

  const pageTitle = useMemo(() => {
    const found = PAGE_TITLES.find((p) => p.match(pathname));
    return found ? t(found.key) : t("profileDashboard.title");
  }, [pathname, t]);

  /* --- ما قبل الترطيب: هيكل بنفس أبعاد القشرة (بلا قفزات) --- */
  if (!hydrated) {
    return (
      <div className="min-h-screen bg-mk-bg pb-12 lg:mt-[77px]">
        <div className="container mx-auto space-y-4 px-4 pt-4 sm:pt-6" role="status" aria-label="loading">
          <Skeleton className="h-44 w-full rounded-mk-2xl" />
          <Skeleton className="h-24 w-full rounded-mk-xl" />
        </div>
      </div>
    );
  }

  /* --- زائر: نترك الصفحة تتولّى التوجيه/رسالة الدخول --- */
  if (!user) {
    return (
      <div className="min-h-screen bg-mk-bg lg:mt-[77px]">{children}</div>
    );
  }

  const expiresLabel =
    isSubscribed && hero.endDate
      ? `${t("profile.subscription_expires")}: ${new Date(hero.endDate).toLocaleDateString(dateLocale)}`
      : null;

  return (
    <div
      className="min-h-screen bg-grad-mist pb-16 lg:mt-[77px] lg:pb-12"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="container mx-auto px-4 pt-4 sm:pt-6">
        {/* شريط رجوع على الموبايل داخل الصفحات الفرعية */}
        {!isIndex && (
          <div className="mb-3 flex items-center gap-2 lg:hidden">
            <Link
              to="/profile"
              aria-label={t("profileDashboard.title")}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-mk-border bg-white text-mk-primary shadow-mk-card ${FOCUS}`}
            >
              <IoChevronBack className={`h-5 w-5 ${isRTL ? "" : "rotate-180"}`} />
            </Link>
            <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-mk-text">
              {pageTitle}
            </span>
          </div>
        )}

        {/* كرت المستخدم — على الصفحات الفرعية يظهر على الديسكتوب فقط ليبقى المحتوى أعلى الشاشة */}
        <AccountHero
          className={isIndex ? "" : "hidden lg:block"}
          name={hero.name}
          subtitle={hero.email}
          avatar={hero.avatar}
          tierName={tier?.name}
          tierColor={tier?.color}
          tierIcon={tier ? <TierIcon icon={tier.icon} className="h-3.5 w-3.5" /> : undefined}
          isSubscribed={isSubscribed}
          planName={hero.planName}
          expiresLabel={expiresLabel}
          membershipNumber={hero.membershipNumber}
          stats={[
            { label: t("profile.stat_favorites"), value: hero.favoritesCount, to: "/saved" },
            { label: t("profile.stat_orders"), value: hero.ordersCount, to: "/orders" },
            {
              label: t("profile.stat_wallet"),
              value: `${hero.walletBalance}${t("profile.wallet_currency_suffix")}`,
              to: "/wallet",
            },
          ]}
          actions={
            !isSubscribed ? (
              <Button
                to="/subscription/plans?from=/profile"
                size="sm"
                variant="accent"
                icon={<IoSparklesOutline />}
                className="mk-shine"
              >
                {t("profile.subscribe_now")}
              </Button>
            ) : undefined
          }
        />

        {/* شبكة الخدمات — بديل القائمة الجانبية على الموبايل */}
        {isIndex && (
          <div className="mt-4 lg:hidden">
            <ServiceGrid items={services} />
          </div>
        )}

        <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-start">
          <aside className="hidden w-72 shrink-0 lg:order-1 lg:block">
            <div className="sticky top-24">
              <DashboardSidebar />
            </div>
          </aside>
          <main className="min-w-0 flex-1 lg:order-2">
            <div className="dashboard-content-reset">{children}</div>
          </main>
        </div>

        {/* تسجيل الخروج — أسفل شاشة «المزيد» على الموبايل فقط */}
        {isIndex && (
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/");
            }}
            className={`mt-6 flex min-h-[52px] w-full items-center gap-3 rounded-mk-lg border border-[#F7DDE1] bg-white px-4 text-[13.5px] font-bold text-mk-red shadow-mk-card transition-colors hover:bg-[#FFF7F8] active:scale-[0.99] lg:hidden ${FOCUS}`}
          >
            <IoLogOutOutline aria-hidden className="h-5 w-5 shrink-0" />
            <span className="flex-1 text-start">{t("profileDashboard.menu_logout")}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default AccountShell;
