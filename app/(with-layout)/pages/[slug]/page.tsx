"use client";
import { Suspense } from "react";
import PageView from "@views/page_view";
export default function Page() {
  return (
    <Suspense>
      <PageView />
    </Suspense>
  );
}
