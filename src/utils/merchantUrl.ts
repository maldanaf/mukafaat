/**
 * رابط صفحة المتجر.
 *
 * المتجر صار وحدة التصفّح الأولى في المنصة لا فرعاً من العروض، فاستقلّ
 * بمساره `/store/{slug}` بدل `/offers/{category}/{slug}`.
 */
export interface MerchantLinkSource {
  /** اختياري: بيانات الـ API تصل أحياناً كنوع فضفاض بلا ضمان للحقل */
  id?: number | string;
  slug?: string | null;
  /** يبقى في الواجهة للتوافق مع المستدعين، ولا يدخل في الرابط */
  category?: { slug?: string | null } | string | null;
}

export function merchantUrl(merchant: MerchantLinkSource): string {
  return `/store/${merchant.slug ?? merchant.id ?? ""}`;
}
