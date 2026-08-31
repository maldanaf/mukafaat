import type { Metadata } from "next";
import { pageMetadata } from "@config/pageMetadata";
import PageClient from "./PageClient";

export const metadata: Metadata = pageMetadata({
  title: "أكواد الخصم والكوبونات | مكافآت",
  description:
    "أكواد خصم حصرية وكوبونات فعّالة لأشهر المتاجر والمطاعم في السعودية.",
  path: "/coupons",
});

export default function Page() {
  return <PageClient />;
}
