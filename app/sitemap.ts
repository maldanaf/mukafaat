import type { MetadataRoute } from "next";

/**
 * خريطة الموقع.
 *
 * تشمل الصفحات الثابتة **والمحتوى الديناميكي** (العروض، البطاقات، المتاجر،
 * التصنيفات، المقالات، الصفحات المُدارة من اللوحة) — كان يقتصر على ١١ صفحة
 * ثابتة والمقالات فقط، فبقي معظم محتوى الموقع خارج الفهرسة.
 */
const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://mukafaat.com.sa"
).replace(/\/$/, "");

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://admin.mukafaat.com.sa"
).replace(/\/$/, "");

type Entry = MetadataRoute.Sitemap[number];

const entry = (
  path: string,
  changeFrequency: Entry["changeFrequency"],
  priority: number,
): Entry => ({
  url: path === "/" ? BASE_URL : `${BASE_URL}${path}`,
  lastModified: new Date(),
  changeFrequency,
  priority,
});

/** جلب قائمة من الـ API — الفشل لا يُسقط الخريطة كلها */
async function fetchList(path: string): Promise<Record<string, unknown>[]> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: "application/json", "Accept-Language": "ar" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];

    const body = await res.json();
    const data = body?.data ?? body;

    // الاستجابات تأتي بأشكال مختلفة حسب المسار
    for (const value of [
      data?.data,
      data?.offers,
      data?.cards,
      data?.merchants,
      data?.categories,
      data?.news,
      data?.articles,
      data?.pages,
      data,
    ]) {
      if (Array.isArray(value)) return value as Record<string, unknown>[];
    }
    return [];
  } catch {
    return [];
  }
}


/** تصنيفات المتاجر — تُرجَع ضمن استجابة /api/merchants لا بمسار مستقل */
async function fetchMerchantCategories(): Promise<Record<string, unknown>[]> {
  try {
    const res = await fetch(`${API_BASE}/api/merchants?per_page=1`, {
      headers: { Accept: "application/json", "Accept-Language": "ar" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const body = await res.json();
    const list = body?.data?.categories;
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ===== الصفحات الثابتة =====
  // نستثني ما لا يُفهرس: السلة، الحساب، المحفظة، الطلبات، الدخول، صفحات النتائج
  const staticPages: MetadataRoute.Sitemap = [
    entry("/", "daily", 1),
    entry("/offers", "daily", 0.9),
    entry("/cards", "daily", 0.9),
    entry("/coupons", "daily", 0.9),
    entry("/bookings", "daily", 0.8),
    entry("/blogs", "weekly", 0.8),
    entry("/about", "monthly", 0.7),
    entry("/contact", "monthly", 0.6),
    entry("/subscription/plans", "monthly", 0.8),
    entry("/careers", "weekly", 0.5),
    entry("/jobs", "weekly", 0.5),
    entry("/gallery", "monthly", 0.4),
    entry("/portfolio", "monthly", 0.4),
    entry("/investments", "monthly", 0.4),
    entry("/store-request", "monthly", 0.5),
    entry("/privacy-policy", "yearly", 0.3),
    entry("/terms-and-conditions", "yearly", 0.3),
  ];

  // ===== المحتوى الديناميكي =====
  const [offers, cards, merchants, categories, articles, merchantCategories] =
    await Promise.all([
    fetchList("/api/web/offers?per_page=200"),
    fetchList("/api/web/cards?per_page=200"),
    fetchList("/api/merchants?per_page=200"),
    fetchList("/api/categories?type=offers"),
    fetchList("/api/web/news"),
    // تصنيفات المتاجر تأتي ضمن استجابة /api/merchants تحت مفتاح categories
    fetchMerchantCategories(),
  ]);

  const dynamic: MetadataRoute.Sitemap = [];

  for (const c of categories) {
    const slug = c.slug ?? c.id;
    if (slug) dynamic.push(entry(`/offers/${slug}`, "daily", 0.7));
  }

  for (const o of offers) {
    const id = o.slug ?? o.id;
    const cat = (o.category as Record<string, unknown>)?.slug;
    const merchant = (o.merchant as Record<string, unknown>)?.id;
    if (id && cat && merchant) {
      dynamic.push(entry(`/offers/${cat}/${merchant}/offer/${id}`, "weekly", 0.6));
    }
  }

  for (const c of cards) {
    const id = c.slug ?? c.id;
    const company = (c.merchant as Record<string, unknown>)?.id;
    if (id && company) {
      dynamic.push(entry(`/cards/${company}/offer/${id}`, "weekly", 0.6));
    }
  }

  // صفحة المتجر — أولوية عالية: المتجر وحدة التصفّح الأولى وخصوماته
  // الدائمة هي المحتوى الذي تبحث عنه المحرّكات
  for (const m of merchants) {
    const key = m.slug ?? m.id;
    if (key) dynamic.push(entry(`/store/${key}`, "weekly", 0.75));
  }

  // صفحات تصنيفات المتاجر — لكل تصنيف رابطه المستقل
  for (const c of merchantCategories) {
    if (c.slug) dynamic.push(entry(`/stores/${c.slug}`, "weekly", 0.7));
  }

  for (const a of articles) {
    if (a.slug) dynamic.push(entry(`/blogs/${a.slug}`, "weekly", 0.6));
  }

  // إزالة التكرار — قد يظهر نفس الرابط من مصدرين
  const seen = new Set<string>();
  return [...staticPages, ...dynamic].filter((e) => {
    if (seen.has(e.url)) return false;
    seen.add(e.url);
    return true;
  });
}
