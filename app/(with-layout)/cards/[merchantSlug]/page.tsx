import type { Metadata } from "next";
import { pageMetadata } from "@config/pageMetadata";
import PageClient from "./PageClient";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://admin.mukafaat.com.sa"
).replace(/\/$/, "");

interface CardMeta {
  name?: string;
  description?: string | null;
  image?: string | null;
}

/** جلب البطاقة على الخادم لبناء الوسوم والعنوان الرئيسي */
async function getCard(slug: string): Promise<CardMeta | null> {
  try {
    const res = await fetch(`${API_BASE}/api/web/cards/${slug}`, {
      headers: { Accept: "application/json", "Accept-Language": "ar" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;

    const body = await res.json();
    return (body?.data?.card ?? body?.data ?? null) as CardMeta | null;
  } catch {
    return null;
  }
}

const plain = (html?: string | null): string =>
  String(html ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

export async function generateMetadata({
  params,
}: {
  params: Promise<{ merchantSlug: string }>;
}): Promise<Metadata> {
  const { merchantSlug } = await params;
  const card = await getCard(merchantSlug);

  const name = card?.name?.trim();

  return pageMetadata({
    title: name || "البطاقات الرقمية",
    description:
      plain(card?.description).slice(0, 155) ||
      `اشترِ ${name ?? "البطاقات الرقمية"} بأفضل سعر من منصة مكافآت — تسليم فوري.`,
    path: `/cards/${merchantSlug}`,
    image: card?.image || undefined,
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ merchantSlug: string }>;
}) {
  const { merchantSlug } = await params;
  const card = await getCard(merchantSlug);

  return (
    <>
      {/* H1 مُصيَّر على الخادم — جسم الصفحة يُبنى في العميل */}
      {card?.name && <h1 className="sr-only">{card.name}</h1>}
      <PageClient />
    </>
  );
}
