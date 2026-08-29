/**
 * Server-side fetch utility for Next.js generateMetadata functions.
 * Uses plain fetch() (not Axios) since this runs on the server only.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://admin.mukafaat.com.sa";

export async function serverFetch(
  endpoint: string,
  lang = "ar"
): Promise<Record<string, unknown>> {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Accept-Language": lang,
        Accept: "application/json",
        // قناة الطلب — السيرفر يختار سعر الموقع ويخفي باقات لوحة التحكم
        "X-Platform": "web",
      },
      next: { revalidate: 60 },
    });
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}
