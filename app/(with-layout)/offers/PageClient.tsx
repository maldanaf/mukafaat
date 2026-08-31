"use client";

import { Suspense } from "react";
import OffersPage from "@views/offers";

export default function PageClient() {
  return (
    <Suspense>
      <OffersPage />
    </Suspense>
  );
}
