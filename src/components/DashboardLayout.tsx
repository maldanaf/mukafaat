"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@hooks";
import { useUserStore } from "@stores/userStore";
import { useHydrated } from "@hooks/useHydrated";
import DashboardSidebar from "./DashboardSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const user = useUserStore((s) => s.user);
  const hydrated = useHydrated();

  // Wait for Zustand to hydrate from localStorage before rendering
  // This prevents false redirect to login on page refresh
  if (!hydrated) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-mk-bg"
        style={{ marginTop: "77px" }}
        role="status"
        aria-label="loading"
      >
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-mk-border-strong border-t-mk-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-mk-bg" style={{ marginTop: "77px" }}>
        {children}
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-mk-bg pb-12"
      style={{ marginTop: "77px", minHeight: "calc(-76px + 70vh)" }}
    >
      <div className="container mx-auto px-4 pt-6">
        <h1 className="mb-6 text-[24px] font-bold text-mk-text sm:text-[28px]">
          {t("profileDashboard.title")}
        </h1>
        <div
          dir={isRTL ? "rtl" : "ltr"}
          className="flex flex-col gap-6 lg:flex-row lg:items-start"
        >
          <aside className="w-full shrink-0 lg:order-1 lg:w-72">
            <div className="lg:sticky lg:top-24">
              <DashboardSidebar />
            </div>
          </aside>
          <main className="min-w-0 flex-1 lg:order-2">
            <div className="dashboard-content-reset">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
