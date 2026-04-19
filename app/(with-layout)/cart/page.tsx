"use client";
import { Suspense } from "react";
import DashboardLayout from "@components/DashboardLayout";
import CartPage from "@views/cart/CartPage";
export default function Page() {
  return (
    <DashboardLayout>
      <CartPage />
    </DashboardLayout>
  );
}
