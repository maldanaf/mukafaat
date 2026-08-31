"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { useIsRTL } from "@hooks";
import { useWebPopupAds } from "@hooks/api/useMokafaatQueries";
import { useTranslation } from "react-i18next";

type PopupAd = {
  id: number;
  title: string;
  image: string;
  link_type?: string | null;
  link_id?: number | null;
  link_url?: string | null;
  target_screen?: string | null; // "all" | "home" | ...
  show_once?: boolean | null;
  display_frequency?: string | null; // every_visit | ...
  display_interval_hours?: number | null;
};

function safeNow() {
  return Date.now();
}

function lsGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function lsSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}
function ssGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
function ssSet(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

/** تأخير قصير قبل الظهور حتى لا يخنق الإعلانُ الانطباعَ الأول للصفحة */
const SHOW_DELAY_MS = 2500;

function shouldShowAd(ad: PopupAd, screen: string): boolean {
  const target = (ad.target_screen || "all").toLowerCase();
  if (target !== "all" && target !== screen.toLowerCase()) return false;

  const once = Boolean(ad.show_once);
  const id = String(ad.id);
  const shownOnceKey = `popup_ad:${id}:shown_once`;
  const shownAtKey = `popup_ad:${id}:shown_at`;
  const sessionShownKey = `popup_ad:${id}:session_shown`;

  if (once && lsGet(shownOnceKey) === "1") return false;

  // Avoid re-opening multiple times in same tab session
  if (ssGet(sessionShownKey) === "1") return false;

  const intervalHours =
    ad.display_interval_hours != null
      ? Number(ad.display_interval_hours)
      : null;
  if (intervalHours && Number.isFinite(intervalHours) && intervalHours > 0) {
    const last = Number(lsGet(shownAtKey) ?? "");
    if (Number.isFinite(last) && last > 0) {
      const diffMs = safeNow() - last;
      if (diffMs < intervalHours * 60 * 60 * 1000) return false;
    }
  }

  // display_frequency "every_visit" => show (but our session guard prevents spam)
  return true;
}

export default function PopupAdsModal({ screen }: { screen: string }) {
  const isRTL = useIsRTL();
  const { t } = useTranslation();
  const { data } = useWebPopupAds(screen);
  const [open, setOpen] = useState(false);
  const [activeAd, setActiveAd] = useState<PopupAd | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const adRef = useRef<PopupAd | null>(null);

  const popupAds = useMemo(() => {
    const root = (data as Record<string, unknown>) ?? {};
    const inner = (root.data as Record<string, unknown>) ?? root;
    const payload = (inner.data as Record<string, unknown>) ?? inner;
    const list = (payload.popup_ads as unknown) ?? [];
    return Array.isArray(list) ? (list as PopupAd[]) : [];
  }, [data]);

  useEffect(() => {
    if (!popupAds || popupAds.length === 0) return;
    const candidate = popupAds.find((ad) => shouldShowAd(ad, screen));
    if (!candidate) return;
    // مرة واحدة لكل جلسة — نُعلّمها فوراً حتى لا يتكرر الظهور عند إعادة الرسم
    ssSet(`popup_ad:${candidate.id}:session_shown`, "1");
    // تأخير قصير: يشاهد الزائر الصفحة أولاً ثم يظهر الإعلان
    const timer = setTimeout(() => {
      adRef.current = candidate;
      setActiveAd(candidate);
      setOpen(true);
    }, SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [popupAds, screen]);

  const close = useCallback(() => {
    const ad = adRef.current;
    if (ad) {
      const id = String(ad.id);
      lsSet(`popup_ad:${id}:shown_at`, String(safeNow()));
      if (ad.show_once) lsSet(`popup_ad:${id}:shown_once`, "1");
    }
    setOpen(false);
  }, []);

  // الإغلاق بمفتاح Esc + تثبيت التمرير خلف النافذة + تركيز زر الإغلاق
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = setTimeout(() => closeRef.current?.focus(), 60);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      clearTimeout(focusTimer);
    };
  }, [open, close]);

  if (!open || !activeAd) return null;

  const handleClickAd = () => {
    const url =
      activeAd.link_type === "url"
        ? String(activeAd.link_url ?? "")
        : String(activeAd.link_url ?? "");
    if (url && url.trim()) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    close();
  };

  return (
    <>
      <div
        className="mk-fade-in fixed inset-0 z-[9998] bg-[rgba(15,6,44,0.62)] backdrop-blur-sm"
        onClick={close}
        aria-hidden="true"
      />
      <div
        className="mk-pop-in fixed left-1/2 top-1/2 z-[9999] w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[24px] bg-white shadow-[0_40px_90px_-24px_rgba(15,6,44,0.7)]"
        style={{ direction: isRTL ? "rtl" : "ltr" }}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          ref={closeRef}
          onClick={close}
          className="absolute top-3 end-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#1A1A2E] shadow-[0_8px_24px_-6px_rgba(15,6,44,0.5)] transition-all duration-200 hover:scale-105 hover:bg-[#F2EFFA] hover:text-[#400198] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#400198] focus-visible:ring-offset-2"
          aria-label={t("popupAds.close", "إغلاق")}
        >
          <IoMdClose className="text-2xl" />
        </button>

        <button
          type="button"
          onClick={handleClickAd}
          className="w-full text-start group"
        >
          <div className="w-full aspect-[16/9] bg-gray-100 overflow-hidden">
            <img
              src={activeAd.image}
              alt={activeAd.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="p-5">
            <h3 className="text-base font-bold text-gray-900 leading-snug">
              {activeAd.title}
            </h3>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#400198]/10 text-[#400198] px-4 py-2 text-sm font-semibold group-hover:bg-[#400198]/15 transition-colors">
                {t("popupAds.cta", "اضغط لعرض التفاصيل")}
              </span>
              <span className="text-[#fd671a] text-sm font-bold group-hover:translate-x-0.5 transition-transform">
                {isRTL ? "←" : "→"}
              </span>
            </div>
          </div>
        </button>
      </div>
    </>
  );
}
