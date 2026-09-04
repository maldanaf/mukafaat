import type { Metadata } from "next";
import { Suspense } from "react";
import { pageMetadata } from "@config/pageMetadata";
import MerchantPage from "@views/offers/[category]/[restaurantId]";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://admin.mukafaat.com.sa"
).replace(/\/$/, "");

interface MerchantMeta {
  name?: string;
  description?: string | null;
  logo?: string | null;
  cover_image?: string | null;
  max_discount?: number | null;
}

/**
 * جلب المتجر على الخادم لبناء وسوم الصفحة.
 *
 * بدونه تحمل كل صفحات المتاجر العنوان نفسه «المتجر» — في التاب وفي
 * نتائج البحث ومعاينة المشاركة — فلا يميّز الزائر متجراً عن آخر.
 */
async function getMerchant(slug: string): Promise<MerchantMeta | null> {
  try {
    const res = await fetch(`${API_BASE}/api/merchants/${slug}`, {
      headers: { Accept: "application/json", "Accept-Language": "ar" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;

    const body = await res.json();
    return (body?.data?.merchant ?? body?.data ?? null) as MerchantMeta | null;
  } catch {
    return null;
  }
}

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
  const merchant = await getMerchant(merchantSlug);

  const name = merchant?.name?.trim();
  const discount = Number(merchant?.max_discount ?? 0);

  const description = discount > 0
    ? `خصم دائم حتى ${Math.round(discount)}% لدى ${name ?? "المتجر"} — اطّلع على الخصومات والعروض في منصة مكافآت.`
    : `تعرّف على خصومات ${name ?? "المتجر"} الدائمة وعروضه في منصة مكافآت.`;

  return pageMetadata({
    title: name || "المتجر",
    description,
    path: `/store/${merchantSlug}`,
    image: merchant?.cover_image || merchant?.logo || undefined,
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ merchantSlug: string }>;
}) {
  const { merchantSlug } = await params;
  const merchant = await getMerchant(merchantSlug);

  return (
    <>
      {/*
        اسم المتجر كـ H1 مُصيَّر على الخادم — جسم الصفحة يُبنى في العميل
        فكان أول HTML يصل الزاحف بلا H1. مخفيّ بصرياً، والعنوان المرئي
        في الهيرو يبقى كما هو (نُنزله إلى H2 كي لا يتكرّر H1).
      */}
      {merchant?.name && <h1 className="sr-only">{merchant.name}</h1>}

      <Suspense>
        <MerchantPage />
      </Suspense>
    </>
  );
}
