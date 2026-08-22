"use client";

import { useMemo, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { LuSearch } from "react-icons/lu";
import { t } from "i18next";
import { CONTAINER } from "./tokens";
import { useCityStore } from "@stores/cityStore";

interface CityItem {
  id: number;
  name: string;
  offers_count?: number;
}

interface Props {
  cities: CityItem[];
  pool: { title: string; meta: string; href: string }[];
}

/** شريط البحث: منتقي مدينة + بحث حي على العروض والكوبونات والمتاجر */
const SearchBar: React.FC<Props> = ({ cities, pool }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { cityId, setCity } = useCityStore();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return pool
      .filter((item) => item.title.toLowerCase().includes(q) || item.meta.toLowerCase().includes(q))
      .slice(0, 6);
  }, [query, pool]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/offers?search=${encodeURIComponent(q)}` : "/offers");
  };

  return (
    <section className={`${CONTAINER} pt-7`}>
      <form
        onSubmit={submit}
        className="flex flex-wrap items-center gap-3 rounded-[16px] border border-[#E9E4F5] bg-white p-3 shadow-[0_8px_30px_rgba(46,16,101,0.06)]"
      >
        <select
          value={cityId ?? ""}
          onChange={(e) => {
            const id = e.target.value ? Number(e.target.value) : null;
            const name = cities.find((c) => c.id === id)?.name ?? null;
            setCity(id, name);
          }}
          className="h-12 cursor-pointer rounded-[12px] border border-[#E9E4F5] bg-[#F6F3FC] px-3.5 text-[14px] font-semibold text-[#2E1065] outline-none"
        >
          <option value="">{t("home.search_new.all_cities", "جميع المدن")}</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t(
            "home.search_new.placeholder",
            "ابحث عن متجر، مطعم، عرض، كوبون أو بطاقة...",
          )}
          className="h-12 min-w-[160px] flex-1 border-0 bg-transparent text-[15px] text-[#17122A] outline-none"
        />

        <button
          type="submit"
          aria-label="search"
          className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#4C1D95] text-white transition-colors hover:bg-[#2E1065]"
        >
          <LuSearch size={19} />
        </button>
      </form>

      {query.trim().length > 0 && (
        <div className="mt-2.5 overflow-hidden rounded-[14px] border border-[#E9E4F5] bg-white">
          {results.map((r, i) => (
            <button
              key={`${r.href}-${i}`}
              onClick={() => navigate(r.href)}
              className="flex w-full items-center justify-between border-b border-[#F3F0FA] px-4 py-3.5 text-start text-[14px] transition-colors last:border-b-0 hover:bg-[#FBF9FF]"
            >
              <span className="font-semibold text-[#17122A]">{r.title}</span>
              <span className="text-[13px] text-[#6B6480]">{r.meta}</span>
            </button>
          ))}
          {results.length === 0 && (
            <div className="px-4 py-4 text-[14px] text-[#6B6480]">
              {t("home.search_new.empty", "لا توجد نتائج مطابقة لبحثك.")}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default SearchBar;
