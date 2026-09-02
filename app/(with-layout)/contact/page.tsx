import type { Metadata } from "next";
import { pageMetadata } from "@config/pageMetadata";
import PageClient from "./PageClient";

export const metadata: Metadata = pageMetadata({
  title: "اتصل بنا",
  description:
    "تواصل مع فريق مكافآت — نجيب استفساراتك ونستقبل اقتراحاتك.",
  path: "/contact",
});

export default function Page() {
  return <PageClient />;
}
