"use client";
import { Suspense } from "react";
import DashboardLayout from "@components/DashboardLayout";
import OrdersPage from "@views/orders/OrdersPage";
export default function Page() {
  return (
    <DashboardLayout>
      <OrdersPage />
    </DashboardLayout>
  );
}
