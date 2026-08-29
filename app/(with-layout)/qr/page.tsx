"use client";
import { Suspense } from "react";
import QrLandingPage from "@views/qr_landing";
export default function Page() {
  return (
    <Suspense>
      <QrLandingPage />
    </Suspense>
  );
}
