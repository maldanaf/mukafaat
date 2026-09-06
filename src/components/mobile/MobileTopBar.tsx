"use client";

import { useState } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { LuMapPin, LuChevronDown, LuSearch, LuX } from "react-icons/lu";
import { IconButton, NotificationBell, FOCUS } from "@ui";
import { Logo } from "@assets";
import { useCityStore } from "@stores/cityStore";
import { useWebHome } from "@hooks/api/useMokafaatQueries";
import { useUserStore } from "@stores/userStore";
import { useHydrated } from "@hooks/useHydrated";

/**
 * الشريط العلوي لنسخة الموبايل — بأسلوب تطبيقات الجوال:
 * موقع المستخدم + الشعار + بحث وإشعارات. يظهر أقل من lg فقط.
 */
const MobileTopBar: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const [cityOpen, setCityOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const { isAuthenticated } = useUserStore();
  const { cityId, cityName, setCity } = useCityStore();
  const { data: homeData } = useWebHome();
  const cities: Record<string, any>[] = (homeData as any)?.data?.cities ?? [];

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearchOpen(false);
    setQuery("");
    // المتاجر وجهة البحث كما في نسخة سطح المكتب
    navigate(`/stores?search=${encodeURIComponent(q)}`);
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-mk-border bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur-md lg:hidden">
        {/* خط تدرّج رفيع يربط الشريط بهوية الاتجاه الحيوي */}
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-[2px] bg-grad-accent opacity-90" />
        <div className="flex h-14 items-center gap-2 px-4">
          {/* المدينة */}
          <button
            onClick={() => setCityOpen((v) => !v)}
            aria-label={t("home.navbar.choose_city", "اختر مدينتك")}
            aria-expanded={cityOpen}
            className={`flex min-h-[44px] min-w-0 items-center gap-1 rounded-full border border-mk-border bg-mk-tint2 px-2.5 text-[12px] font-bold text-mk-deep transition-colors hover:bg-mk-tint ${FOCUS}`}
          >
            <LuMapPin size={14} className="shrink-0 text-mk-primary" aria-hidden />
            <span className="max-w-[74px] truncate">
              {cityName || t("home.search_new.all_cities", "جميع المدن")}
            </span>
            <LuChevronDown size={13} className="shrink-0 opacity-60" />
          </button>

          <Link to="/" className="mx-auto flex items-center">
            <img src={Logo} alt="مكافآت" className="h-7 w-auto" />
          </Link>

          <div className="flex items-center gap-1">
            <IconButton
              label={t("ui.searchPlaceholder", "ابحث…")}
              tone="soft"
              onClick={() => setSearchOpen(true)}
              renderIcon={(s) => <LuSearch size={s} />}
            />
            {hydrated && isAuthenticated && <NotificationBell />}
          </div>
        </div>

        {/* قائمة المدن */}
        {cityOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/30"
              onClick={() => setCityOpen(false)}
            />
            <div className="absolute inset-x-3 top-[calc(100%+6px)] z-50 max-h-[60vh] overflow-y-auto rounded-mk-xl border border-mk-border bg-white p-2 shadow-mk-float">
              <div className="px-2.5 pb-2 pt-1 text-[11px] font-semibold text-mk-faint">
                {t("home.navbar.choose_city", "اختر مدينتك")}
              </div>
              <button
                onClick={() => {
                  setCity(null, null);
                  setCityOpen(false);
                }}
                className={`flex min-h-[48px] w-full items-center justify-between rounded-mk-md px-3 text-[14px] ${
                  cityId === null ? "bg-mk-tint2 font-semibold text-mk-primary" : "text-mk-text-strong"
                } ${FOCUS}`}
              >
                <span>{t("home.search_new.all_cities", "جميع المدن")}</span>
              </button>
              {cities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => {
                    setCity(city.id, city.name);
                    setCityOpen(false);
                  }}
                  className={`flex min-h-[48px] w-full items-center justify-between rounded-mk-md px-3 text-[14px] ${
                    cityId === city.id
                      ? "bg-mk-tint2 font-semibold text-mk-primary"
                      : "text-mk-text-strong"
                  } ${FOCUS}`}
                >
                  <span>{city.name}</span>
                  <span className="text-[11px] text-mk-faint" dir="ltr">
                    {city.offers_count ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </header>

      {/* بحث بملء الشاشة */}
      {searchOpen && (
        <div className="fixed inset-0 z-[80] bg-white lg:hidden">
          <form onSubmit={submitSearch} className="flex items-center gap-2 border-b border-mk-border p-3 pt-[calc(env(safe-area-inset-top)+12px)]">
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label={t("orders.close", "إغلاق")}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mk-tint2 text-mk-primary ${FOCUS}`}
            >
              <LuX size={18} />
            </button>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("home.search_new.placeholder", "ابحث عن متجر، مطعم، عرض...")}
              className="h-12 min-w-0 flex-1 rounded-full border border-mk-border-2 bg-mk-tint3 px-4 text-[14px] text-mk-text outline-none placeholder:text-mk-faint"
            />
            <button
              type="submit"
              aria-label={t("ui.searchPlaceholder", "ابحث…")}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-grad-brand text-white shadow-mk-glow ${FOCUS}`}
            >
              <LuSearch size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default MobileTopBar;
