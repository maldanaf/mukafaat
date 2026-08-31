"use client";

import { Suspense } from "react";
import CouponsPage from "@views/coupons";

export default function PageClient() {
  return (
    <Suspense>
      <CouponsPage />
    </Suspense>
  );
}
