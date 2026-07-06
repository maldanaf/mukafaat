/**
 * الدولة الافتراضية حسب عنوان الـ IP.
 *
 * يضبط <GeoCountryBootstrap/> القيمة في localStorage بعد نداء `/api/geo/country`
 * في الباك اند (الذي يكتشف الدولة من IP ويرجع السعودية عند الفشل). هذه الدوال
 * تُستخدم كاختيار افتراضي في منتقيات الدولة/رمز الهاتف عبر الموقع.
 */

/** كود الدولة المكتشفة حسب IP، أو null إن لم يُضبط بعد. */
export function getGeoCountryCode(): string | null {
  try {
    const v = localStorage.getItem("geo_country_code");
    return v && v.trim() !== "" ? v.trim().toUpperCase() : null;
  } catch {
    return null;
  }
}

/** الكود الافتراضي للمنتقيات: المكتشف حسب IP، وإلا السعودية (SA). */
export function defaultCountryCode(): string {
  return getGeoCountryCode() ?? "SA";
}
