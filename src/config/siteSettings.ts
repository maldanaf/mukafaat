import { t } from "i18next";
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

/**
 * أكواد التتبّع القادمة من تاب «التتبّع والتحليلات» في اللوحة.
 * كل حقل اختياري: غيابه يعني ألّا يُطبع للأداة وسم أصلاً.
 */
export interface TrackingSettings {
  gtmId: string | null;
  googleAnalyticsId: string | null;
  facebookPixelId: string | null;
  snapchatPixelId: string | null;
  tiktokPixelId: string | null;
  customHeadScripts: string | null;
  customBodyScripts: string | null;
}

export interface SiteSettings {
  siteName: string;
  description: string;
  logo: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  social: string[];
  tracking: TrackingSettings;
}

/** لا تتبّع إطلاقاً — الحالة الافتراضية حين يتعذّر الوصول للـ API */
const EMPTY_TRACKING: TrackingSettings = {
  gtmId: null,
  googleAnalyticsId: null,
  facebookPixelId: null,
  snapchatPixelId: null,
  tiktokPixelId: null,
  customHeadScripts: null,
  customBodyScripts: null,
};

/** القيم التي نعتمدها إن تعذّر الوصول للـ API — لا نخترع بيانات تواصل */
const FALLBACK: SiteSettings = {
  siteName: "مكافآت",
  description: t("ui.t_0f645f", "منصة مكافآت — اكتشف أفضل العروض والخصومات في السعودية"),
  logo: absoluteUrl("/assets/logo-BcBtrMQ_.svg"),
  phone: null,
  email: null,
  address: null,
  social: [],
  tracking: EMPTY_TRACKING,
};

/** رابط مطلق لصورة قد تأتي نسبية من الخادم */
function absoluteAsset(value: unknown): string | null {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${API_BASE}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

/** نصّ غير فارغ أو null — يوحّد "" و undefined في قيمة واحدة */
function text(value: unknown): string | null {
  const raw = typeof value === "string" ? value.trim() : "";
  return raw || null;
}

/**
 * معرّف أداة تتبّع بعد التحقّق من صيغته.
 *
 * هذه المعرّفات تُطبع داخل جسم <script>، فلو مرّ فيها اقتباس أو وسم إغلاق
 * لأمكن كسر السكربت وحقن كود في كل صفحة. اللوحة تتحقّق منها أصلاً، ونكرّر
 * التحقّق هنا لأن الوسوم تُبنى في هذا الملف ولا يصحّ أن يعتمد أمانها على
 * سلامة طرفٍ آخر.
 */
function trackingId(value: unknown, pattern: RegExp): string | null {
  const raw = text(value);
  return raw && pattern.test(raw) ? raw : null;
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
    const tracking = s.tracking ?? {};

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
      tracking: {
        gtmId: trackingId(tracking.gtm_id, /^GTM-[A-Z0-9]+$/),
        googleAnalyticsId: trackingId(
          tracking.google_analytics_id,
          /^(G|UA|AW)-[A-Z0-9-]+$/i,
        ),
        facebookPixelId: trackingId(tracking.facebook_pixel_id, /^[0-9]+$/),
        snapchatPixelId: trackingId(tracking.snapchat_pixel_id, /^[A-Za-z0-9-]+$/),
        tiktokPixelId: trackingId(tracking.tiktok_pixel_id, /^[A-Za-z0-9]+$/),
        // الأكواد المخصّصة تُحقن كما هي بقرار صاحب الموقع — لا صيغة نتحقّق منها
        customHeadScripts: text(tracking.custom_head_scripts),
        customBodyScripts: text(tracking.custom_body_scripts),
      },
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
