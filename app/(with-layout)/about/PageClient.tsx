"use client";

import { Suspense } from "react";
import AboutPage from "@views/about";

export default function PageClient() {
  return (
    <Suspense>
      <AboutPage />
    </Suspense>
  );
}
