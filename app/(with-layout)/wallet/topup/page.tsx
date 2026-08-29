"use client";
import { Suspense } from "react";
import DashboardLayout from "@components/DashboardLayout";
import WalletTopupPage from "@views/wallet/WalletTopupPage";
export default function Page() {
  return (
    <DashboardLayout>
      <Suspense>
        <WalletTopupPage />
      </Suspense>
    </DashboardLayout>
  );
}
