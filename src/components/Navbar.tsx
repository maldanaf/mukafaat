"use client";

import { useEffect, useRef, useState } from "react";
import { POINTS_ENABLED } from "@config/features";
import { Link, useNavigate } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { ShareIcon, HeartIcon } from "@ui";
import {
  LuPercent,
  LuCreditCard,
  LuTicket,
  LuChevronDown,
  LuMapPin,
  LuUser,
  LuLogOut,
  LuSearch,
  LuMenu,
  LuX,
  LuShoppingBag,
  LuHeartPulse,
  LuFerrisWheel,
  LuCar,
  LuGraduationCap,
  LuDumbbell,
  LuUtensils,
  LuWallet,
  LuPackage,
  LuUsers,
} from "react-icons/lu";

import { APP_ROUTES } from "@constants";
import { Logo } from "@assets";
import { useHydrated } from "@hooks/useHydrated";
import { useIsRTL } from "@hooks";
import LanguageToggle from "./LanguageToggle";
import SideMenu from "./SideMenu";
import AnnouncementBar from "./AnnouncementBar";
import { useUserStore } from "@stores/userStore";
import { useCityStore } from "@stores/cityStore";
import {
  useProfile,
  useFavorites,
  useWebHome,
} from "@hooks/api/useMokafaatQueries";
import { normalizeFavoritesList } from "@utils/favorites";
import { pick } from "@/views/home/components/newhome/tokens";

/** أيقونات بطاقات القائمة الكبرى حسب ترتيب التصنيفات */
const MEGA_ICONS = [
  LuShoppingBag,
  LuHeartPulse,
  LuFerrisWheel,
  LuCar,
  LuGraduationCap,
  LuDumbbell,
  LuUtensils,
];

type Dropdown = "offers" | "city" | "user" | null;

/**
 * الهيدر المشترك لكل صفحات الموقع — تصميم design_handoff_mukafaat_homepage.
 * ثابت أعلى الصفحة: الشعار + التنقّل مع قائمة التصنيفات + المدينة + اللغة + المستخدم.
 */
