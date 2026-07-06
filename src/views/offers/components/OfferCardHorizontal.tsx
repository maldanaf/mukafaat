"use client";

import React, { useMemo } from "react";
import { Link } from "@/lib/router-compat";
import { FiStar, FiEye, FiShoppingBag } from "react-icons/fi";
import { BsHeart, BsHeartFill } from "react-icons/bs";
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

  return (
    <Link
      to={offerDetailPath}
      className="block bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg no-underline text-inherit"
      style={{ direction: isRTL ? "rtl" : "ltr" }}
    >
      <div className={`flex ${isRTL ? "flex-row" : "flex-row"}`} style={{ minHeight: "180px" }}>
        {/* الصورة */}
        <div className="relative w-[220px] min-w-[220px] overflow-hidden">
          <img
            src={getOfferImage(offer.image)}
            alt={pickLocalized(offer.title, langBase)}
            className="w-full h-full object-cover"
          />
          {/* باجات */}
          <div className="absolute top-2 start-2 flex flex-col gap-1.5">
            {offer.discountPercentage > 0 && (
              <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-medium">
                {offer.discountPercentage}% {t("offerCard.discountOff")}
              </span>
            )}
            {offer.requiresSubscription && (
              <span className="bg-[#400198] text-white px-2 py-0.5 rounded text-xs font-medium">
                {langBase === "ar" ? "للمشتركين" : "Subscribers"}
              </span>
            )}
          </div>
          {/* زر المفضلة */}
          <button
            type="button"
            onClick={handleFavoriteClick}
            className="absolute top-2 end-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-all"
            disabled={toggleFavorite.isPending}
          >
            {isFavorite ? <BsHeartFill className="text-sm text-red-500" /> : <BsHeart className="text-sm text-gray-600" />}
          </button>
        </div>

        {/* المحتوى */}
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            {/* التصنيف والتاجر */}
            <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
              {displayMerchantName && (
                <span className="flex items-center gap-1">
                  {storeImageUrl ? (
                    <img src={storeImageUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
                  ) : (
                    <FiShoppingBag className="w-3 h-3" />
                  )}
                  {displayMerchantName}
                </span>
              )}
              {displayCategoryName && displayMerchantName && <span className="text-gray-300">•</span>}
              {displayCategoryName && <span>{displayCategoryName}</span>}
            </div>

            {/* العنوان */}
            <h3 className="text-base font-bold text-gray-900 mb-1.5 line-clamp-1">
              {pickLocalized(offer.title, langBase)}
            </h3>

            {/* الوصف */}
            <p className="text-sm text-gray-500 mb-3 line-clamp-2">
              {stripHtml(pickLocalized(offer.description, langBase))}
            </p>

            {/* المميزات */}
            {offer.features.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {offer.features.slice(0, 4).map((f, i) => (
                  <span key={i} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* السعر والإحصائيات */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              {priceBefore > 0 && priceBefore > priceAfter && (
                <span className="text-xs text-gray-400 line-through flex items-center gap-0.5">
                  {langBase === "ar" ? "قبل" : "Before"}: {priceBefore} <CurrencyIcon className="text-gray-400" size={10} />
                </span>
              )}
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-[#400198] flex items-center gap-0.5">
                  {priceAfter} <CurrencyIcon className="text-[#400198]" size={14} />
                </span>
                {priceBefore > priceAfter && (
                  <span className="text-xs text-green-700 bg-green-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    {langBase === "ar" ? "خصم" : "Save"} {priceBefore - priceAfter} <CurrencyIcon className="text-green-700" size={10} />
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-0.5"><FiStar className="w-3.5 h-3.5" /> {offer.rating}</span>
              <span className="flex items-center gap-0.5"><FiEye className="w-3.5 h-3.5" /> {offer.views}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default OfferCardHorizontal;
