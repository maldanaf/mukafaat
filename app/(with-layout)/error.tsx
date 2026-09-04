"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // removeChild errors from DOM mutations (browser extensions, etc) - auto-recover
    if (
      error.message?.includes("removeChild") ||
      error.message?.includes("parentNode") ||
      error.message?.includes("deletedFiber")
    ) {
      // Hard reload the *intended* destination URL so an interrupted navigation
      // doesn't leave the user stuck on the previous page.
      if (typeof window !== "undefined") {
        window.location.replace(window.location.href);
        return;
      }
      reset();
      return;
    }
    console.error("[Error Boundary]", error);
  }, [error, reset]);

  /**
   * لغة الرسالة تتبع لغة الموقع لا العربية دائماً.
   *
   * حدود الخطأ تعمل خارج مزوّد الترجمة (قد يكون هو نفسه ما انهار)،
   * فنقرأ اللغة من عنصر <html> مباشرةً بدل useTranslation.
   */
  const lang =
    typeof document !== "undefined"
      ? document.documentElement.lang || "ar"
      : "ar";
  const isRTL = lang === "ar" || lang === "ur";

  const COPY: Record<string, { title: string; retry: string; hint: string }> = {
    ar: {
      title: "حدث خطأ في تحميل البيانات",
      retry: "إعادة المحاولة",
      hint: "تعذّر الوصول إلى الخادم. جرّب مرة أخرى.",
    },
    en: {
      title: "Failed to load data",
      retry: "Try again",
      hint: "We couldn't reach the server. Please try again.",
    },
    ur: {
      title: "ڈیٹا لوڈ کرنے میں خرابی",
      retry: "دوبارہ کوشش کریں",
      hint: "سرور تک رسائی ممکن نہیں۔ دوبارہ کوشش کریں۔",
    },
    hi: {
      title: "डेटा लोड करने में त्रुटि",
      retry: "पुनः प्रयास करें",
      hint: "सर्वर तक नहीं पहुँच सके। कृपया पुनः प्रयास करें।",
    },
  };

  const copy = COPY[lang] ?? COPY.ar;

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "60vh",
        fontFamily: "inherit",
      }}
    >
      <div style={{ textAlign: "center", padding: "2rem", maxWidth: 420 }}>
        <div
          aria-hidden
          style={{
            width: 64,
            height: 64,
            margin: "0 auto 1rem",
            borderRadius: "50%",
            background: "#F2EFFA",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 30,
          }}
        >
          ⚠️
        </div>

        <h2 style={{ fontSize: "1.35rem", marginBottom: "0.5rem", color: "#1A1A2E" }}>
          {copy.title}
        </h2>
        <p style={{ fontSize: "0.95rem", color: "#6B6880", marginBottom: "1.25rem" }}>
          {copy.hint}
        </p>

        <button
          onClick={() => reset()}
          style={{
            padding: "0.75rem 1.75rem",
            background: "linear-gradient(135deg,#400198 0%,#6703EB 100%)",
            color: "white",
            border: "none",
            borderRadius: 999,
            cursor: "pointer",
            fontSize: "0.95rem",
            fontWeight: 700,
          }}
        >
          {copy.retry}
        </button>
      </div>
    </div>
  );
}
