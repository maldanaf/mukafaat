/**
 * مسار صفحة تفاصيل العرض الصحيح:
 *   /offers/{categorySlug}/{merchantSlug|merchantId}/{offerSlug|offerId}
 *
 * (المسار القديم `/offers/{cat}/{companyId}/offer/{id}` لا يطابق أي راوت ويعطي 404)
 */
export function buildOfferUrl(offer: {
  id?: number | string;
  slug?: string | null;
  category?: { slug?: string | null; name?: string | null } | null;
  categorySlug?: string | null;
  merchant?: { id?: number | string; slug?: string | null } | null;
  merchantSlug?: string | null;
  companyId?: string | number | null;
}): string {
  const category =
    offer.category?.slug || offer.categorySlug || "all";
  const merchant =
    offer.merchant?.slug ||
    offer.merchantSlug ||
    offer.merchant?.id ||
    offer.companyId ||
    "merchant";
  const target = offer.slug || offer.id;

  return `/offers/${category}/${merchant}/${target}`;
}
