/**
 * Normalize GET /api/favorites response to a unified list.
 * يدعم أشكال: data.data, data.favorites, data = array، والعنصر: favorable_type, favorable_id, favorable { image, name_ar, name_en, ... }
 */
export interface NormalizedFavorite {
  id: string;
  type: "offer" | "card" | "coupon" | "booking" | "merchant";
  favorable_type: string;
  favorable_id: string | number;
  image: string;
  title: { ar: string; en: string };
  price?: number;
  originalPrice?: number;
  savedAt: string;
  category?: string;
  categorySlug?: string;
  companyId?: string;
  itemSlug?: string;
  merchantSlug?: string;
  bookingType?: string;
  /** عدّادات موحّدة — تُعرض فقط إن أرجعها الـAPI (وأحدها > 0) */
  viewsCount?: number;
  favoritesCount?: number;
  sharesCount?: number;
}

export function normalizeFavoritesList(data: unknown): NormalizedFavorite[] {
  const raw = (data as Record<string, unknown>)?.data ?? data;
  let list: unknown[] = [];
  if (Array.isArray(raw)) list = raw;
  else if (raw && typeof raw === "object") {
    const arr = (raw as Record<string, unknown>).data ?? (raw as Record<string, unknown>).favorites ?? (raw as Record<string, unknown>).list;
    list = Array.isArray(arr) ? arr : [];
  }
  return list.map((item) => normalizeFavoriteItem(item)).filter(Boolean) as NormalizedFavorite[];
}

function normalizeFavoriteItem(row: unknown): NormalizedFavorite | null {
  const r = row as Record<string, unknown> | undefined;
  if (!r || typeof r !== "object") return null;
  const type = String(r.favorable_type ?? r.type ?? "offer").toLowerCase();
  const favorableType =
    type === "card" || type === "coupon" || type === "merchant" || type === "booking"
      ? type
      : "offer";
  const favorableId = r.favorable_id ?? r.id;
  if (favorableId == null) return null;
  const favorable = (r.favorable ?? r.item ?? r) as Record<string, unknown> | undefined;
  const img = (favorable?.image ?? favorable?.logo ?? r.image ?? favorable?.thumbnail) as string | undefined;
  const nameAr = (favorable?.name_ar ?? favorable?.title_ar ?? favorable?.name ?? r.name_ar ?? r.name) as string | undefined;
  const nameEn = (favorable?.name_en ?? favorable?.title_en ?? favorable?.name ?? r.name_en ?? r.name) as string | undefined;
  const priceAfter = (favorable?.price_after ?? r.price_after) as number | string | undefined;
  const priceBefore = (favorable?.price_before ?? r.price_before) as number | string | undefined;
  const price = priceAfter ?? favorable?.price ?? favorable?.discount_price ?? r.price;
  const originalPrice = priceBefore ?? favorable?.old_price ?? favorable?.original_price ?? r.originalPrice;
  const savedAt = (r.created_at ?? r.saved_at ?? r.createdAt ?? new Date().toISOString()) as string;
  const categoryVal = favorable?.category ?? r.category;
  const merchant = (r.merchant ?? favorable?.merchant) as Record<string, unknown> | undefined;
  const companyIdVal = merchant?.id ?? favorable?.company_id ?? favorable?.merchant_id ?? r.company_id;
  const itemSlug = (r.slug ?? favorable?.slug) as string | undefined;
  const merchantSlug = merchant?.slug as string | undefined;
  const categorySlug = (r.category_slug ?? favorable?.category_slug) as string | undefined;
  const bookingType = (r.booking_type ?? favorable?.booking_type ?? r.type) as string | undefined;
  const num = (value: unknown): number | undefined => {
    if (value === null || value === undefined || value === "") return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  };
  return {
    // المعرّف في /api/favorites هو معرّف العنصر نفسه — نضيف النوع حتى لا
    // يتصادم مفتاح React بين عرض وكوبون يحملان نفس الرقم.
    id: `fav_${favorableType}_${favorableId}`,
    type: favorableType as NormalizedFavorite["type"],
    favorable_type: favorableType,
    favorable_id: favorableId as string | number,
    image: img && typeof img === "string" ? img : "",
    title: { ar: (nameAr && String(nameAr)) || "—", en: (nameEn && String(nameEn)) || "—" },
    price: typeof price === "number" ? price : typeof price === "string" ? parseFloat(price) : undefined,
    originalPrice: typeof originalPrice === "number" ? originalPrice : typeof originalPrice === "string" ? parseFloat(originalPrice as string) : undefined,
    savedAt: String(savedAt),
    category: typeof categoryVal === "string" ? categoryVal : undefined,
    categorySlug: typeof categorySlug === "string" ? categorySlug : undefined,
    companyId: typeof companyIdVal === "string" ? companyIdVal : typeof companyIdVal === "number" ? String(companyIdVal) : undefined,
    itemSlug: typeof itemSlug === "string" ? itemSlug : undefined,
    merchantSlug: typeof merchantSlug === "string" ? merchantSlug : undefined,
    bookingType: favorableType === "booking" && typeof bookingType === "string" ? bookingType : undefined,
    viewsCount: num(r.views_count ?? favorable?.views_count),
    favoritesCount: num(r.favorites_count ?? favorable?.favorites_count),
    sharesCount: num(r.shares_count ?? favorable?.shares_count),
  };
}
