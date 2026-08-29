/**
 * مسار صفحة تفاصيل بطاقة الشحن:
 *   /cards/{merchantSlug|merchantId}/{cardSlug|cardId}
 *
 * صفحة التفاصيل تجلب البطاقة بالمقطع الثاني (slug أو id)، بينما المقطع
 * الأول يُستخدم في زر الرجوع وصفحة الدفع — فلا نبنيه إلا إذا عرفنا التاجر
 * فعلاً، وإلا نرجع لقائمة البطاقات بدل رابط دفع مكسور.
 */
export function buildCardUrl(card: {
  id?: number | string;
  slug?: string | null;
  merchant?: { id?: number | string; slug?: string | null } | null;
  merchantSlug?: string | null;
}): string {
  const merchant = card.merchant?.slug || card.merchantSlug || card.merchant?.id;
  if (!merchant) return "/cards";

  const target = card.slug || card.id;
  return target ? `/cards/${merchant}/${target}` : `/cards/${merchant}`;
}
