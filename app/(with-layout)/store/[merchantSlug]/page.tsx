import type { Metadata } from "next";
import { Suspense } from "react";
import { pageMetadata } from "@config/pageMetadata";
import MerchantPage from "@views/offers/[category]/[restaurantId]";

/**
 * صفحة المتجر.
 *
 * كانت متفرّعة عن العروض `/offers/{category}/{slug}`، والمتجر صار وحدة
 * التصفّح الأولى لا فرعاً من العروض، فاستقلّ بمساره.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ merchantSlug: string }>;
}): Promise<Metadata> {
  const { merchantSlug } = await params;
  return pageMetadata({
    title: "المتجر | مكافآت",
    description: "تعرّف على خصومات المتجر الدائمة وعروضه في منصة مكافآت.",
    path: `/store/${merchantSlug}`,
  });
}

export default function Page() {
  return (
    <Suspense>
      <MerchantPage />
    </Suspense>
  );
}
