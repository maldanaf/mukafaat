/**
 * رابط صفحة المتجر.
 *
 * المتجر صار وحدة التصفّح الأولى في المنصة لا فرعاً من العروض، فاستقلّ
 * بمساره `/store/{slug}` بدل `/offers/{category}/{slug}`.
 */
export interface MerchantLinkSource {
  id: number | string;
  slug?: string | null;
  /** يبقى في الواجهة للتوافق مع المستدعين، ولا يدخل في الرابط */
  category?: { slug?: string | null } | string | null;
}

export function merchantUrl(merchant: MerchantLinkSource): string {
  return `/store/${merchant.slug ?? merchant.id}`;
}
