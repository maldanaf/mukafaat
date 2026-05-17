"use client";
import { Suspense } from "react";
import { AffiliatePublicStatsPage } from "@views/affiliate";
export default function Page() {
  return (
    <Suspense>
      <AffiliatePublicStatsPage />
    </Suspense>
  );
}
