/**
 * نظام تصميم الموقع — نقطة استيراد واحدة:
 *   import { Button, Card, SectionHeader, MK } from "@ui";
 */
export {
  MK,
  GRADIENT,
  MOTION,
  RADIUS,
  SHADOW,
  SPACE,
  FONT,
  CONTAINER,
  SECTION,
  TAP,
  FOCUS,
  PALETTE,
  pick,
  normalizeHex,
  paletteFor,
  isTransparentHex,
} from "./tokens";

export { default as Button } from "./Button";
export type { ButtonVariant, ButtonSize } from "./Button";
export { default as Card } from "./Card";
export { default as Badge } from "./Badge";
export type { BadgeTone } from "./Badge";
export { default as SectionHeader } from "./SectionHeader";
export { default as StatChips } from "./StatChips";
export { default as PriceTag } from "./PriceTag";
export { default as OpenStatusBadge } from "./OpenStatusBadge";
export { default as EmptyState } from "./EmptyState";
export { default as ErrorState } from "./ErrorState";
export {
  default as Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonGrid,
  SkeletonRows,
} from "./Skeleton";
export { default as SmartImage, Ratio } from "./SmartImage";
export { default as PromoSection, promoHref, isPromoVisible, isExternalPromo } from "./PromoSection";
export type { PromoConfig, PromoDestination } from "./PromoSection";
export { default as OfferTile, offerDiscountPercent } from "./OfferTile";
export type { OfferTileData } from "./OfferTile";
export { default as PinnedChipsBar } from "./PinnedChipsBar";
export type { PinnedChip } from "./PinnedChipsBar";
export { default as CardTile, cardDiscountPercent } from "./CardTile";
export type { CardTileData } from "./CardTile";
export { default as CouponTile } from "./CouponTile";
export type { CouponTileData } from "./CouponTile";
export { default as PageHero } from "./PageHero";
export type { Crumb } from "./PageHero";

/* ===== أيقونات وأزرار الإجراءات الموحّدة ===== */
export { ShareIcon, BellIcon, HeartIcon } from "./icons";
export type { IconProps } from "./icons";
export { default as IconButton } from "./IconButton";
export type { IconButtonTone, IconButtonSize } from "./IconButton";
export { default as ShareButton } from "./ShareButton";
export { default as FavoriteButton } from "./FavoriteButton";
export { default as NotificationBell } from "./NotificationBell";

/* ===== مشتركات نسخة الموبايل ===== */
export { default as MobileSection, HScroll } from "./MobileSection";
