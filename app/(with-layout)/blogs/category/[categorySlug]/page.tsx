import type { Metadata } from "next";
import { Suspense } from "react";
import { absoluteUrl, SITE_URL } from "@config/site";
import BlogsPage from "@views/blogs";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://admin.mukafaat.com.sa"
).replace(/\/$/, "");

/** اسم التصنيف من الـ API — للعنوان والوصف */
async function getCategoryName(slug: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${API_BASE}/api/web/news?category_slug=${encodeURIComponent(slug)}&per_page=1`,
      {
        headers: { Accept: "application/json", "Accept-Language": "ar" },
        next: { revalidate: 60 },
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
 * مقالات تصنيف المدونة.
 *
 * تحت `/blogs/category/{slug}` لا `/blogs/{slug}`: الأخير محجوز
 * لصفحة المقالة نفسها، ووضع التصنيفات فيه يجعل المسارين يتنازعان
 * على نفس الشكل فيُفتح تصنيف مكان مقالة أو العكس.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}): Promise<Metadata> {
  const { categorySlug } = await params;
  const name = await getCategoryName(categorySlug);
  const url = absoluteUrl(`/blogs/category/${categorySlug}`);

  const title = name ? `مقالات ${name}` : "المدونة";
  const description = name
    ? `مقالات ${name} في مدونة مكافآت — نصائح وأخبار حول العروض والخصومات في السعودية.`
    : "مقالات ونصائح من مدونة مكافآت.";

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
      <BlogsPage />
    </Suspense>
  );
}
