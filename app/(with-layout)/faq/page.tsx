"use client";
import { Suspense } from "react";
import FaqPage from "@views/faq_page";
export default function Page() {
  return (
    <Suspense>
      <FaqPage />
    </Suspense>
  );
}
