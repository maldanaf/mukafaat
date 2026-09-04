"use client";

import { Suspense } from "react";
import CompanyDetailsPage from "@views/cards/[companyId]";

export default function PageClient() {
  return (
    <Suspense>
      <CompanyDetailsPage />
    </Suspense>
  );
}
