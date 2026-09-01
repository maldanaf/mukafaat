/**
 * رابط صفحة المتجر.
 *
 * كانت كروت المتاجر في الرئيسية تشير إلى `/offers?merchant=id` — قائمة
 * عروض مفلترة لا صفحة المتجر، فلا تظهر خصوماته الدائمة وهي جوهر
 * الاتفاقية معه.
 *
 * مقطع التصنيف في المسار للعرض فقط؛ الصفحة تجلب المتجر بالـ slug،
 * لذا نستخدم `all` حين لا يعرف الكرت تصنيف المتجر.
 */
export interface MerchantLinkSource {
  id: number | string;
  slug?: string | null;
  category?: { slug?: string | null } | string | null;
}

export function merchantUrl(merchant: MerchantLinkSource): string {
  const categorySlug =
    typeof merchant.category === "string"
      ? merchant.category
      : merchant.category?.slug;

  const key = merchant.slug ?? merchant.id;

  return `/offers/${categorySlug || "all"}/${key}`;
}
