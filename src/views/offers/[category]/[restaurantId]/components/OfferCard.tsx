"use client";

import React, { useMemo } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useIsRTL } from "@hooks";
import { useTranslation } from "react-i18next";
import { type Offer } from "@data/offers";
import { Pro1, Pro2, Pro3, Pro4, Pro5, Pro6, Pro7, Pro8 } from "@assets";
import CurrencyIcon from "@components/CurrencyIcon";
import OfferStats from "@components/OfferStats";
import { HeartIcon, PriceTag, SmartImage, Ratio, FOCUS } from "@ui";
import {
  VIVID_CARD,
  VIVID_MEDIA,
  VIVID_SCRIM,
  DiscountBadge,
  Ribbon,
  CornerButton,
  discountPercentOf,
} from "@views/offers/components/CatalogKit";
import { stripHtml } from "@utils/stripHtml";
import { useUserStore } from "@stores/userStore";
import { useFavorites, useFavoriteToggle } from "@hooks/api/useMokafaatQueries";
import { normalizeFavoritesList } from "@utils/favorites";
import { toast } from "react-toastify";

interface OfferCardProps {
  offer: Offer;
  onOfferClick: (offer: Offer) => void;
}

const OfferCard: React.FC<OfferCardProps> = ({ offer, onOfferClick }) => {
  const isRTL = useIsRTL();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAuthenticated = useUserStore((s) => !!s.token);
  const userObj = useUserStore((s) => s.user) as
    | (Record<string, unknown> & { has_subscription?: boolean })
    | null;
  const isSubscriber = Boolean(userObj?.has_subscription);
  const isFreeForUser =
    offer.pricingType === "free" &&
    (!offer.requiresSubscription || isSubscriber);
  const { data: favoritesData } = useFavorites();
  const toggleFavorite = useFavoriteToggle();
  const favoritesList = useMemo(
    () => normalizeFavoritesList(favoritesData ?? null),
    [favoritesData],
  );
  const isFavorite = useMemo(
    () =>
      favoritesList.some(
        (f) =>
          f.favorable_type === "offer" &&
          String(f.favorable_id) === String(offer.id),
      ),
    [favoritesList, offer.id],
  );

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate(
        `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`,
      );
      return;
    }
    toggleFavorite.mutate(
      { favorable_type: "offer", favorable_id: offer.id },
      {
        onSuccess: () => {
          toast.success(
            isFavorite
              ? isRTL
                ? "تمت إزالته من المفضلة"
                : "Removed from favorites"
              : isRTL
                ? "تمت الإضافة إلى المفضلة"
                : "Added to favorites",
          );
        },
        onError: () => toast.error(isRTL ? "حدث خطأ" : "Something went wrong"),
      },
    );
  };

  const getOfferImage = (imageName: string) => {
    // If it's already a URL, return it directly
    if (imageName.startsWith("http")) {
      return imageName;
    }

    // Otherwise, use the local images
    switch (imageName) {
      case "Pro1":
        return Pro1;
      case "Pro2":
        return Pro2;
      case "Pro3":
        return Pro3;
      case "Pro4":
        return Pro4;
      case "Pro5":
        return Pro5;
      case "Pro6":
        return Pro6;
      case "Pro7":
        return Pro7;
      case "Pro8":
        return Pro8;
      default:
        return Pro1;
    }
  };

  const title = offer.title[isRTL ? "ar" : "en"];
  const priceAfter = Number(offer.priceAfter ?? offer.discountPrice ?? 0);
  const priceBefore = Number(offer.priceBefore ?? offer.originalPrice ?? 0);
  const discountPercent = discountPercentOf(
    offer.discountPercentage,
    priceBefore,
    priceAfter,
  );

  return (
    <div
      role="button"
      tabIndex={0}
      className={`${VIVID_CARD} cursor-pointer ${FOCUS}`}
      onClick={() => onOfferClick(offer)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOfferClick(offer);
        }
      }}
    >
      {/* الصورة — نسبة محفوظة بلا قفزات تخطيط */}
      <div className={VIVID_MEDIA}>
        <Ratio ratio="aspect-[16/10]">
          <SmartImage
            src={getOfferImage(offer.image)}
            alt={title}
            name={title}
            variant="name"
          />
        </Ratio>

        <span aria-hidden className={VIVID_SCRIM} />

        <DiscountBadge percent={discountPercent} size="lg" floating />

        <CornerButton
          className="absolute end-2 top-2 z-[2] hover:text-mk-red"
          label={t("offerCard.favorites", "المفضلة")}
          pressed={isFavorite}
          disabled={toggleFavorite.isPending}
          onClick={handleFavoriteClick}
        >
          <HeartIcon size={15} filled={isFavorite} className={isFavorite ? "text-mk-red" : ""} />
        </CornerButton>

        {/* شارات الحالة ومدّة الصلاحية */}
        <div className="absolute bottom-2 start-2 z-[2] flex max-w-[88%] flex-wrap gap-1.5">
          {offer.isNew && <Ribbon tone="new">{t("offerCard.new")}</Ribbon>}
          {offer.isBestSeller && <Ribbon tone="hot">{t("offerCard.bestSeller")}</Ribbon>}
          {offer.validity[isRTL ? "ar" : "en"] && (
            <Ribbon tone="info">{offer.validity[isRTL ? "ar" : "en"]}</Ribbon>
          )}
        </div>
      </div>

      {/* المحتوى */}
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <h3 className="mk-clamp-2 m-0 text-[15px] font-extrabold leading-snug text-mk-text">
          {title}
        </h3>

        <p className="mk-clamp-2 m-0 text-[12.5px] leading-relaxed text-mk-muted">
          {stripHtml(offer.description[isRTL ? "ar" : "en"])}
        </p>

        {offer.features.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {offer.features.slice(0, 3).map((feature, index) => (
              <span
                key={index}
                className="flex items-center gap-1 rounded-full bg-mk-tint2 px-2 py-1 text-[11px] text-mk-text-strong"
              >
                <span aria-hidden className="h-1 w-1 rounded-full bg-mk-primary" />
                {feature}
              </span>
            ))}
            {offer.features.length > 3 && (
              <span className="rounded-full bg-mk-tint2 px-2 py-1 text-[11px] text-mk-faint">
                +{offer.features.length - 3}
              </span>
            )}
          </div>
        )}

        {/* التقييم والعدّادات */}
        <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-mk-muted">
          {Number(offer.rating) > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FDF4DE] px-2 py-1 font-bold text-[#8A6209]">
              <span aria-hidden>★</span>
              {offer.rating}
              {offer.reviewsCount ? ` (${offer.reviewsCount})` : ""}
            </span>
          )}
          {/* مشاهدات / مفضلة / مشاركات */}
          <OfferStats
            views={offer.views}
            favorites={offer.favoritesCount}
            shares={offer.sharesCount}
            className="text-mk-muted"
            iconSize="w-3.5 h-3.5"
            textSize="text-xs"
          />
        </div>

        {/* السعر والزر */}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 border-t border-mk-divider pt-3">
          <PriceTag price={priceAfter} priceBefore={priceBefore} size="lg" stacked />
          <span className="inline-flex items-center gap-1 rounded-full bg-mk-tint px-3.5 py-2 text-[12.5px] font-extrabold text-mk-primary transition-colors group-hover/vivid:bg-mk-primary group-hover/vivid:text-white">
            {t(isFreeForUser ? "home.product.viewNow" : "home.product.buyNow")}
            <span aria-hidden className="rtl:-scale-x-100">
              &#8594;
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default OfferCard;
