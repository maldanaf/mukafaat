"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { COUNTRIES, type Country } from "@data/countries";
import { api } from "@network/apiClient";
import { API_ENDPOINTS } from "@network/apiEndpoints";

type CountryMeta = {
  iso: string;
  name: string;
  dial: string;
  flag: string;
};

type Props = {
  value: string;
  onChange: (nextCountryCode: string) => void;
  className?: string;
};

function isoToFlag(iso: string): string {
  if (!iso || iso.length !== 2) return "";
  return [...iso.toUpperCase()]
    .map((c) => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)))
    .join("");
}

export default function CountryCodeSelect({ value, onChange, className }: Props) {
  const { i18n } = useTranslation();
  const isArabic = (i18n.language || "").toLowerCase().startsWith("ar");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  // القائمة من قاعدة البيانات (يتحكم بها الأدمن). القائمة المحلية fallback فقط.
  const [source, setSource] = useState<Country[]>(COUNTRIES);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // جلب الدول من الـ API؛ عند الفشل تبقى القائمة المحلية.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(API_ENDPOINTS.phoneCodes);
        const list = res?.data?.data?.phone_codes;
        if (cancelled || !Array.isArray(list) || list.length === 0) return;
        setSource(
          list.map((c: any) => ({
            iso: String(c.iso ?? "").toUpperCase(),
            ar: String(c.name_ar ?? c.name_en ?? ""),
            en: String(c.name_en ?? c.name_ar ?? ""),
            dial: String(c.dial_code ?? "").replace(/\D/g, ""),
          })),
        );
      } catch {
        // نبقى على القائمة المحلية.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // نرتّب حسب اللغة الحالية (الترتيب القادم من الأدمن محفوظ أصلاً في الـ API).
  const countries = useMemo<CountryMeta[]>(() => {
    return source.map((c) => ({
      iso: c.iso,
      name: isArabic ? c.ar : c.en,
      dial: c.dial,
      flag: isoToFlag(c.iso),
    }));
  }, [source, isArabic]);

  // كشف دولة المستخدم عبر IP لاختيارها افتراضيًا (اختياري — يفشل بصمت).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // نستخدم https لتفادي حظر المحتوى المختلط على المواقع الآمنة.
        const geoRes = await fetch("https://ipapi.co/country/", {
          signal: AbortSignal.timeout(3000),
        });
        if (!geoRes.ok) return;
        const cc = (await geoRes.text()).trim().toUpperCase();
        if (cancelled || cc.length !== 2) return;
        // لا نغيّر اختيار المستخدم إن سبق أن اختار رمزًا يدويًا.
        if (String(value ?? "").replace(/\D/g, "")) return;
        const match = COUNTRIES.find((c) => c.iso === cc);
        if (match) onChange(match.dial);
      } catch {
        // نتجاهل الفشل — تبقى القائمة كاملة والاختيار الافتراضي السعودية.
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Focus search when opened
  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

  const selected = useMemo(() => {
    const target = String(value ?? "").replace(/\D/g, "");
    return countries.find((c) => c.dial === target) || countries[0];
  }, [countries, value]);

  const filtered = useMemo(() => {
    if (!search.trim()) return countries;
    const q = search.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.iso.toLowerCase().includes(q)
    );
  }, [countries, search]);

  const handleSelect = useCallback(
    (country: CountryMeta) => {
      onChange(country.dial);
      setOpen(false);
      setSearch("");
    },
    [onChange]
  );

  return (
    <div ref={containerRef} className={`relative ${className || ""}`}>
      {/* Selected button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-50 transition-colors"
      >
        {selected && (
          <>
            <span className="text-lg leading-none">{selected.flag}</span>
            <span className="text-sm font-medium text-gray-700">
              +{selected.dial}
            </span>
          </>
        )}
        <svg
          className={`w-3 h-3 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-[99999] overflow-hidden"
          style={{ left: 0 }}
        >
          {/* Search */}
          <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن الدولة..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {/* Options */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">
                لا توجد نتائج
              </div>
            ) : (
              filtered.map((country) => (
                <button
                  key={country.iso}
                  type="button"
                  onClick={() => handleSelect(country)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors text-start ${
                    selected?.iso === country.iso
                      ? "bg-primary/5 text-primary font-medium"
                      : "text-gray-700"
                  }`}
                >
                  <span className="text-lg leading-none flex-shrink-0">
                    {country.flag}
                  </span>
                  <span className="flex-1 truncate">{country.name}</span>
                  <span className="text-gray-400 flex-shrink-0 font-mono text-xs">
                    +{country.dial}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
