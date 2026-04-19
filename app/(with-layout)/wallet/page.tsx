"use client";
import { Suspense } from "react";
import DashboardLayout from "@components/DashboardLayout";
import WalletPage from "@views/wallet/WalletPage";
export default function Page() {
  return (
    <DashboardLayout>
      <WalletPage />
    </DashboardLayout>
  );
}
