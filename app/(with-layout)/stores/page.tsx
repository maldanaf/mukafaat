import type { Metadata } from "next";
import { Suspense } from "react";
import { pageMetadata } from "@config/pageMetadata";
import StoresPage from "@views/stores";

export const metadata: Metadata = pageMetadata({
  title: "المتاجر | مكافآت",
  description:
    "تصفّح المتاجر الشريكة في مكافآت وخصوماتها الدائمة على مدار العام.",
  path: "/stores",
});

export default function Page() {
  return (
    <Suspense>
      <StoresPage />
    </Suspense>
  );
}
