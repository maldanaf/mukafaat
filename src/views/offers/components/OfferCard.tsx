"use client";

import React, { useMemo } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { FiGift, FiClock, FiShoppingBag, FiStar } from "react-icons/fi";
import { ShareIcon, HeartIcon } from "@ui";
import { useIsRTL } from "@hooks";
import { useTranslation } from "react-i18next";
import {
  type Offer,
  getOfferImage,
  getRestaurantById,
  offerCategories,
} from "@data/offers";
import { API_BASE_URL } from "@config/api";
import CurrencyIcon from "@components/CurrencyIcon";
import { useUserStore } from "@stores/userStore";
import { useFavorites, useFavoriteToggle } from "@hooks/api/useMokafaatQueries";
import { normalizeFavoritesList } from "@utils/favorites";
import { toast } from "react-toastify";
import { stripHtml } from "@utils/stripHtml";
import { useShareSheetStore } from "@stores/shareSheetStore";
import { pickLocalized } from "@utils/pickLocalized";
import { Badge, PriceTag, StatChips, SmartImage, Ratio, FOCUS } from "@ui";
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

interface OfferCardProps {
  offer: Offer;
  onOfferClick?: (offer: Offer) => void;
}

/**
 * كرت العرض الرئيسي في الموقع — بلغة تصميم التطبيق:
 * صورة بأبعاد محفوظة، شارات موحّدة، سعر مشطوب عند الخصم،
 * عدّادات (مشاهدات/مفضلة/مشاركات) بأيقونات، وحواف 18px مع ظل بنفسجي ناعم.
 * كل وظائف الكرت السابقة محفوظة (مفضلة، مشاركة، مميزات، حصري للمشتركين).
 */
