"use client";

import React, { useMemo } from "react";
import { Link } from "@/lib/router-compat";
import { FiStar, FiShoppingBag } from "react-icons/fi";
import OfferStats from "@components/OfferStats";
import { HeartIcon } from "@ui";
import { useIsRTL } from "@hooks";
import { useTranslation } from "react-i18next";
import { type Offer, getOfferImage, offerCategories } from "@data/offers";
import { API_BASE_URL } from "@config/api";
import CurrencyIcon from "@components/CurrencyIcon";
import { useUserStore } from "@stores/userStore";
import { useFavorites, useFavoriteToggle } from "@hooks/api/useMokafaatQueries";
import { normalizeFavoritesList } from "@utils/favorites";
import { toast } from "react-toastify";
import { stripHtml } from "@utils/stripHtml";
import { pickLocalized } from "@utils/pickLocalized";
import { useNavigate } from "@/lib/router-compat";
import { PriceTag, SmartImage, FOCUS } from "@ui";
import {
  VIVID_CARD,
  VIVID_MEDIA,
  VIVID_SCRIM,
  DiscountBadge,
  Ribbon,
  CornerButton,
  daysLeft,
  discountPercentOf,
} from "./CatalogKit";

interface Props {
  offer: Offer;
  onOfferClick?: (offer: Offer) => void;
}

