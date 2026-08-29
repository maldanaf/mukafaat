"use client";

import React, { useMemo } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { IoIosArrowRoundForward } from "react-icons/io";
import { FiStar, FiBookmark, FiClock, FiShoppingBag } from "react-icons/fi";
import { HeartIcon } from "@ui";
import { useIsRTL } from "@hooks";
import { useTranslation } from "react-i18next";
import { type CardOffer } from "@data/cards";
import type { CardOfferWithCompanyId } from "@network/mappers/cardsMapper";
import { useUserStore } from "@stores/userStore";
import { useFavorites, useFavoriteToggle } from "@hooks/api/useMokafaatQueries";
import { normalizeFavoritesList } from "@utils/favorites";
import { StatChips, PriceTag, SmartImage, Ratio, FOCUS } from "@ui";
import {
  VIVID_CARD,
  VIVID_MEDIA,
  VIVID_SCRIM,
  DiscountBadge,
  Ribbon,
  CornerButton,
} from "@views/offers/components/CatalogKit";
import { toast } from "react-toastify";
import {
  Cards1,
  Cards12,
  Cards13,
  Cards14,
  Cards2,
  Cards3,
  Cards4,
  Cards5,
  Cards6,
  Cards7,
  Cards8,
} from "@assets";
import { pickLocalized } from "@utils/pickLocalized";

interface CategoryItem {
  id: number;
  name: string;
  image?: string;
}

interface OfferCardProps {
  offer: CardOffer;
  companyId: string;
  onOfferClick?: (offer: CardOffer) => void;
  /** قائمة التصنيفات من الصفحة لاستخدام صورة التصنيف */
  categories?: CategoryItem[];
}

