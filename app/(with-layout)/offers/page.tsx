import type { Metadata } from "next";
import { pageMetadata } from "@config/pageMetadata";
import PageClient from "./PageClient";

export const metadata: Metadata = pageMetadata({
  title: "العروض والخصومات | مكافآت",
  description:
    "أحدث العروض والخصومات الحصرية من المطاعم والمتاجر في السعودية. وفّر أكثر مع مكافآت.",
  path: "/offers",
});

export default function Page() {
  return <PageClient />;
}
