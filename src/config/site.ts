/**
 * ثوابت الموقع لمحرّكات البحث.
 *
 * **مصدر واحد للنطاق.** كان النطاق مكتوباً يدوياً في ٣٠ ملفاً بقيمة خاطئة
 * (`mukafaat.com` بدل `mukafaat.com.sa`)، فكانت كل روابط canonical و
 * og:url و sitemap تشير لموقع آخر تماماً — وهو ما يمنع فهرسة الموقع.
 *
 * يمكن تجاوزه بمتغيّر البيئة `NEXT_PUBLIC_SITE_URL` عند تغيير النطاق.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://mukafaat.com.sa"
).replace(/\/$/, "");

/** رابط مطلق لمسار داخلي — يضمن canonical صحيحاً دائماً */
export function absoluteUrl(path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${clean === "/" ? "" : clean}`;
}

/** اللغات المدعومة فعلاً في مبدّل اللغة — لا فرنسية */
export const SITE_LOCALES = ["ar", "en", "ur", "hi"] as const;
export type SiteLocale = (typeof SITE_LOCALES)[number];

export const DEFAULT_LOCALE: SiteLocale = "ar";

/**
 * روابط اللغات البديلة لصفحة ما.
 *
 * اللغة تُختار في المتصفح لا بالمسار، فنستخدم `?lang=` كي يفهم جوجل
 * أن النسخ لغات لنفس الصفحة لا صفحات مكرّرة.
 */
export function alternateLanguages(path = "/"): Record<string, string> {
  // المسار الجذر يحتاج "/" صريحة قبل معامل الاستعلام، وإلا خرج الرابط
  // بصيغة `example.com?lang=ar` التي يُسقط Next معاملها عند التطبيع.
  const clean = path.startsWith("/") ? path : `/${path}`;
  const base = `${SITE_URL}${clean}`;
  const sep = base.includes("?") ? "&" : "?";

  const languages: Record<string, string> = {};
  for (const locale of SITE_LOCALES) {
    languages[locale] = `${base}${sep}lang=${locale}`;
  }
  // x-default: النسخة التي تُعرض لمن لا تطابق لغته أياً منها
  languages["x-default"] = base;

  return languages;
}

/** اسم الموقع ووصفه — تُستخدم في السكيما والوسوم */
export const SITE_NAME = "مكافآت";
export const SITE_NAME_EN = "Mukafaat";
