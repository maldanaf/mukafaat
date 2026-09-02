import type { Metadata } from "next";
import { Suspense } from "react";
import { pageMetadata } from "@config/pageMetadata";
import FaqPage from "@views/faq_page";

export const metadata: Metadata = pageMetadata({
  title: "الأسئلة الشائعة",
  description:
    "إجابات على أكثر الأسئلة تكراراً حول مكافآت: الاشتراك، والخصومات الدائمة، والبطاقات الرقمية، وطرق الدفع والاسترداد.",
  path: "/faq",
});

export default function Page() {
  return (
    <Suspense>
      <FaqPage />
    </Suspense>
  );
}
