import { SITE_URL, absoluteUrl } from "./site";

/**
 * إعدادات الموقع من لوحة التحكم — تُقرأ على الخادم لبناء السكيما.
 *
 * كانت بيانات السكيما (الهاتف، البريد، العنوان، الحسابات الاجتماعية) مكتوبة
 * يدوياً في الكود بقيم وهمية، فكان جوجل يعرض بيانات تواصل خاطئة. الآن تأتي
 * من `/api/web/settings` فيكفي تعديلها من اللوحة.
 */
const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://admin.mukafaat.com.sa"
).replace(/\/$/, "");

export interface SiteSettings {
  siteName: string;
  description: string;
  logo: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  social: string[];
}

/** القيم التي نعتمدها إن تعذّر الوصول للـ API — لا نخترع بيانات تواصل */
const FALLBACK: SiteSettings = {
  siteName: "مكافآت",
  description: "منصة مكافآت — اكتشف أفضل العروض والخصومات في السعودية",
  logo: absoluteUrl("/assets/logo-BcBtrMQ_.svg"),
  phone: null,
  email: null,
  address: null,
  social: [],
};

/** رابط مطلق لصورة قد تأتي نسبية من الخادم */
function absoluteAsset(value: unknown): string | null {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${API_BASE}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch(`${API_BASE}/api/web/settings`, {
      headers: { Accept: "application/json", "Accept-Language": "ar" },
      // نُحدّثها كل ساعة — الإعدادات نادرة التغيّر ولا نُثقل الخادم
      next: { revalidate: 60 },
    });
    if (!res.ok) return FALLBACK;

    const body = await res.json();
    const s = body?.data?.settings ?? {};
    const general = s.general ?? {};
    const contact = s.contact ?? {};
    const social = s.social ?? {};

    return {
      siteName: general.site_name || FALLBACK.siteName,
      description: general.site_description || FALLBACK.description,
      logo: absoluteAsset(general.logo) || FALLBACK.logo,
      phone: contact.phone || null,
      email: contact.email || null,
      address: contact.address || null,
      // الحسابات الفارغة تُستبعد — روابط ميتة تضرّ أكثر مما تنفع
      social: Object.values(social).filter(
        (v): v is string => typeof v === "string" && v.trim().length > 0,
      ),
    };
  } catch {
    return FALLBACK;
  }
}

/** سكيما الموقع والمنظمة مبنية من إعدادات اللوحة */
export function buildSiteSchema(settings: SiteSettings) {
  const organization: Record<string, unknown> = {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: settings.siteName,
    url: SITE_URL,
    logo: settings.logo,
    description: settings.description,
  };

  // لا نُصرّح بحقل لا قيمة له — بيانات ناقصة أفضل من بيانات خاطئة
  if (settings.phone || settings.email) {
    organization.contactPoint = {
      "@type": "ContactPoint",
      contactType: "customer service",
      ...(settings.phone ? { telephone: settings.phone } : {}),
      ...(settings.email ? { email: settings.email } : {}),
      areaServed: "SA",
      availableLanguage: ["ar", "en"],
    };
  }

  if (settings.address) {
    organization.address = {
      "@type": "PostalAddress",
      streetAddress: settings.address,
      addressCountry: "SA",
    };
  }

  if (settings.social.length) {
    organization.sameAs = settings.social;
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: settings.siteName,
        description: settings.description,
        inLanguage: "ar",
        publisher: { "@id": `${SITE_URL}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/offers?search={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      organization,
    ],
  };
}
