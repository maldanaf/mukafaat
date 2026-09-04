"use client";

import { Suspense } from "react";
import OfferDetailPage from "@views/offers/[category]/[restaurantId]/offer/[offerId]";

export default function PageClient() {
  return (
    <Suspense>
      <OfferDetailPage />
    </Suspense>
  );
}
