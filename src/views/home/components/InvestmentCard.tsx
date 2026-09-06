"use client";

import { t } from "i18next";
import React, { useMemo } from "react";
import { useIsRTL } from "@hooks";
import { ShareIcon, HeartIcon } from "@ui";
import { IoStar } from "react-icons/io5";
import { useNavigate } from "@/lib/router-compat";
import { useFavorites, useFavoriteToggle } from "@hooks/api/useMokafaatQueries";
import { useUserStore } from "@stores/userStore";
import { normalizeFavoritesList } from "@utils/favorites";
import { toast } from "react-toastify";

interface InvestmentCardProps {
  id: number;
  image: string;
  title: string;
  price: string;
  rating?: number;
  onShare?: (id: number) => void;
  favoriteType?: "booking" | "offer" | "card";
  onClick?: () => void;
}

const InvestmentCard: React.FC<InvestmentCardProps> = ({
  id,
  image,
  title,
  price,
  rating = 4.9,
  onShare,
  favoriteType = "booking",
  onClick,
}) => {
  const isRTL = useIsRTL();
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
        (f) => f.favorable_type === favoriteType && String(f.favorable_id) === String(id),
      ),
    [favoritesList, id, favoriteType],
  );

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    const wasFavorite = isFavorite;
    toggleFavorite.mutate(
      { favorable_type: favoriteType, favorable_id: id },
      {
        onSuccess: () => {
          toast.success(
            wasFavorite
              ? t("cards.t_063b91", "تمت الإزالة من المفضلة")
              : t("cards.t_2537ae", "تمت الإضافة للمفضلة"),
          );
        },
        onError: () => toast.error(t("cards.t_c94c75", "حدث خطأ")),
      },
    );
  };

  const handleShare = () => {
    if (onShare) onShare(id);
  };

  return (
    <div
      className="investmentCard bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 max-w-sm cursor-pointer"
      style={{
        direction: isRTL ? "rtl" : "ltr",
      }}
      onClick={onClick}
    >
      {/* Image Section */}
      <div className="relative h-[420px] overflow-hidden">
        <img src={image} alt={title} className="w-full h-full object-cover" />

        {/* Top Left - Rating */}
        <div className="absolute top-4 left-4">
          <div className="bg-white/30 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 ">
            <span className="text-sm font-bold text-white">{rating}</span>
            <IoStar className="text-orange-500 text-sm" />
          </div>
        </div>

        {/* Top Right - Share Icon */}
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            className="w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center text-gray-700 hover:bg-opacity-100 transition-all duration-200"
          >
            <ShareIcon size={14} />
          </button>
          <button
            onClick={handleFavorite}
            className={`w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center transition-all duration-200 ${
              isFavorite ? "text-red-500" : "text-gray-700 hover:text-red-500"
            }`}
            aria-label="favorite"
          >
            <HeartIcon size={14} filled={isFavorite} />
          </button>
        </div>

        {/* Bottom Overlay with Gradient */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent px-4 py-8 flex items-end"
          style={{ height: "90%" }}
        >
          <div className="text-white">
            <h3 className="text-xl font-bold mb-1">{title}</h3>
            <p className="text-sm opacity-90">{price} / الليلة</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentCard;
