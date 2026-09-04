"use client";

import { Suspense } from "react";
import { SubscriptionPlansPage } from "@views/subscription";

export default function PageClient() {
  return (
    <Suspense>
      <SubscriptionPlansPage />
    </Suspense>
  );
}