const OfferCard: React.FC<OfferCardProps> = ({ offer }) => {
  const isRTL = useIsRTL();
  const { t, i18n } = useTranslation();
  const langBase = i18n.language?.split("-")[0] || "en";
  const navigate = useNavigate();
  const openShare = useShareSheetStore((s) => s.openShare);
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
        (f) =>
          f.favorable_type === "offer" &&
          String(f.favorable_id) === String(offer.id),
      ),
    [favoritesList, offer.id],
  );

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
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
              ? t("couponModal.removedFromFavorites")
              : t("couponModal.addedToFavorites"),
          );
        },
        onError: () => toast.error(t("couponModal.errorGeneric")),
      },
    );
  };

  const company = getRestaurantById(offer.companyId);
  const categoryInfo = offerCategories.find((cat) => cat.key === offer.category);
  const displayCategoryName =
    offer.categoryName ||
    (categoryInfo ? (langBase === "ar" ? categoryInfo.ar : categoryInfo.en) : "");
  const displayMerchantName =
    offer.merchantName || (company ? pickLocalized(company.name, langBase) : "");

  const storeImageUrl = useMemo(() => {
    if (offer.merchantLogo) {
      let url = offer.merchantLogo.trim();
      if (url.includes("/storage/https://")) {
        const i = url.indexOf("/storage/https://");
        url =
          url.slice(0, i + "/storage".length) +
          url.slice(i + "/storage/https://".length);
      }
      if (url && !url.startsWith("http")) {
        url = url.startsWith("/")
          ? `${API_BASE_URL}${url}`
          : `${API_BASE_URL}/storage/${url}`;
      }
      return url || null;
    }
    if (company?.logo) return getOfferImage(company.logo);
    return null;
  }, [offer.merchantLogo, company?.logo]);

  /** شارة نوع العرض: الأكثر مبيعاً / جديد / عرض */
  const typeBadge = offer.isBestSeller
    ? { icon: <FiGift />, label: t("offerCard.bestSeller"), tone: "solid-accent" as const }
    : offer.isNew
      ? { icon: <FiClock />, label: t("offerCard.new"), tone: "success" as const }
      : { icon: <FiGift />, label: t("offerCard.typeOffer"), tone: "primary" as const };

  const userObj = useUserStore((s) => s.user) as
    | (Record<string, unknown> & { has_subscription?: boolean })
    | null;
  const isSubscriber = Boolean(userObj?.has_subscription);
  const isFreeForUser =
    offer.pricingType === "free" && (!offer.requiresSubscription || isSubscriber);
  const visitButtonText = isFreeForUser
    ? t("home.product.viewNow")
    : t("home.product.buyNow");

  const purchasesCount = Number.isFinite(Number(offer.purchases))
    ? Number(offer.purchases)
    : 0;
  const purchaseText = t("offerCard.purchases", { count: purchasesCount });
  const featuresMoreText =
    offer.features.length > 3
      ? t("offerCard.moreFeatures", { count: offer.features.length - 3 })
      : "";

  const offerDetailPath = `/offers/${offer.category}/${offer.merchantSlug || offer.companyId}/${offer.slug || offer.id}`;
  /** من API `price_after` (مع fallback لـ discountPrice للداتا المحلية) */
  const priceAfter = Number(offer.priceAfter ?? offer.discountPrice ?? 0);
  /** من API `price_before` (مع fallback لـ originalPrice) */
  const priceBefore = Number(offer.priceBefore ?? offer.originalPrice ?? 0);
  const saving = priceBefore > priceAfter ? priceBefore - priceAfter : 0;

  const title = pickLocalized(offer.title, langBase);

  /** نسبة الخصم — من الحقل أو محسوبة من السعرين */
  const discountPercent = discountPercentOf(
    offer.discountPercentage,
    priceBefore,
    priceAfter,
  );

  /** شارات الحالة — كلٌّ منها يظهر فقط عند توفّر بياناته من الـAPI */
  const endsIn = daysLeft(offer.availableUntil);
  const endingSoon = endsIn !== null && endsIn >= 0 && endsIn <= 3;
  const endingLabel = endingSoon
    ? endsIn === 0
      ? t("offerCard.endsToday", "ينتهي اليوم")
      : t("offerCard.endsInDays", { days: endsIn as number })
    : "";

  return (
    <Link
      to={offerDetailPath}
      dir={isRTL ? "rtl" : "ltr"}
      className={`${VIVID_CARD} text-inherit no-underline ${FOCUS}`}
    >
      {/* الصورة — أبعاد محفوظة فلا تقفز الشبكة أثناء التحميل */}
      <div className={VIVID_MEDIA}>
        <Ratio ratio="aspect-[16/10]">
          <SmartImage
            src={getOfferImage(offer.image)}
            alt={stripHtml(title ?? "")}
            name={stripHtml(title ?? "")}
            variant="name"
          />
        </Ratio>

        <span aria-hidden className={VIVID_SCRIM} />

        {/* شارة الخصم البارزة */}
        <DiscountBadge percent={discountPercent} size="lg" floating />

        {/* إجراءات سريعة — أهداف لمس 44px */}
        <div className="absolute end-2 top-2 z-[2] flex gap-1.5">
          <CornerButton
            label={t("offerCard.shares", "المشاركات")}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openShare({
                title: stripHtml(title ?? ""),
                url: `${window.location.origin}${offerDetailPath}`,
              });
            }}
          >
            <ShareIcon size={15} />
          </CornerButton>
          <CornerButton
            label={t("offerCard.favorites", "المفضلة")}
            pressed={isFavorite}
            disabled={toggleFavorite.isPending}
            onClick={handleFavoriteClick}
            className="hover:text-mk-red"
          >
            {isFavorite ? (
              <HeartIcon size={15} filled className="text-mk-red" />
            ) : (
              <HeartIcon size={15} />
            )}
          </CornerButton>
        </div>

        {/* شارات: جديد / الأكثر طلباً / ينتهي قريباً / حصري للمشتركين */}
        <div className="absolute bottom-2 start-2 z-[2] flex max-w-[88%] flex-wrap gap-1.5">
          {offer.isNew && <Ribbon tone="new">{t("offerCard.new")}</Ribbon>}
          {(offer.isBestSeller || offer.isPopular) && (
            <Ribbon tone="hot">{t("offerCard.bestSeller")}</Ribbon>
          )}
          {endingSoon && <Ribbon tone="ending">{endingLabel}</Ribbon>}
          {offer.requiresSubscription && (
            <Ribbon tone="vip">{t("offerCard.subscribersOnly", "حصري للمشتركين")}</Ribbon>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <Badge tone={typeBadge.tone} size="sm" className="w-fit">
          <span aria-hidden className="text-[11px]">
            {typeBadge.icon}
          </span>
          {typeBadge.label}
        </Badge>

        <h3 className="mk-clamp-2 m-0 text-[15px] font-bold leading-snug text-mk-text">
          {title}
        </h3>

        <p className="mk-clamp-2 m-0 text-[12.5px] leading-relaxed text-mk-muted">
          {stripHtml(pickLocalized(offer.description, langBase))}
        </p>

        {/* التصنيف والمتجر */}
        {(displayCategoryName || displayMerchantName) && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-mk-text-strong">
            {displayCategoryName && (
              <span className="flex items-center gap-1.5 font-medium">
                {categoryInfo?.icon != null && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded bg-mk-tint">
                    {typeof categoryInfo.icon === "string" ? (
                      <img src={categoryInfo.icon} alt="" className="h-full w-full object-contain" />
                    ) : (
                      React.createElement(
                        categoryInfo.icon as React.ComponentType<{ className?: string }>,
                        { className: "h-3 w-3 text-mk-primary" },
                      )
                    )}
                  </span>
                )}
                <span>{displayCategoryName}</span>
              </span>
            )}
            {displayCategoryName && displayMerchantName && (
              <span aria-hidden className="text-mk-faint">
                •
              </span>
            )}
            {displayMerchantName && (
              <span className="flex items-center gap-1.5 font-medium">
                {storeImageUrl ? (
                  <span className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full bg-mk-tint2 ring-1 ring-mk-border">
                    <img src={storeImageUrl} alt="" className="h-full w-full object-cover" />
                  </span>
                ) : (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mk-tint">
                    <FiShoppingBag className="h-3 w-3 text-mk-primary" />
                  </span>
                )}
                <span>{displayMerchantName}</span>
              </span>
            )}
          </div>
        )}

        {/* المميزات */}
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
                {featuresMoreText}
              </span>
            )}
          </div>
        )}

        {/* التقييم + العدّادات + عدد المشتريات */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {Number(offer.rating) > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FDF4DE] px-2 py-1 text-[11.5px] font-bold text-[#8A6209]">
                <FiStar className="h-3.5 w-3.5" aria-hidden />
                {offer.rating}
              </span>
            )}
            <StatChips
              compact
              views={offer.views}
              favorites={offer.favoritesCount}
              shares={offer.sharesCount}
            />
          </div>
          {purchasesCount > 0 && (
            <span className="text-[11px] text-mk-faint">{purchaseText}</span>
          )}
        </div>

        {/* السعر والزر — السعر الجديد كبير والقديم مشطوب */}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 border-t border-mk-divider pt-3">
          <div className="flex flex-col gap-1">
            <PriceTag
              price={priceAfter}
              priceBefore={priceBefore}
              size="lg"
              stacked
              freeLabel={
                offer.pricingType === "free" ? t("offerCard.free", "بدون رسوم") : undefined
              }
            />
            {saving > 0 && (
              <span className="inline-flex w-fit items-center gap-0.5 rounded bg-[#E4F6EF] px-1.5 py-0.5 text-[11px] font-semibold text-mk-green">
                {t("offerCard.save", "توفير")} {saving}
                <CurrencyIcon className="text-mk-green" size={10} />
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-mk-tint px-3.5 py-2 text-[13px] font-extrabold text-mk-primary transition-colors group-hover/vivid:bg-mk-primary group-hover/vivid:text-white">
            {visitButtonText}
            <span aria-hidden className="rtl:-scale-x-100">
              &#8594;
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
};

export default OfferCard;
