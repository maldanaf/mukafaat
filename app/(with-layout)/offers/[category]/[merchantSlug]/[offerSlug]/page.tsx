import type { Metadata } from "next";
import { pageMetadata } from "@config/pageMetadata";
import PageClient from "./PageClient";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://admin.mukafaat.com.sa"
).replace(/\/$/, "");

interface OfferMeta {
  name?: string;
  title?: string;
  description?: string | null;
  image?: string | null;
  discount_percent?: number | null;
  merchant?: { name?: string } | null;
}

/** جلب العرض على الخادم لبناء وسوم الصفحة */
async function getOffer(slug: string): Promise<OfferMeta | null> {
  try {
    const res = await fetch(`${API_BASE}/api/web/offers/${slug}`, {
      headers: { Accept: "application/json", "Accept-Language": "ar" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;

    const body = await res.json();
    return (body?.data?.offer ?? body?.data ?? null) as OfferMeta | null;
  } catch {
    return null;
  }
}

/** نزع وسوم HTML قبل وضع النصّ في وسم meta */
const plain = (html?: string | null): string =>
  String(html ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; merchantSlug: string; offerSlug: string }>;
}): Promise<Metadata> {
  const { category, merchantSlug, offerSlug } = await params;
  const offer = await getOffer(offerSlug);

  const name = (offer?.name || offer?.title || "").trim();
  const merchant = offer?.merchant?.name?.trim();
  const discount = Number(offer?.discount_percent ?? 0);

  const title = name || "تفاصيل العرض";
  const description =
    plain(offer?.description).slice(0, 155) ||
    (discount > 0
      ? `خصم ${Math.round(discount)}% ${merchant ? `لدى ${merchant}` : ""} — احجز العرض من منصة مكافآت.`
      : `اطّلع على تفاصيل العرض ${merchant ? `لدى ${merchant}` : ""} في منصة مكافآت.`);

  return pageMetadata({
    title,
    description,
    path: `/offers/${category}/${merchantSlug}/${offerSlug}`,
    image: offer?.image || undefined,
  });
}

export default function Page() {
  return <PageClient />;
}
