import type { Metadata } from "next";
import { Suspense } from "react";
import { pageMetadata } from "@config/pageMetadata";
import DownloadAppPage from "@views/download_app";

export const metadata: Metadata = pageMetadata({
  title: "حمّل التطبيق",
  description:
    "حمّل تطبيق مكافآت على iOS وأندرويد واحصل على العروض والخصومات والبطاقات الرقمية أينما كنت.",
  path: "/download-app",
});

export default function Page() {
  return (
    <Suspense>
      <DownloadAppPage />
    </Suspense>
  );
}
