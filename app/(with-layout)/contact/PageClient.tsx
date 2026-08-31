"use client";

import { Suspense } from "react";
import ContactPage from "@views/contact";

export default function PageClient() {
  return (
    <Suspense>
      <ContactPage />
    </Suspense>
  );
}
