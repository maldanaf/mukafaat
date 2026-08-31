"use client";

import { Suspense } from "react";
import CardsPage from "@views/cards";

export default function PageClient() {
  return (
    <Suspense>
      <CardsPage />
    </Suspense>
  );
}
