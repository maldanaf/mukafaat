"use client";
import { Suspense } from "react";
import DashboardLayout from "@components/DashboardLayout";
import SavedPage from "@views/saved/SavedPage";
export default function Page() {
  return (
    <DashboardLayout>
      <SavedPage />
    </DashboardLayout>
  );
}
