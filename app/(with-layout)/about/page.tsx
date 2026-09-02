import type { Metadata } from "next";
import { pageMetadata } from "@config/pageMetadata";
import PageClient from "./PageClient";

export const metadata: Metadata = pageMetadata({
  title: "من نحن",
  description:
    "تعرّف على منصة مكافآت — وجهتك للعروض والخصومات والبطاقات في السعودية.",
  path: "/about",
});

export default function Page() {
  return <PageClient />;
}
