import type { Metadata } from "next";
import { pageMetadata } from "@config/pageMetadata";
import PageClient from "./PageClient";

export const metadata: Metadata = pageMetadata({
  title: "البطاقات الرقمية",
  description:
    "بطاقات هدايا واشتراكات رقمية بأسعار مخفّضة — نتفلكس، ستاربكس، بلايستيشن وغيرها.",
  path: "/cards",
});

export default function Page() {
  return <PageClient />;
}