const OfferCard: React.FC<OfferCardProps> = ({
  offer,
  companyId,
  onOfferClick,
  categories,
}) => {
  const extendedOffer = offer as CardOfferWithCompanyId;
  const categoryImage = useMemo(
    () =>
      extendedOffer.categoryId && categories?.length
        ? categories.find((c) => c.id === extendedOffer.categoryId)?.image
        : undefined,
    [extendedOffer.categoryId, categories],
  );
  const isRTL = useIsRTL();
  const navigate = useNavigate();
  const offerRaw = offer as unknown as Record<string, unknown>;
  const merchantSlugFromOffer =
    typeof offerRaw.merchantSlug === "string" ? offerRaw.merchantSlug : "";
  const categoryFromOffer = offerRaw.category as Record<string, unknown> | undefined;
  const categorySlug =
    typeof categoryFromOffer?.slug === "string" ? categoryFromOffer.slug : "";
  const pathSlug = merchantSlugFromOffer || categorySlug || companyId || "cards";
  const detailPath = `/cards/${pathSlug}/${offerRaw.slug || offer.id}`;
  const { i18n, t } = useTranslation();
  const langBase = i18n.language?.split("-")[0] || "en";
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
          f.favorable_type === "card" &&
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
      { favorable_type: "card", favorable_id: offer.id },
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

  // Function to get card image (يدعم الرابط من API أو اسم الأصول)
  const getCardImage = (logoName: string) => {
    if (logoName.startsWith("http")) return logoName;
    switch (logoName) {
      case "Cards1":
        return Cards1;
      case "Cards2":
        return Cards2;
      case "Cards3":
        return Cards3;
      case "Cards4":
        return Cards4;
      case "Cards5":
        return Cards5;
      case "Cards6":
        return Cards6;
      case "Cards7":
        return Cards7;
      case "Cards8":
        return Cards8;
      case "Cards12":
        return Cards12;
      case "Cards13":
        return Cards13;
      case "Cards14":
        return Cards14;
      default:
        return Cards1;
    }
  };

  const validityText = useMemo(() => {
    const v = offer.validity as Record<string, string>;
    return v[langBase] ?? v.en ?? v.ar ?? "";
  }, [offer.validity, langBase]);

  // هل العرض مجاني للمستخدم الحالي؟
  const userObj = useUserStore((s) => s.user) as
    | (Record<string, unknown> & { has_subscription?: boolean })
    | null;
  const isSubscriber = Boolean(userObj?.has_subscription);
  const offerAny = offer as unknown as { pricingType?: string; requiresSubscription?: boolean };
  const isFreeForUser =
    offerAny.pricingType === "free" &&
    (!offerAny.requiresSubscription || isSubscriber);
  const visitButtonText = useMemo(
    () => t(isFreeForUser ? "home.product.viewNow" : "home.product.buyNow"),
    [t, isFreeForUser],
  );

  const purchaseText = useMemo(
    () => {
      const purchasesCount = Number.isFinite(Number(offer.purchases))
        ? Number(offer.purchases)
        : 0;
      return t("offerCard.purchases", { count: purchasesCount });
    },
    [offer.purchases, t],
  );

  const featuresText = useMemo(() => {
    const extra = Math.max(0, offer.features.length - 3);
    return t("offerCard.moreFeatures", { count: extra });
  }, [offer.features.length, t]);




  const priceAfter = Number(offer.price ?? 0);
  const priceBefore =
    offer.originalPrice != null ? Number(offer.originalPrice) : 0;

  /** نسبة الخصم — من السعرين مباشرة (لا يوجد حقل جاهز في موديل البطاقة) */
  const discountPercent =
    priceBefore > 0 && priceAfter >= 0 && priceBefore > priceAfter
      ? Math.round(((priceBefore - priceAfter) / priceBefore) * 100)
      : 0;

  const cardTitle = pickLocalized(offer.title, langBase);

  const cardContent = (
    <>
      {/* الصورة — نسبة محفوظة فلا تقفز الشبكة */}
      <div className={VIVID_MEDIA}>
        <Ratio ratio="aspect-[16/10]">
          <SmartImage
            src={getCardImage(offer.image)}
            alt={cardTitle}
            name={cardTitle}
            variant="name"
          />
        </Ratio>

        <span aria-hidden className={VIVID_SCRIM} />

        {/* شارة الخصم البارزة */}
        <DiscountBadge percent={discountPercent} size="lg" floating />

        <div className="absolute end-2 top-2 z-[2] flex gap-1.5">
          <CornerButton
            label={t("offerCard.favorites", "المفضلة")}
            pressed={isFavorite}
            disabled={toggleFavorite.isPending}
            className="hover:text-mk-red"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleFavoriteClick(e);
            }}
          >
            {isFavorite ? (
              <HeartIcon size={15} filled className="text-mk-red" />
            ) : (
              <HeartIcon size={15} />
            )}
          </CornerButton>
          <CornerButton
            label={t("offerCard.cardDetails", "تفاصيل البطاقة")}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOfferClick?.(offer);
            }}
          >
            <FiBookmark size={15} />
          </CornerButton>
        </div>

        {/* شارات الحالة والتصنيف */}
        <div className="absolute bottom-2 start-2 z-[2] flex max-w-[88%] flex-wrap items-center gap-1.5">
          {offer.isNew && <Ribbon tone="new">{t("offerCard.new")}</Ribbon>}
          {offer.isPopular && <Ribbon tone="hot">{t("offerCard.popular")}</Ribbon>}
          {extendedOffer.category && (
            <Ribbon tone="info">
              {categoryImage ? (
                <span className="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded bg-mk-tint">
                  <img src={categoryImage} alt="" className="h-full w-full object-contain" />
                </span>
              ) : (
                <FiShoppingBag className="h-3 w-3" aria-hidden />
              )}
              {extendedOffer.category.name}
            </Ribbon>
          )}
        </div>
      </div>

      {/* المحتوى — ارتفاع موحّد والسعر يثبت أسفل الكرت */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="mk-clamp-2 m-0 text-[15px] font-extrabold leading-snug text-mk-text">
          {cardTitle}
        </h3>

        {offer.features.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {offer.features.slice(0, 2).map((feature, index) => (
              <span
                key={index}
                className="flex items-center gap-1 rounded-full bg-mk-tint2 px-2 py-1 text-[11px] text-mk-text-strong"
              >
                <span aria-hidden className="h-1 w-1 rounded-full bg-mk-primary" />
                {feature}
              </span>
            ))}
            {offer.features.length > 2 && (
              <span className="rounded-full bg-mk-tint2 px-2 py-1 text-[11px] text-mk-faint">
                {featuresText}
              </span>
            )}
          </div>
        )}

        {validityText && (
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-mk-tint px-2 py-1 text-[11px] font-semibold text-mk-primary">
            <FiClock className="h-3 w-3" aria-hidden />
            {validityText}
          </span>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {Number(offer.rating) > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FDF4DE] px-2 py-1 text-[11px] font-bold text-[#8A6209]">
                <FiStar className="h-3 w-3" aria-hidden />
                {offer.rating}
              </span>
            )}
            {/* عدّادات موحّدة: مشاهدات / مفضلة / مشاركات */}
            <StatChips
              compact
              views={offer.views}
              favorites={extendedOffer.favoritesCount}
              shares={extendedOffer.sharesCount}
            />
          </div>
          <span className="shrink-0 text-[11px] text-mk-faint">{purchaseText}</span>
        </div>

        {/* السعر والزر */}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 border-t border-mk-divider pt-3">
          <PriceTag price={priceAfter} priceBefore={priceBefore} size="lg" stacked />
          <span className="inline-flex items-center gap-1 rounded-full bg-mk-tint px-3.5 py-2 text-[12.5px] font-extrabold text-mk-primary transition-colors group-hover/vivid:bg-mk-primary group-hover/vivid:text-white">
            {visitButtonText}
            <IoIosArrowRoundForward
              className={`text-xl ${isRTL ? "rotate-[225deg]" : "-rotate-45"}`}
              aria-hidden
            />
          </span>
        </div>
      </div>
    </>
  );

  return (
    <Link
      to={detailPath}
      className={`${VIVID_CARD} text-inherit no-underline ${FOCUS}`}
      style={{ direction: isRTL ? "rtl" : "ltr" }}
    >
      {cardContent}
    </Link>
  );
};

export default OfferCard;
