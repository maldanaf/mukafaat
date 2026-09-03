import type { Metadata } from "next";
import { Suspense } from "react";
import { absoluteUrl, SITE_URL } from "@config/site";
import StoresPage from "@views/stores";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://admin.mukafaat.com.sa"
).replace(/\/$/, "");

/** اسم التصنيف من الـ API — للعنوان والوصف */
async function getCategoryName(slug: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${API_BASE}/api/merchants?category_slug=${encodeURIComponent(slug)}&per_page=1`,
      {
        headers: { Accept: "application/json", "Accept-Language": "ar" },
        next: { revalidate: 3600 },
      },
    );
    if (!res.ok) return null;
    const body = await res.json();
    const cats = body?.data?.categories ?? [];
    const match = cats.find(
      (c: { slug?: string }) => String(c?.slug ?? "") === slug,
    );
    return match?.name ?? null;
  } catch {
    return null;
  }
}

/**
 * صفحة متاجر التصنيف.
 *
 * رابط مستقل لكل تصنيف بدل فلتر داخلي: الفلتر لا يُنتج رابطاً يُشارَك
 * أو تفهرسه المحرّكات، فكانت متاجر كل تصنيف غير قابلة للاكتشاف.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}): Promise<Metadata> {
  const { categorySlug } = await params;
  const name = await getCategoryName(categorySlug);
  const url = absoluteUrl(`/stores/${categorySlug}`);

  const title = name ? `متاجر ${name}` : "المتاجر";
  const description = name
    ? `تصفّح متاجر ${name} الشريكة في مكافآت وخصوماتها الدائمة على مدار العام.`
    : "تصفّح المتاجر الشريكة في مكافآت وخصوماتها الدائمة.";

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      locale: "ar_SA",
    },
  };
}

export default function Page() {
  return (
    <Suspense>
      <StoresPage />
    </Suspense>
  );
}
