import type { Metadata } from "next";
import { Suspense } from "react";
import { pageMetadata } from "@config/pageMetadata";
import BlogsPage from "@views/blogs";

export const metadata: Metadata = pageMetadata({
  title: "المدونة",
  description:
    "مقالات ونصائح من مكافآت: أخبار المنصّة، وإرشادات التوفير، وأحدث العروض والخصومات والبطاقات الرقمية في السعودية.",
  path: "/blogs",
});

export default function Page() {
  return (
    <Suspense>
      <BlogsPage />
    </Suspense>
  );
}
