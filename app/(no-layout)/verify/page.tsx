import type { Metadata } from "next";
import { pageMetadata } from "@config/pageMetadata";
import PageClient from "./PageClient";

/**
 * شاشة الكاشير للتحقّق من العضوية.
 *
 * الـ QR على البطاقة يفتح `/membership/{number}` مباشرةً من كاميرا الجوال،
 * أمّا كاشير اللابتوب فيستعمل ماسحاً خطّياً يُدخل الرقم كأنه لوحة مفاتيح —
 * فيحتاج شاشة فيها حقل يستقبل المسح ويعرض النتيجة فوراً.
 */
export const metadata: Metadata = pageMetadata({
  title: "التحقّق من العضوية",
  description: "تحقّق من صلاحية اشتراك عميل مكافآت قبل منح الخصم.",
  path: "/verify",
  noIndex: true,
});

export default function Page() {
  return <PageClient />;
}
