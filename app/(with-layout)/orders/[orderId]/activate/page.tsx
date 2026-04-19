"use client";
import { Suspense } from "react";
import DashboardLayout from "@components/DashboardLayout";
import OrderActivatePage from "@views/orders/OrderActivatePage";
export default function Page() {
  return (
    <Suspense>
      <DashboardLayout>
        <OrderActivatePage />
      </DashboardLayout>
    </Suspense>
  );
}
