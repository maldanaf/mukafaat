import i18next from "i18next";

/**
 * تنسيق الأرقام والعملة والتواريخ حسب لغة الواجهة (ar / en / ur / hi).
 *
 * عرض فقط — لا يمسّ أي قيمة تُرسل للسيرفر. الأرقام تبقى لاتينية (0-9)
 * والتقويم ميلادي في كل اللغات، حتى يبقى الشكل متطابقاً مع تطبيقي الجوال
 * (لغة `ar-SA` وحدها كانت تُخرج تقويماً هجرياً، و`ur-PK` أرقاماً عربية-هندية).
 */

const BASE_TAGS: Record<string, string> = {
  ar: "ar-SA",
  en: "en-US",
  ur: "ur-PK",
  hi: "hi-IN",
  fr: "fr-FR",
};

/** كود لغة الواجهة الحالية بحرفين — الافتراضي العربية. */
export function currentLang(): string {
  const base = (i18next.language || "ar").split("-")[0];
  return base in BASE_TAGS ? base : "ar";
}

/** وسم BCP-47 للتنسيق: تقويم ميلادي وأرقام لاتينية دائماً. */
export function localeTag(lang: string = currentLang()): string {
  return `${BASE_TAGS[lang] ?? BASE_TAGS.ar}-u-ca-gregory-nu-latn`;
}

/** يحوّل أي مُدخل تاريخ إلى `Date` صالح، أو `null` إن كان غير صالح. */
function toDate(value: Date | string | number | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** عدد منسّق بفواصل الآلاف حسب اللغة (الهندية تستخدم نظام اللاكھ: 1,23,456). */
export function formatNumber(
  value: number | string | null | undefined,
  options: Intl.NumberFormatOptions = {}
): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (n === null || n === undefined || !Number.isFinite(n)) return "";
  try {
    return new Intl.NumberFormat(localeTag(), options).format(n);
  } catch {
    return String(n);
  }
}

/** مبلغ + رمز العملة المترجم، مثل «1,250.50 ر.س». */
export function formatCurrency(
  value: number | string | null | undefined,
  options: { decimals?: number; symbol?: string } = {}
): string {
  const { decimals = 2, symbol } = options;
  const amount = formatNumber(value, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  if (!amount) return "";
  const unit = symbol ?? i18next.t("payment.currency");
  return `${amount} ${unit}`;
}

/** «12 مارس 2026» / «12 March 2026» / «12 مارچ 2026» / «12 मार्च 2026». */
export function formatDate(
  value: Date | string | number | null | undefined,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const d = toDate(value);
  if (!d) return "";
  try {
    return new Intl.DateTimeFormat(localeTag(), {
      day: "numeric",
      month: "long",
      year: "numeric",
      ...options,
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

/** «12/03/2026» — أرقام فقط، مفيد للجداول والفواتير. */
export function formatShortDate(
  value: Date | string | number | null | undefined
): string {
  return formatDate(value, { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** «14:05» — نظام 24 ساعة، محايد لغوياً. */
export function formatTime(
  value: Date | string | number | null | undefined
): string {
  const d = toDate(value);
  if (!d) return "";
  try {
    return new Intl.DateTimeFormat(localeTag(), {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
  } catch {
    return "";
  }
}

/** «12 مارس 2026 · 14:05». */
export function formatDateTime(
  value: Date | string | number | null | undefined
): string {
  const date = formatDate(value);
  const time = formatTime(value);
  return date && time ? `${date} · ${time}` : date;
}

const RELATIVE_STEPS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["second", 60],
  ["minute", 60],
  ["hour", 24],
  ["day", 30],
  ["month", 12],
  ["year", Number.POSITIVE_INFINITY],
];

/**
 * تاريخ نسبي: «قبل 3 أيام» / «3 days ago» / «3 دن پہلے» / «3 दिन पहले».
 * التصريف يتولاه `Intl.RelativeTimeFormat` (مثنّى وجمع العربية مشمولان).
 * عند تجاوز سنة أو تعذّر الدعم يعود إلى التاريخ الكامل.
 */
export function formatRelativeTime(
  value: Date | string | number | null | undefined,
  now: Date = new Date()
): string {
  const d = toDate(value);
  if (!d) return "";
  let diff = (d.getTime() - now.getTime()) / 1000;
  try {
    const rtf = new Intl.RelativeTimeFormat(localeTag(), { numeric: "auto" });
    for (const [unit, span] of RELATIVE_STEPS) {
      if (Math.abs(diff) < span) return rtf.format(Math.round(diff), unit);
      diff /= span;
    }
    return rtf.format(Math.round(diff), "year");
  } catch {
    return formatDate(d);
  }
}
