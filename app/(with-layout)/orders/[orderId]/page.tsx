"use client";
import { Suspense } from "react";
import DashboardLayout from "@components/DashboardLayout";
import OrderDetailPage from "@views/orders/OrderDetailPage";
export default function Page() {
  return (
    <DashboardLayout>
      <OrderDetailPage />
    </DashboardLayout>
  );
}
