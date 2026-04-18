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
        className="min-h-screen bg-gray-50 flex items-center justify-center"
        style={{ marginTop: "77px" }}
      >
        <div className="w-8 h-8 border-3 border-gray-200 border-t-[#440798] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50" style={{ marginTop: "77px" }}>
        {children}
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50 pb-12"
      style={{ marginTop: "77px", minHeight: "calc(-76px + 70vh)" }}
    >
      <div className="container mx-auto px-4 pt-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {t("profileDashboard.title")}
        </h1>
        <div
          dir={isRTL ? "rtl" : "ltr"}
          className="flex flex-col gap-6 lg:flex-row lg:items-start"
        >
          <aside className="w-full shrink-0 lg:w-64 lg:order-1">
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
