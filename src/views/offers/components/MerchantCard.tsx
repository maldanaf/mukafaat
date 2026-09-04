"use client";

import React, { useMemo } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { FiMapPin, FiTag, FiEye, FiHeart, FiShare2, FiStar } from "react-icons/fi";
import { MdVerified } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { SmartImage, Ratio, FOCUS, ShareIcon, HeartIcon } from "@ui";
import { API_BASE_URL } from "@config/api";
import { useUserStore } from "@stores/userStore";
import { useShareSheetStore } from "@stores/shareSheetStore";
import { useFavorites, useFavoriteToggle } from "@hooks/api/useMokafaatQueries";
import { normalizeFavoritesList } from "@utils/favorites";
import { merchantUrl } from "@utils/merchantUrl";
import { VIVID_CARD, VIVID_MEDIA, VIVID_SCRIM, CornerButton } from "./CatalogKit";

export interface MerchantSummary {
  id: number | string;
  slug?: string | null;
  name: string;
  description?: string | null;
  logo?: string | null;
  cover_image?: string | null;
  city?: string | null;
  category?: string | { name?: string; slug?: string | null } | null;
  rating?: number;
  reviews_count?: number;
  views_count?: number;
  favorites_count?: number;
  shares_count?: number;
  /** أعلى خصم دائم لدى المتجر — بطل الكرت */
  max_discount?: number | null;
  discounts_count?: number;
  is_open_now?: boolean;
  is_temporarily_closed?: boolean;
  is_coming_soon?: boolean;
  is_featured?: boolean;
  /** أُضيف خلال ٤٨ ساعة */
  is_new?: boolean;
  /** موثّق ⇒ علامة زرقاء بجوار الاسم */
  is_verified?: boolean;
}

const absolute = (path?: string | null): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
};