const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isRTL = useIsRTL();
  const hydrated = useHydrated();

  const [open, setOpen] = useState<Dropdown>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const headerRef = useRef<HTMLElement | null>(null);

  const { user, isAuthenticated, logout } = useUserStore();
  const { data: profileData } = useProfile(!!isAuthenticated);
  const { data: favoritesData } = useFavorites();
  const { data: homeData } = useWebHome();
  const { cityId, cityName, setCity } = useCityStore();

  const favoritesCount = normalizeFavoritesList(favoritesData ?? null).length;

  const home = (homeData as Record<string, any>)?.data ?? {};
  const categories: Record<string, any>[] = home.categories ?? [];
  const cities: Record<string, any>[] = home.cities ?? [];
  const citiesOffersTotal: number | null = home.cities_offers_total ?? null;

  const profileUser = (() => {
    const raw = profileData as Record<string, any> | undefined;
    const data = raw?.data as Record<string, any> | undefined;
    return (data?.user ?? data) as Record<string, any> | undefined;
  })();

  const displayName = (() => {
    const full = [profileUser?.first_name ?? profileUser?.name, profileUser?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();
    return full || user?.name || t("home.navbar.profile", "حسابي");
  })();

  const displayAvatar = (profileUser?.avatar as string) ?? user?.avatar ?? null;
  const points = Number(profileUser?.points ?? profileUser?.points_balance ?? 0);

  // مستوى العضوية (تصنيف العميل) — بديل بطاقة النقاط
  const tier = (profileUser?.membership_tier ?? null) as
    | {
        name?: string;
        color?: string;
        description?: string;
        renewal_discount_percent?: number;
        next_tier?: { name?: string; remaining_orders?: number } | null;
      }
    | null;

  const navItems = [
    { to: "/cards", label: t("home.navbar.cards", "البطاقات"), icon: LuCreditCard },
    { to: "/coupons", label: t("home.navbar.coupons", "كوبونز"), icon: LuTicket },
  ];

  // إغلاق القوائم المنسدلة عند النقر خارج الهيدر
  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (!open) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-dd]")) return;
      setOpen(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`/offers?search=${encodeURIComponent(q)}`);
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  const toggle = (name: Exclude<Dropdown, null>) =>
    setOpen((current) => (current === name ? null : name));

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-[60] border-b border-[#EFEDF7] bg-white/95 shadow-[0_4px_20px_-12px_rgba(46,16,101,0.35)] backdrop-blur-md"
      >
        <AnnouncementBar />

        <div className="mx-auto flex h-[74px] w-full max-w-site items-center gap-2 px-3 sm:gap-3.5 sm:px-6">
          {/* الشعار */}
          <Link to={APP_ROUTES.home} className="flex shrink-0 items-center">
            <img
              src={Logo}
              alt={t("home.navbar.brand", "مكافآت")}
              className="h-9 w-auto sm:h-10"
            />
          </Link>

          {/* التنقّل — يظهر على الشاشات الكبيرة */}
          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
            <div data-dd="offers" className="relative">
              <button
                onClick={() => toggle("offers")}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full py-1 pe-3 ps-1 text-[13.5px] font-extrabold text-[#400198] transition-all duration-200 ease-out ${
                  open === "offers" ? "bg-[#F1EBFB] shadow-[inset_0_0_0_1px_#DED7F2]" : "hover:bg-[#F2EFFA]"
                }`}
              >
                <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-grad-accent text-white shadow-[0_6px_14px_-6px_rgba(226,86,13,0.9)]">
                  <LuPercent size={16} />
                </span>
                <span>{t("home.navbar.offers", "العروض")}</span>
                <LuChevronDown
                  size={15}
                  className={`transition-transform ${open === "offers" ? "rotate-180" : ""}`}
                />
              </button>
            </div>

            {navItems.map((item, i) => {
              const color = pick(i + 4);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-full py-1 pe-3 ps-1 text-[13.5px] font-extrabold text-[#2B1B5E] transition-all duration-200 ease-out hover:bg-[#F2EFFA] hover:text-[#400198]"
                >
                  <span
                    className="flex h-[30px] w-[30px] items-center justify-center rounded-full text-white shadow-[0_6px_14px_-8px_rgba(46,16,101,0.9)]"
                    style={{ backgroundImage: `linear-gradient(135deg, ${color.c}, ${color.c}CC)` }}
                  >
                    <Icon size={16} />
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="ms-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
            {/* منتقي المدينة */}
            {cities.length > 0 && (
              <div data-dd="city" className="relative hidden sm:block">
                <button
                  onClick={() => toggle("city")}
                  className={`flex h-[38px] items-center gap-1.5 whitespace-nowrap rounded-[11px] border bg-[#F2EFFA] px-2.5 text-[13px] font-semibold text-[#2B1B5E] ${
                    open === "city" ? "border-[#C9BCEC]" : "border-[#EFEDF7]"
                  }`}
                >
                  <LuMapPin size={16} />
                  <span>{cityName || t("home.search_new.all_cities", "جميع المدن")}</span>
                  <LuChevronDown size={14} className="opacity-60" />
                </button>

                {open === "city" && (
                  <div className="absolute top-[calc(100%+10px)] end-0 z-[70] w-[230px] rounded-[14px] border border-[#EFEDF7] bg-white p-2 shadow-[0_20px_50px_rgba(46,16,101,0.16)]">
                    <div className="px-2.5 pb-2.5 pt-2 text-[11px] font-semibold tracking-wide text-[#9A99B0]">
                      {t("home.navbar.choose_city", "اختر مدينتك")}
                    </div>
                    <div className="max-h-[320px] overflow-y-auto">
                      <button
                        onClick={() => {
                          setCity(null, null);
                          setOpen(null);
                        }}
                        className={`flex w-full items-center justify-between gap-2.5 rounded-[10px] p-2.5 text-[13.5px] ${
                          cityId === null
                            ? "bg-[#F2EFFA] font-semibold text-[#400198]"
                            : "text-[#4A4459] hover:bg-[#FBF9FF]"
                        }`}
                      >
                        <span>{t("home.search_new.all_cities", "جميع المدن")}</span>
                        {citiesOffersTotal != null && (
                          <span className="text-[11px] text-[#9A99B0]" dir="ltr">
                            {citiesOffersTotal}
                          </span>
                        )}
                      </button>
                      {cities.map((city) => (
                        <button
                          key={city.id}
                          onClick={() => {
                            setCity(city.id, city.name);
                            setOpen(null);
                          }}
                          className={`flex w-full items-center justify-between gap-2.5 rounded-[10px] p-2.5 text-[13.5px] ${
                            cityId === city.id
                              ? "bg-[#F2EFFA] font-semibold text-[#400198]"
                              : "text-[#4A4459] hover:bg-[#FBF9FF]"
                          }`}
                        >
                          <span>{city.name}</span>
                          <span className="text-[11px] text-[#9A99B0]" dir="ltr">
                            {city.offers_count ?? 0}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* اللغة والبلد (المكوّن الموجود مسبقاً) */}
            <LanguageToggle handleCloseNavigation={() => setIsSideMenuOpen(false)} />

            {/* البحث */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label={isRTL ? "بحث" : "Search"}
              className="hidden h-[40px] w-[40px] items-center justify-center rounded-full border border-[#ECE9F5] bg-white text-[#400198] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#400198] hover:bg-[#F2EFFA] sm:flex"
            >
              <LuSearch size={17} />
            </button>

            {!hydrated ? (
              <div className="h-[38px] w-[38px]" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/saved"
                  className="relative hidden h-10 w-10 items-center justify-center rounded-full border border-[#ECE9F5] bg-white text-[#400198] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#400198] hover:bg-[#F2EFFA] sm:flex"
                >
                  <HeartIcon size={18} />
                  {favoritesCount > 0 && (
                    <span className="absolute -top-1 start-[-4px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-grad-accent px-1 text-[10px] font-extrabold text-white shadow-mk-badge">
                      {favoritesCount}
                    </span>
                  )}
                </Link>

                <div data-dd="user" className="relative">
                  <button
                    onClick={() => toggle("user")}
                    className={`flex h-[44px] items-center gap-2 rounded-full border bg-[#F2EFFA] py-0 pe-3 ps-1.5 ${
                      open === "user" ? "border-[#C9BCEC]" : "border-[#EFEDF7]"
                    }`}
                  >
                    {displayAvatar ? (
                      <img
                        src={displayAvatar}
                        alt=""
                        className="h-[30px] w-[30px] rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#400198] text-[12px] font-bold text-white">
                        {displayName.charAt(0)}
                      </span>
                    )}
                    <span className="hidden max-w-[110px] truncate text-[13px] font-semibold text-[#2B1B5E] sm:block">
                      {displayName}
                    </span>
                    <LuChevronDown size={14} className="opacity-60" />
                  </button>

                  {open === "user" && (
                    <div className="absolute top-[calc(100%+12px)] end-0 z-[70] w-[290px] rounded-[20px] border border-[#EFEDF7] bg-white p-3.5 shadow-[0_26px_60px_rgba(46,16,101,0.18)]">
                      {/* مستوى العضوية */}
                      {tier?.name && (
                        <div
                          className="mb-3 flex flex-col gap-1 rounded-[14px] p-4"
                          style={{
                            background: `linear-gradient(135deg, ${tier.color || "#2B1B5E"} 0%, #2B1B5E 100%)`,
                          }}
                        >
                          <span className="text-[12px] text-white/70">
                            {t("home.navbar.membership_tier", "مستوى العضوية")}
                          </span>
                          <span className="text-[20px] font-bold text-white">{tier.name}</span>
                          {Number(tier.renewal_discount_percent) > 0 && (
                            <span className="text-[12px] text-white/80">
                              {t("home.navbar.tier_renewal_discount", "خصم على تجديد الاشتراك")}:{" "}
                              {Number(tier.renewal_discount_percent)}%
                            </span>
                          )}
                          {tier.next_tier?.name && Number(tier.next_tier.remaining_orders) > 0 && (
                            <span className="text-[11px] text-white/70">
                              {t("home.navbar.tier_progress", "باقي {{count}} طلبات للوصول إلى {{tier}}", {
                                count: Number(tier.next_tier.remaining_orders),
                                tier: tier.next_tier.name,
                              })}
                            </span>
                          )}
                        </div>
                      )}

                      {/* نظام النقاط مخفي — POINTS_ENABLED */}
                      {POINTS_ENABLED && (
                        <div className="mb-3 flex flex-col gap-1.5 rounded-[14px] bg-[#2B1B5E] p-4">
                          <span className="text-[12px] text-[#C4B5FD]">
                            {t("home.navbar.points_balance", "رصيد نقاطك")}
                          </span>
                          <span className="text-[24px] font-bold text-white" dir="ltr">
                            {points.toLocaleString("en-US")}
                          </span>
                        </div>
                      )}

                      <div className="flex flex-col gap-0.5">
                        {[
                          { to: "/profile", label: t("home.navbar.profile", "حسابي"), icon: LuUser },
                          { to: "/coupons", label: t("home.navbar.coupons", "كوبونز"), icon: LuTicket },
                          { to: "/saved", label: t("home.navbar.saved", "المفضلة"), icon: HeartIcon, badge: favoritesCount },
                          { to: "/orders", label: t("home.navbar.orders", "طلباتي"), icon: LuPackage },
                          { to: "/cards", label: t("home.navbar.cards", "البطاقات"), icon: LuCreditCard },
                          { to: "/wallet", label: t("home.navbar.wallet", "المحفظة"), icon: LuWallet },
                          { to: "/profile/referrals", label: t("referrals.menu"), icon: ShareIcon },
                          { to: "/profile/family", label: t("family.menu"), icon: LuUsers },
                        ].map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.to}
                              to={item.to}
                              onClick={() => setOpen(null)}
                              className="flex items-center gap-2.5 rounded-[11px] px-3 py-2.5 text-[13.5px] text-[#3D374E] transition-colors hover:bg-[#FBF9FF]"
                            >
                              <Icon size={17} className="opacity-80" />
                              <span className="flex-1 text-start">{item.label}</span>
                              {!!item.badge && item.badge > 0 && (
                                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-[10px] bg-[#F1EBFB] px-1.5 text-[11px] font-bold text-[#400198]">
                                  {item.badge}
                                </span>
                              )}
                            </Link>
                          );
                        })}

                        <button
                          onClick={() => {
                            logout();
                            setOpen(null);
                          }}
                          className="flex items-center gap-2.5 rounded-[11px] px-3 py-2.5 text-[13.5px] font-semibold text-[#400198] transition-colors hover:bg-[#FBF9FF]"
                        >
                          <LuLogOut size={17} className="opacity-80" />
                          <span className="flex-1 text-start">
                            {t("home.navbar.logout", "تسجيل الخروج")}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="mk-shine flex h-[40px] shrink-0 items-center whitespace-nowrap rounded-full bg-grad-brand px-4 text-[12.5px] font-extrabold text-white shadow-mk-glow transition-all duration-200 ease-out hover:-translate-y-0.5 sm:px-5 sm:text-[13px]"
              >
                {t("home.navbar.login", "تسجيل الدخول")}
              </Link>
            )}

            {/* قائمة جانبية (كل الصفحات) */}
            <button
              onClick={() => setIsSideMenuOpen(true)}
              aria-label="menu"
              className="hidden h-[40px] w-[40px] items-center justify-center rounded-full border border-[#ECE9F5] bg-white text-[#400198] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#400198] hover:bg-[#F2EFFA] lg:flex"
            >
              <LuMenu size={18} />
            </button>

            {/* قائمة الموبايل */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="mobile-menu"
              className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-[#F2EFFA] text-[#400198] lg:hidden"
            >
              {mobileOpen ? <LuX size={20} /> : <LuMenu size={20} />}
            </button>
          </div>
        </div>

        {/* القائمة الكبرى للتصنيفات */}
        {open === "offers" && categories.length > 0 && (
          <div
            data-dd="offers"
            className="absolute inset-x-0 top-full border-y border-[#EFEDF7] bg-white shadow-[0_26px_60px_rgba(46,16,101,0.14)]"
          >
            <div className="mx-auto w-full max-w-site px-4 pb-8 pt-7 sm:px-6">
              <div className="mb-[18px] flex flex-col items-start gap-1">
                <span className="text-[19px] font-extrabold tracking-[-0.01em] text-[#400198]">
                  {t("home.categories_new.title", "التصنيفات")}
                </span>
                <span className="h-[4px] w-[54px] rounded-full bg-grad-accent" />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                {categories.slice(0, 7).map((category, i) => {
                  const color = pick(i);
                  const Icon = MEGA_ICONS[i % MEGA_ICONS.length];
                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        setOpen(null);
                        navigate(
                          category.slug
                            ? `/offers/${category.slug}`
                            : `/offers?category=${category.id}`,
                        );
                      }}
                      className="mk-lift group flex flex-col items-center justify-center gap-3 rounded-mk-xl border px-2.5 py-[22px]"
                      style={{ background: color.bg, borderColor: color.bg }}
                    >
                      <span
                        className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full text-white shadow-[0_8px_18px_-8px_rgba(46,16,101,0.8)] transition-transform duration-200 group-hover:scale-110"
                        style={{ backgroundImage: `linear-gradient(135deg, ${color.c}, ${color.c}CC)` }}
                      >
                        {category.image ? (
                          <img
                            src={category.image}
                            alt=""
                            className="h-6 w-6 object-contain brightness-0 invert"
                          />
                        ) : (
                          <Icon size={22} />
                        )}
                      </span>
                      <span className="text-center text-[13px] font-extrabold leading-[1.5] text-[#2B1B5E]">
                        {category.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* قائمة الموبايل المنسدلة */}
        {mobileOpen && (
          <div className="border-t border-[#EFEDF7] bg-white px-4 py-3 lg:hidden">
            <div className="flex flex-col gap-1">
              {[{ to: "/offers", label: t("home.navbar.offers", "العروض"), icon: LuPercent }, ...navItems].map(
                (item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2.5 rounded-[11px] px-3 py-3 text-[14px] font-semibold text-[#2B1B5E] hover:bg-[#F2EFFA]"
                    >
                      <Icon size={18} className="text-[#400198]" />
                      {item.label}
                    </Link>
                  );
                },
              )}
            </div>
          </div>
        )}
      </header>

      <SideMenu isOpen={isSideMenuOpen} onClose={() => setIsSideMenuOpen(false)} />

      {isSearchOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 p-4 pt-24"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#400198]">
                {isRTL ? "ابحث في العروض" : "Search Offers"}
              </h3>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                aria-label="close"
                className="text-gray-400 hover:text-gray-600"
              >
                <LuX size={22} />
              </button>
            </div>
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <LuSearch
                  className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRTL ? "right-4" : "left-4"}`}
                  size={20}
                />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isRTL ? "اكتب اسم العرض أو التاجر..." : "Type offer or merchant name..."
                  }
                  className={`w-full rounded-full border-2 border-gray-200 py-3 transition-colors focus:border-[#400198] focus:outline-none ${
                    isRTL ? "pe-12 ps-4" : "ps-12 pe-4"
                  }`}
                />
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="rounded-full border border-gray-300 px-5 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {isRTL ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={!searchQuery.trim()}
                  className="rounded-full bg-[#400198] px-6 py-2 text-sm text-white transition-colors hover:bg-[#2B1B5E] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRTL ? "بحث" : "Search"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
