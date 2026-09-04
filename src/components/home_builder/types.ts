/**
 * عقد `data.layout` القادم من `GET /api/web/home`
 * (تبنيه لوحة التحكم في شاشة «بناء واجهة الموقع»).
 */
import type { OfferTileData, PromoConfig } from "@ui";

/** أشكال عرض قسم عروض التصنيف على الويب */
export type WebDisplayStyle = "grid_4" | "grid_3" | "carousel" | "list";

/** أشكال عرض بلوك المتاجر — يضيف «الشعارات المضغوطة» على أشكال العروض */
export type MerchantDisplayStyle = WebDisplayStyle | "logos";

/** كرت المتجر داخل بلوك المتاجر */
export interface LayoutMerchant {
  id: number;
  slug?: string | null;
  name: string;
  logo?: string | null;
  cover_image?: string | null;
  city?: string | null;
  category?: { id: number; name: string; slug?: string | null } | null;
  rating?: number;
  reviews_count?: number;
  views_count?: number;
  favorites_count?: number;
  shares_count?: number;
  max_discount?: number | null;
  discounts_count?: number;
  is_verified?: boolean;
  is_coming_soon?: boolean;
  is_open_now?: boolean;
}

/** شكل البانر الترويجي الحرّ */
export type WebBannerLayout = "banner" | "card";

/** بيانات البانر الترويجي — نفس عقد `home_sections` مع شكل العرض */
export interface LayoutBannerConfig extends PromoConfig {
  layout?: WebBannerLayout;
}

/** عنصر واحد في التخطيط */
export interface LayoutSection {
  id: number;
  sort_order: number;
  type: "builtin" | "category_offers" | "category_merchants" | "promo_banner";
  /** مفتاح القسم الجاهز، أو `category_{id}` / `banner_{id}` */
  key: string;
  /** عنوان مخصّص من اللوحة — null = العنوان الافتراضي المترجَم */
  title: string | null;
  show_view_all: boolean;
  display_style: WebDisplayStyle | MerchantDisplayStyle | WebBannerLayout | null;
  category_id: number | null;
  category_slug: string | null;
  /** معرّفات تصنيفات بلوك المتاجر (بلوك المتاجر فقط) */
  category_ids?: number[];
  items: OfferTileData[] | LayoutMerchant[];
  banner: LayoutBannerConfig | null;
}

/** يقرأ التخطيط من استجابة الرئيسية — يرجع null إن غاب أو كان فارغاً */
export function readLayout(home: Record<string, any> | null | undefined): LayoutSection[] | null {
  const raw = home?.layout;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  return raw.filter((section) => section && typeof section === "object") as LayoutSection[];
}