const OfferCardHorizontal: React.FC<Props> = ({ offer }) => {
  const isRTL = useIsRTL();
  const { t, i18n } = useTranslation();
  const langBase = i18n.language?.split("-")[0] || "en";
  const navigate = useNavigate();
  const isAuthenticated = useUserStore((s) => !!s.token);
  const { data: favoritesData } = useFavorites();
  const toggleFavorite = useFavoriteToggle();
  const favoritesList = useMemo(
    () => normalizeFavoritesList(favoritesData ?? null),
    [favoritesData],
  );
  const isFavorite = useMemo(
    () =>
      favoritesList.some(
        (f) => f.favorable_type === "offer" && String(f.favorable_id) === String(offer.id),
      ),
    [favoritesList, offer.id],
  );

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    toggleFavorite.mutate(
      { favorable_type: "offer", favorable_id: offer.id },
      {
        onSuccess: () => toast.success(isFavorite ? t("couponModal.removedFromFavorites") : t("couponModal.addedToFavorites")),
        onError: () => toast.error(t("couponModal.errorGeneric")),
      },
    );
  };

  const categoryInfo = offerCategories.find((cat) => cat.key === offer.category);
  const displayCategoryName = offer.categoryName || (categoryInfo ? (langBase === "ar" ? categoryInfo.ar : categoryInfo.en) : "");
  const displayMerchantName = offer.merchantName || "";

  const storeImageUrl = useMemo(() => {
    if (offer.merchantLogo) {
      let url = offer.merchantLogo.trim();
      if (url && !url.startsWith("http")) {
        url = url.startsWith("/") ? `${API_BASE_URL}${url}` : `${API_BASE_URL}/storage/${url}`;
      }
      return url || null;
    }
    return null;
  }, [offer.merchantLogo]);

  const offerDetailPath = `/offers/${offer.category}/${offer.merchantSlug || offer.companyId}/${offer.slug || offer.id}`;
  const priceAfter = Number(offer.priceAfter ?? offer.discountPrice ?? 0);
  const priceBefore = Number(offer.priceBefore ?? offer.originalPrice ?? 0);

  const discountPercent = discountPercentOf(
    offer.discountPercentage,
    priceBefore,
    priceAfter,
  );
  const endsIn = daysLeft(offer.availableUntil);
  const endingSoon = endsIn !== null && endsIn >= 0 && endsIn <= 3;

  return (
    <Link
      to={offerDetailPath}
      className={`${VIVID_CARD} !flex-row items-stretch text-inherit no-underline ${FOCUS}`}
      style={{ direction: isRTL ? "rtl" : "ltr" }}
    >
      {/* الصورة — نسبة محفوظة بلا قفزات تخطيط */}
      <div
        className={`${VIVID_MEDIA} w-[220px] min-w-[220px] shrink-0 self-stretch border-b-0 border-e border-mk-border`}
      >
        <div className="absolute inset-0 [&>*]:h-full [&>*]:w-full">
          <SmartImage
            src={getOfferImage(offer.image)}
            alt={pickLocalized(offer.title, langBase)}
            name={pickLocalized(offer.title, langBase)}
            variant="name"
          />
        </div>
        <span aria-hidden className={VIVID_SCRIM} />

        <DiscountBadge percent={discountPercent} size="md" floating />

        <div className="absolute bottom-2 start-2 z-[2] flex max-w-[90%] flex-wrap gap-1.5">
          {offer.isNew && <Ribbon tone="new">{t("offerCard.new")}</Ribbon>}
          {(offer.isBestSeller || offer.isPopular) && (
            <Ribbon tone="hot">{t("offerCard.bestSeller")}</Ribbon>
          )}
          {endingSoon && (
            <Ribbon tone="ending">
              {endsIn === 0
                ? t("offerCard.endsToday", "ينتهي اليوم")
                : t("offerCard.endsInDays", { days: endsIn as number })}
            </Ribbon>
          )}
          {offer.requiresSubscription && (
            <Ribbon tone="vip">{t("offerCard.subscribersOnly", "حصري للمشتركين")}</Ribbon>
          )}
        </div>

        <CornerButton
          className="absolute end-2 top-2 z-[2] hover:text-mk-red"
          label={t("offerCard.favorites", "المفضلة")}
          pressed={isFavorite}
          disabled={toggleFavorite.isPending}
          onClick={handleFavoriteClick}
        >
          <HeartIcon size={15} filled={isFavorite} className={isFavorite ? "text-mk-red" : ""} />
        </CornerButton>
      </div>

      {/* المحتوى */}
      <div className="flex min-h-[200px] min-w-0 flex-1 flex-col justify-between gap-3 p-4">
        <div className="min-w-0">
          {/* التصنيف والتاجر */}
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[11.5px] text-mk-muted">
            {displayMerchantName && (
              <span className="flex items-center gap-1.5 font-semibold text-mk-text-strong">
                {storeImageUrl ? (
                  <img
                    src={storeImageUrl}
                    alt=""
                    className="h-5 w-5 rounded-full object-cover ring-1 ring-mk-border"
                  />
                ) : (
                  <FiShoppingBag className="h-3.5 w-3.5" />
                )}
                {displayMerchantName}
              </span>
            )}
            {displayCategoryName && displayMerchantName && (
              <span aria-hidden className="text-mk-faint">
                •
              </span>
            )}
            {displayCategoryName && <span>{displayCategoryName}</span>}
          </div>

          <h3 className="mk-clamp-1 m-0 mb-1.5 text-[16px] font-extrabold text-mk-text">
            {pickLocalized(offer.title, langBase)}
          </h3>

          <p className="mk-clamp-2 m-0 mb-3 text-[13px] leading-relaxed text-mk-muted">
            {stripHtml(pickLocalized(offer.description, langBase))}
          </p>

          {offer.features.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {offer.features.slice(0, 4).map((f, i) => (
                <span
                  key={i}
                  className="rounded-full bg-mk-tint2 px-2 py-1 text-[11px] text-mk-text-strong"
                >
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* السعر والإحصائيات */}
        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-mk-divider pt-3">
          <div className="flex flex-col gap-1">
            <PriceTag price={priceAfter} priceBefore={priceBefore} size="lg" stacked />
            {priceBefore > priceAfter && (
              <span className="inline-flex w-fit items-center gap-0.5 rounded bg-[#E4F6EF] px-1.5 py-0.5 text-[11px] font-semibold text-mk-green">
                {t("offerCard.save", langBase === "ar" ? "توفير" : "Save")}{" "}
                {priceBefore - priceAfter}
                <CurrencyIcon className="text-mk-green" size={10} />
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11.5px] text-mk-faint">
            {Number(offer.rating) > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FDF4DE] px-2 py-1 font-bold text-[#8A6209]">
                <FiStar className="h-3.5 w-3.5" aria-hidden /> {offer.rating}
              </span>
            )}
            {/* مشاهدات / مفضلة / مشاركات */}
            <OfferStats
              views={offer.views}
              favorites={offer.favoritesCount}
              shares={offer.sharesCount}
              className="text-mk-faint"
              iconSize="w-3.5 h-3.5"
              textSize="text-xs"
              gap="gap-3"
            />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default OfferCardHorizontal;
