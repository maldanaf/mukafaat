"use client";
import { Suspense } from "react";
import CouponsPage from "@views/coupons";
export default function Page() {
  return (
    <Suspense>
      <CouponsPage />
    </Suspense>
  );
}
