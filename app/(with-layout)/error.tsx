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

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh", fontFamily: "sans-serif", direction: "rtl" }}>
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>حدث خطأ في تحميل الصفحة</h2>
        <button
          onClick={() => reset()}
          style={{ padding: "0.75rem 1.5rem", backgroundColor: "#400198", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "1rem" }}
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
