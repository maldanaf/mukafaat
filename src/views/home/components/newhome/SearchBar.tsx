"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { LuSearch, LuMapPin, LuChevronDown, LuArrowRight } from "react-icons/lu";
import { t } from "i18next";
import { CONTAINER } from "./tokens";
import { FOCUS } from "@ui";
import { useCityStore } from "@stores/cityStore";

interface CityItem {
  id: number;
  name: string;
  offers_count?: number;
}

interface Props {
  cities: CityItem[];
  pool: { title: string; meta: string; href: string }[];
  /** يرفع البطاقة فوق حدّ الهيرو عندما يأتي شريط البحث مباشرةً بعده */
  overlap?: boolean;
}

/** شريط البحث: منتقي مدينة + بحث حي على العروض والكوبونات والمتاجر */
const SearchBar: React.FC<Props> = ({ cities, pool, overlap = false }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const { cityId, setCity } = useCityStore();
  const boxRef = useRef<HTMLDivElement | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return pool
      .filter((item) => item.title.toLowerCase().includes(q) || item.meta.toLowerCase().includes(q))
      .slice(0, 6);
  }, [query, pool]);

  const showResults = open && query.trim().length > 0;

  // إغلاق النتائج بالنقر خارج البطاقة أو بمفتاح Esc
  useEffect(() => {
    if (!showResults) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [showResults]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/offers?search=${encodeURIComponent(q)}` : "/offers");
  };

  const activeCity = cities.find((c) => c.id === cityId);

  return (
    <section
      className={`${CONTAINER} relative z-20 ${
        overlap ? "-mt-7 pt-0 sm:-mt-9 lg:-mt-11" : "pt-7"
      }`}
    >
      <div ref={boxRef} className="relative mx-auto max-w-[1000px]">
        <form
          onSubmit={submit}
          role="search"
          className="flex flex-wrap items-center gap-2 rounded-[22px] border border-[#EFEDF7] bg-white p-2.5 shadow-[0_18px_50px_-16px_rgba(46,16,101,0.28)] transition-shadow duration-300 focus-within:border-[#C9BCEC] focus-within:shadow-[0_22px_60px_-16px_rgba(46,16,101,0.38)] sm:gap-3 sm:p-3"
        >
          {/* منتقي المدينة — يبدو زرّ فلترة، والـ select شفاف فوقه */}
          <label
            className={`relative flex h-[52px] shrink-0 cursor-pointer items-center gap-2 rounded-[16px] bg-[#F2EFFA] px-3.5 text-[#400198] transition-colors hover:bg-[#EAE3FA] sm:px-4 ${FOCUS} focus-within:ring-2`}
          >
            <LuMapPin size={18} className="shrink-0" aria-hidden />
            <span className="max-w-[120px] truncate text-[13.5px] font-bold sm:text-[14px]">
              {activeCity?.name ?? t("home.search_new.all_cities", "جميع المدن")}
            </span>
            <LuChevronDown size={15} className="shrink-0 opacity-70" aria-hidden />
            <select
              value={cityId ?? ""}
              aria-label={t("home.search_new.city_label", "اختر المدينة")}
              onChange={(e) => {
                const id = e.target.value ? Number(e.target.value) : null;
                const name = cities.find((c) => c.id === id)?.name ?? null;
                setCity(id, name);
              }}
              className="absolute inset-0 cursor-pointer opacity-0"
            >
              <option value="">{t("home.search_new.all_cities", "جميع المدن")}</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </label>

          <span aria-hidden className="hidden h-8 w-px bg-[#ECE9F5] sm:block" />

          {/* حقل البحث مع أيقونة داخلية */}
          <div className="flex h-[52px] min-w-[180px] flex-1 items-center gap-2.5">
            <LuSearch size={20} className="shrink-0 text-[#9A99B0]" aria-hidden />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              aria-label={t("home.search_new.placeholder", "ابحث عن متجر، مطعم، عرض، كوبون أو بطاقة...")}
              placeholder={t(
                "home.search_new.placeholder",
                "ابحث عن متجر، مطعم، عرض، كوبون أو بطاقة...",
              )}
              className="h-full w-full min-w-0 border-0 bg-transparent text-[15px] text-[#1A1A2E] outline-none placeholder:text-[#9A99B0]"
            />
          </div>

          <button
            type="submit"
            className={`flex h-[52px] shrink-0 items-center gap-2 rounded-[16px] bg-[linear-gradient(135deg,#400198,#6703EB)] px-5 text-[14px] font-bold text-white shadow-[0_10px_26px_-8px_rgba(64,1,152,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_-8px_rgba(64,1,152,0.85)] sm:px-7 ${FOCUS}`}
          >
            <LuSearch size={18} className="sm:hidden" aria-hidden />
            <span className="hidden sm:inline">{t("home.search_new.submit", "ابحث")}</span>
          </button>
        </form>

        {/* نتائج فورية — نفس منطق البحث السابق، بعرض أوضح */}
        {showResults && (
          <div className="mk-fade-in absolute inset-x-0 top-full z-30 mt-2.5 overflow-hidden rounded-[18px] border border-[#ECE9F5] bg-white shadow-[0_24px_60px_-18px_rgba(46,16,101,0.34)]">
            {results.map((r, i) => (
              <button
                key={`${r.href}-${i}`}
                type="button"
                onClick={() => navigate(r.href)}
                className={`group flex w-full items-center gap-3 border-b border-[#F3F0FA] px-4 py-3.5 text-start text-[14px] transition-colors last:border-b-0 hover:bg-[#FBF9FF] ${FOCUS} focus-visible:ring-inset`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#F2EFFA] text-[#400198] transition-colors group-hover:bg-[#400198] group-hover:text-white">
                  <LuSearch size={16} aria-hidden />
                </span>
                <span className="min-w-0 flex-1 truncate font-semibold text-[#1A1A2E]">
                  {r.title}
                </span>
                <span className="shrink-0 text-[12.5px] text-[#6B6B85]">{r.meta}</span>
                <LuArrowRight
                  size={16}
                  aria-hidden
                  className="shrink-0 text-[#C9BCEC] opacity-0 transition-all group-hover:opacity-100 rtl:-scale-x-100"
                />
              </button>
            ))}
            {results.length === 0 && (
              <div className="px-4 py-5 text-center text-[14px] text-[#6B6B85]">
                {t("home.search_new.empty", "لا توجد نتائج مطابقة لبحثك.")}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default SearchBar;