/** ١٢٣٤ ← ١٫٢ألف حتى لا يتمدّد الصفّ */
const compact = (n: number): string =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}K` : String(n);

/**
 * كرت متجر.
 *
 * الخصم الدائم أبرز ما فيه: اعتماد المنصّة على الاتفاقيات مع المتاجر
 * لا على العروض المؤقّتة، فالنسبة تتصدّر الكرت لا السعر.
 */
const MerchantCard: React.FC<{ merchant: MerchantSummary }> = ({ merchant }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const openShare = useShareSheetStore((s) => s.openShare);
  const isAuthenticated = useUserStore((s) => !!s.token);
  const { data: favoritesData } = useFavorites();
  const toggleFavorite = useFavoriteToggle();

  const href = merchantUrl(merchant);
  const cover = absolute(merchant.cover_image) ?? absolute(merchant.logo);
  const logo = absolute(merchant.logo);

  const categoryName =
    typeof merchant.category === "string"
      ? merchant.category
      : merchant.category?.name;

  const discount = Number(merchant.max_discount ?? 0);
  const hasDiscount = Number.isFinite(discount) && discount > 0;

  const rating = Number(merchant.rating ?? 0);
  const views = Number(merchant.views_count ?? 0);
  const favorites = Number(merchant.favorites_count ?? 0);
  const shares = Number(merchant.shares_count ?? 0);

  const favoritesList = useMemo(
    () => normalizeFavoritesList(favoritesData ?? null),
    [favoritesData],
  );
  const isFavorite = useMemo(
    () =>
      favoritesList.some(
        (f) =>
          f.favorable_type === "merchant" &&
          String(f.favorable_id) === String(merchant.id),
      ),
    [favoritesList, merchant.id],
  );

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate(`/login?returnUrl=${encodeURIComponent(href)}`);
      return;
    }
    toggleFavorite.mutate({
      favorable_type: "merchant",
      favorable_id: String(merchant.id),
    });
  };

  return (
    <Link to={href} className={`${VIVID_CARD} ${FOCUS}`}>
      <div className={VIVID_MEDIA}>
        <Ratio ratio="aspect-[2/1]">
          {cover ? (
            <SmartImage src={cover} alt={merchant.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-mk-tint2">
              <FiTag className="text-mk-faint" size={28} aria-hidden />
            </div>
          )}
        </Ratio>
        <span className={VIVID_SCRIM} aria-hidden />

        {/* شارة الخصم الدائم */}
        {hasDiscount && (
          <span className="absolute end-3 top-3 z-[2] flex flex-col items-center rounded-mk-md bg-[linear-gradient(135deg,#400198_0%,#6703EB_100%)] px-3 py-1.5 leading-none text-white shadow-[0_10px_24px_-8px_rgba(64,1,152,0.9)] ring-1 ring-white/25">
            <span className="text-[19px] font-extrabold" dir="ltr">
              {Number.isInteger(discount) ? discount : discount.toFixed(2).replace(/\.?0+$/, "")}%
            </span>
            <span className="text-[9.5px] font-bold opacity-95">
              {t("merchantCard.permanent", "خصم دائم")}
            </span>
          </span>
        )}

        {/* الحالة: «قريباً» أو «مميّز» أو «أضيف مؤخراً» */}
        <span className="absolute start-3 top-3 z-[2] flex flex-col items-start gap-1.5">
          {merchant.is_coming_soon && (
            <span className="rounded-full bg-[linear-gradient(135deg,#FFA23A_0%,#FD671A_100%)] px-3 py-1 text-[11px] font-extrabold text-white shadow-[0_8px_20px_-8px_rgba(253,103,26,0.95)] ring-1 ring-white/25">
              {t("merchantCard.coming_soon", "قريباً")}
            </span>
          )}
          {merchant.is_featured && !merchant.is_coming_soon && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[linear-gradient(135deg,#C2246E_0%,#7A1146_100%)] px-3 py-1 text-[11px] font-extrabold text-white shadow-[0_8px_20px_-8px_rgba(194,36,110,0.95)] ring-1 ring-white/25">
              <FiStar size={11} aria-hidden />
              {t("merchantCard.featured", "مميّز")}
            </span>
          )}
          {merchant.is_new && (
            <span className="rounded-full bg-[linear-gradient(135deg,#0E9384_0%,#0B7268_100%)] px-3 py-1 text-[11px] font-extrabold text-white shadow-[0_8px_20px_-8px_rgba(14,147,132,0.95)] ring-1 ring-white/25">
              {t("merchantCard.new", "أضيف مؤخراً")}
            </span>
          )}
        </span>

        {/* أزرار المشاركة والمفضلة — فوق الغلاف كبقية الكروت */}
        <div className="absolute bottom-3 end-3 z-[2] flex items-center gap-1.5">
          <CornerButton
            label={t("merchantCard.share", "مشاركة")}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openShare({
                title: merchant.name,
                url: `${window.location.origin}${href}`,
              });
            }}
          >
            <ShareIcon size={15} />
          </CornerButton>
          <CornerButton
            label={t("merchantCard.favorite", "المفضلة")}
            pressed={isFavorite}
            disabled={toggleFavorite.isPending}
            onClick={handleFavoriteClick}
          >
            <HeartIcon size={15} filled={isFavorite} />
          </CornerButton>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-start gap-2.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-mk-sm border border-mk-border bg-white">
            {logo ? (
              <SmartImage src={logo} alt="" className="h-full w-full object-contain" />
            ) : (
              <FiTag className="text-mk-faint" size={16} aria-hidden />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <h3 className="m-0 flex items-center gap-1 text-[14.5px] font-extrabold leading-snug text-mk-text-strong">
              <span className="line-clamp-1">{merchant.name}</span>
              {merchant.is_verified && (
                <MdVerified
                  className="shrink-0 text-[#1D9BF0]"
                  size={15}
                  aria-label={t("merchantCard.verified", "متجر موثّق")}
                  title={t("merchantCard.verified", "متجر موثّق")}
                />
              )}
            </h3>

            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-mk-muted">
              {categoryName && (
                <span className="font-bold text-mk-primary">{categoryName}</span>
              )}
              {merchant.city && (
                <span className="inline-flex items-center gap-1">
                  <FiMapPin size={11} aria-hidden />
                  {merchant.city}
                </span>
              )}
            </div>
          </div>

          {/* التقييم */}
          {rating > 0 && (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#FFF6E5] px-2 py-1 text-[11.5px] font-extrabold text-[#B4690E]">
              <FiStar size={11} className="fill-[#F5A623] text-[#F5A623]" aria-hidden />
              <span dir="ltr">{rating.toFixed(1)}</span>
              {merchant.reviews_count ? (
                <span className="font-bold opacity-70">({merchant.reviews_count})</span>
              ) : null}
            </span>
          )}
        </div>

        {/* إحصاءات التفاعل */}
        <div className="mt-2.5 flex items-center gap-3 text-[11.5px] font-bold text-mk-faint">
          <span className="inline-flex items-center gap-1" title={t("merchantCard.views", "المشاهدات")}>
            <FiEye size={12} aria-hidden />
            <span dir="ltr">{compact(views)}</span>
          </span>
          <span className="inline-flex items-center gap-1" title={t("merchantCard.favorites", "المفضلة")}>
            <FiHeart size={12} aria-hidden />
            <span dir="ltr">{compact(favorites)}</span>
          </span>
          <span className="inline-flex items-center gap-1" title={t("merchantCard.shares", "المشاركات")}>
            <FiShare2 size={12} aria-hidden />
            <span dir="ltr">{compact(shares)}</span>
          </span>
        </div>

      </div>
    </Link>
  );
};

export default MerchantCard;
