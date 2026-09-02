import type { Metadata } from "next";
import { SITE_URL } from "@config/site";
import HomeClient from "./HomeClient";

/**
 * الرابط الأساسي للرئيسية.
 *
 * كان مضبوطاً في التخطيط الجذري فترثه كل صفحة بلا بيانات خاصة
 * (‎/blogs‎ و‎/faq‎) وتُعلن نفسها نسخة مكرّرة من الرئيسية. نُقل هنا
 * ليخصّ الرئيسية وحدها. العنوان والوصف يأتيان من التخطيط.
 */
export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
};

export default function Page() {
  return <HomeClient />;
}
