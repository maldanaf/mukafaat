import type { Metadata } from "next";
import { pageMetadata } from "@config/pageMetadata";
import PageClient from "./PageClient";

/**
 * باقات الاشتراك.
 *
 * الصفحة كانت مكوّن عميل بلا وسوم خاصة، فحملت عنوان الرئيسية ووصفها
 * في التاب وفي نتائج البحث رغم أنها صفحة تسويقية يُبحث عنها.
 */
export const metadata: Metadata = pageMetadata({
  title: "باقات الاشتراك",
  description:
    "اشترك في مكافآت واستفد من الخصومات الدائمة لدى المتاجر في السعودية — باقات شهرية وسنوية.",
  path: "/subscription/plans",
});

export default function Page() {
  return <PageClient />;
}
