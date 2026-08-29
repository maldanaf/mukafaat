/**
 * توحيد تسمية «النقاط» مع التطبيق (`PointsFormat` في
 * `lib/core/widgets/points_amount_text.dart`).
 * 1 نقطة = 1 ريال سعودي — العرض بالنقاط والدفع يبقى بالريال.
 */

/** صيغة وحدة النقاط المناسبة للعدد (تصريف عربي مبسّط) */
export function pointsUnit(value: number, t: (key: string) => string): string {
  const v = Math.abs(Number(value) || 0);
  if (v === 1) return t("wallet.pointsUnitOne");
  if (v === 2) return t("wallet.pointsUnitTwo");
  if (v >= 3 && v <= 10 && Number.isInteger(v)) return t("wallet.pointsUnitFew");
  return t("wallet.pointsUnitMany");
}

/** «100.00 نقطة» — للنصوص المدمجة */
export function pointsLabel(
  value: number,
  t: (key: string) => string,
  decimals = 2,
): string {
  const v = Number(value) || 0;
  return `${v.toFixed(decimals)} ${pointsUnit(v, t)}`;
}
