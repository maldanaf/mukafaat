"use client";

import { useState } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { LuMapPin, LuChevronDown, LuBell, LuSearch, LuX } from "react-icons/lu";
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
    navigate(`/offers?search=${encodeURIComponent(q)}`);
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#EDE9F7] bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur-md lg:hidden">
        <div className="flex h-14 items-center gap-2 px-4">
          {/* المدينة */}
          <button
            onClick={() => setCityOpen((v) => !v)}
            className="flex min-w-0 items-center gap-1 rounded-full bg-[#F6F3FC] px-2.5 py-1.5 text-[12px] font-semibold text-[#2E1065]"
          >
            <LuMapPin size={14} className="shrink-0 text-[#4C1D95]" />
            <span className="max-w-[74px] truncate">
              {cityName || t("home.search_new.all_cities", "جميع المدن")}
            </span>
            <LuChevronDown size={13} className="shrink-0 opacity-60" />
          </button>

          <Link to="/" className="mx-auto flex items-center">
            <img src={Logo} alt="مكافآت" className="h-7 w-auto" />
          </Link>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="search"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F6F3FC] text-[#4C1D95]"
            >
              <LuSearch size={17} />
            </button>
            {hydrated && isAuthenticated && (
              <Link
                to="/profile/notifications"
                aria-label="notifications"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F6F3FC] text-[#4C1D95]"
              >
                <LuBell size={17} />
              </Link>
            )}
          </div>
        </div>

        {/* قائمة المدن */}
        {cityOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/30"
              onClick={() => setCityOpen(false)}
            />
            <div className="absolute inset-x-3 top-[calc(100%+6px)] z-50 max-h-[60vh] overflow-y-auto rounded-2xl border border-[#EDE9F7] bg-white p-2 shadow-[0_20px_50px_rgba(46,16,101,0.18)]">
              <div className="px-2.5 pb-2 pt-1 text-[11px] font-semibold text-[#8B84A0]">
                {t("home.navbar.choose_city", "اختر مدينتك")}
              </div>
              <button
                onClick={() => {
                  setCity(null, null);
                  setCityOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl p-3 text-[14px] ${
                  cityId === null ? "bg-[#F6F3FC] font-semibold text-[#4C1D95]" : "text-[#4A4459]"
                }`}
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
                  className={`flex w-full items-center justify-between rounded-xl p-3 text-[14px] ${
                    cityId === city.id
                      ? "bg-[#F6F3FC] font-semibold text-[#4C1D95]"
                      : "text-[#4A4459]"
                  }`}
                >
                  <span>{city.name}</span>
                  <span className="text-[11px] text-[#8B84A0]" dir="ltr">
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
          <form onSubmit={submitSearch} className="flex items-center gap-2 border-b border-[#EDE9F7] p-3 pt-[calc(env(safe-area-inset-top)+12px)]">
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label="close"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F6F3FC] text-[#4C1D95]"
            >
              <LuX size={18} />
            </button>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("home.search_new.placeholder", "ابحث عن متجر، مطعم، عرض...")}
              className="h-11 flex-1 rounded-full border border-[#E9E4F5] bg-[#FBF9FF] px-4 text-[14px] outline-none"
            />
            <button
              type="submit"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#4C1D95] text-white"
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
