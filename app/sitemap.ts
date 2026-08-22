import type { MetadataRoute } from "next";

const BASE_URL = "https://mukafaat.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/offers`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/cards`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/coupons`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/bookings`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/blogs`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/privacy-policy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms-and-conditions`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/subscription/plans`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];

  // Try to fetch dynamic pages from API
  let dynamicPages: MetadataRoute.Sitemap = [];

  try {
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "https://admin.mukafaat.com.sa";

    // Fetch blog articles
    const blogsRes = await fetch(`${apiBaseUrl}/api/web/news`, {
      headers: { Accept: "application/json", "Accept-Language": "ar" },
      next: { revalidate: 3600 },
    });

    if (blogsRes.ok) {
      const blogsData = await blogsRes.json();
      const articles = blogsData?.data?.data || blogsData?.data || [];
      if (Array.isArray(articles)) {
        dynamicPages = articles
          .filter((a: Record<string, unknown>) => a.slug)
          .map((article: Record<string, unknown>) => ({
            url: `${BASE_URL}/blogs/${article.slug}`,
            lastModified: new Date(),
            changeFrequency: "weekly" as const,
            priority: 0.6,
          }));
      }
    }
  } catch {
    // Silently fail - static pages will still be in sitemap
  }

  return [...staticPages, ...dynamicPages];
}
