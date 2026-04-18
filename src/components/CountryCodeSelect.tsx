"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";

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
  return [...iso.toUpperCase()]
    .map((c) => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)))
    .join("");
}

function buildDial(root?: string, suffixes?: string[]): string | null {
  const r = (root ?? "").replace(/\D/g, "");
  const s = (suffixes?.[0] ?? "").replace(/\D/g, "");
  const dial = `${r}${s}`.replace(/\D/g, "");
  return dial || null;
}

export default function CountryCodeSelect({ value, onChange, className }: Props) {
  const [countries, setCountries] = useState<CountryMeta[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Detect user's country and fetch countries list
  useEffect(() => {
    (async () => {
      // Detect user's country via IP geolocation
      let detectedIso: string | null = null;
      try {
        // ip-api.com is free, no API key needed
        const geoRes = await fetch("http://ip-api.com/json/?fields=countryCode", { signal: AbortSignal.timeout(3000) });
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          const cc = String(geoData?.countryCode ?? "").toUpperCase();
          if (cc && cc.length === 2) detectedIso = cc;
        }
      } catch {
        // Silently fail - will use default
      }

      const res = await fetch(
        "https://restcountries.com/v3.1/all?fields=name,cca2,idd"
      );
      const data = (await res.json()) as Record<string, unknown>[];

      const list: CountryMeta[] = [];
      for (const c of data ?? []) {
        const iso = String((c as any)?.cca2 ?? "").toUpperCase();
        if (!iso || iso.length !== 2) continue;
        const dial = buildDial((c as any)?.idd?.root, (c as any)?.idd?.suffixes);
        if (!dial) continue;
        const name = String((c as any)?.name?.common ?? "").trim();
        list.push({ iso, name: name || iso, dial, flag: isoToFlag(iso) });
      }

      list.sort((a, b) => a.name.localeCompare(b.name, "en"));
      setCountries(list);

      // Auto-select user's country based on detected ISO code
      if (detectedIso) {
        const match = list.find((c) => c.iso === detectedIso);
        if (match) onChange(match.dial);
      }
    })().catch(() => {
      setCountries([
        { iso: "SA", name: "Saudi Arabia", dial: "966", flag: "🇸🇦" },
      ]);
    });
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
