import i18next from "i18next";

/**
 * لاحقة صيغة العدد بالعربية: 1 مفرد، 2 مثنّى، 3–10 جمع،
 * و11 وما فوق مفرد منصوب (وكذلك 100 و101…).
 */
export function pluralForm(count: number): "One" | "Two" | "Few" | "Many" {
  const n = Math.abs(Math.trunc(count));
  if (n === 1) return "One";
  if (n === 2) return "Two";
  const mod = n % 100;
  if (mod >= 3 && mod <= 10) return "Few";
  return "Many";
}

/**
 * نص عدّاد الاستخدام مصرَّفاً: «استخدم (مرة واحدة)» / «استخدم (مرتين)» /
 * «استخدم (3 مرات)» / «استخدم (11 مرة)»، وبالإنجليزية «Used once» / «Used 2 times».
 * لا يُستدعى عند الصفر — العدّاد مخفي أصلاً.
 */
export function usedCountText(count: number): string {
  const n = Math.abs(Math.trunc(count));
  return i18next.t(`couponModal.usedCount${pluralForm(n)}`, { count: n });
}
