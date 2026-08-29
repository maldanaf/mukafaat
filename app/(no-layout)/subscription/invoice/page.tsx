"use client";
import { Suspense } from "react";
import SubscriptionInvoicePage from "@views/subscription/InvoicePage";
export default function Page() {
  return (
    <Suspense>
      <SubscriptionInvoicePage />
    </Suspense>
  );
}
