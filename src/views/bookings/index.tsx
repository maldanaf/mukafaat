"use client";

import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { Helmet } from "@/lib/helmet-compat";
import { useIsRTL } from "@hooks";
import { useTranslation } from "react-i18next";
import { AboutPattern } from "@assets";
import { MdOutlineFlight } from "react-icons/md";
import { RiHotelLine } from "react-icons/ri";
import { FaCar } from "react-icons/fa";
import { FiStar, FiEye, FiMousePointer, FiHeart } from "react-icons/fi";
import GetStartedSection from "@views/home/components/GetStartedSection";
import { useBookings, useFavorites, useFavoriteToggle } from "@hooks/api/useMokafaatQueries";
import { useUserStore } from "@stores/userStore";
import { normalizeFavoritesList } from "@utils/favorites";
import { toast } from "react-toastify";

type BookingType = "flight" | "hotel" | "car";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BookingListing = Record<string, any>;

const BookingsPage: React.FC = () => {
  const isRTL = useIsRTL();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<BookingType>("flight");
  const { data, isLoading, isError } = useBookings();

  const featured = data?.data?.featured || data?.featured || {};
  const listings: BookingListing[] =
    featured[activeTab] || featured[`${activeTab}s`] || [];

  const isAuthenticated = useUserStore((s) => !!s.token);
  const { data: favoritesData } = useFavorites();
  const toggleFavorite = useFavoriteToggle();
  const favoritesList = useMemo(
    () => normalizeFavoritesList(favoritesData ?? null),
    [favoritesData],
  );

  const isBookingFavorite = (id: number | string) =>
    favoritesList.some(
      (f) => f.favorable_type === "booking" && String(f.favorable_id) === String(id),
    );

  const handleFavoriteToggle = (e: React.MouseEvent, id: number | string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    const wasFavorite = isBookingFavorite(id);
    toggleFavorite.mutate(
      { favorable_type: "booking", favorable_id: id },
      {
        onSuccess: () => {
          toast.success(
            wasFavorite
              ? isRTL ? "تمت الإزالة من المفضلة" : "Removed from favorites"
              : isRTL ? "تمت الإضافة للمفضلة" : "Added to favorites",
          );
        },
        onError: () => toast.error(isRTL ? "حدث خطأ" : "Error"),
      },
    );
  };

  const tabs = [
    {
      key: "flight" as BookingType,
      label: { ar: "طيران", en: "Flights" },
      icon: "plane",
    },
    {
      key: "hotel" as BookingType,
      label: { ar: "فنادق", en: "Hotels" },
      icon: "hotel",
    },
    {
      key: "car" as BookingType,
      label: { ar: "سيارات", en: "Cars" },
      icon: "car",
    },
  ];

  const getImageUrl = (listing: BookingListing) => {
    if (listing.image) {
      if (listing.image.startsWith("http")) return listing.image;
      return listing.image;
    }
    return "https://placehold.co/400x300/e2e8f0/64748b?text=No+Image";
  };

  const formatPrice = (listing: BookingListing) => {
    const currency = listing.price_currency || "SAR";
    const priceFrom = listing.price_from;
    if (priceFrom) {
      return `${priceFrom} ${currency}`;
    }
    return "";
  };

  const getDetailPath = (listing: BookingListing) =>
    `/bookings/${listing.type}/${listing.slug || listing.id}`;

  const renderFavoriteBtn = (listing: BookingListing) => {
    const fav = isBookingFavorite(listing.id);
    return (
      <button
        onClick={(e) => handleFavoriteToggle(e, listing.id)}
        className={`absolute top-3 end-3 w-9 h-9 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow transition-all ${
          fav ? "text-red-500" : "text-gray-600 hover:text-red-500"
        }`}
        aria-label="favorite"
      >
        <FiHeart className={`text-base ${fav ? "fill-current" : ""}`} />
      </button>
    );
  };

  const renderFlightCard = (listing: BookingListing) => (
    <Link
      to={getDetailPath(listing)}
      key={listing.id}
      className="block bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group no-underline text-inherit relative"
    >
      {renderFavoriteBtn(listing)}
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={getImageUrl(listing)}
          alt={listing.title || ""}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Views/Clicks Badge */}
        <div className="absolute top-3 left-3 flex gap-2">
          {listing.views_count > 0 && (
            <span className="flex items-center gap-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
              <FiEye className="text-xs" />
              {listing.views_count}
            </span>
          )}
          {listing.clicks_count > 0 && (
            <span className="flex items-center gap-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
              <FiMousePointer className="text-xs" />
              {listing.clicks_count}
            </span>
          )}
        </div>
        {/* Provider Logo */}
        {listing.provider?.logo && (
          <div className="absolute top-3 right-3">
            <img
              src={listing.provider.logo}
              alt={listing.provider.name || ""}
              className="w-10 h-10 rounded-full bg-white p-1 shadow"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-purple-800 mb-2 line-clamp-1">
          {listing.title}
        </h3>

        {/* Airline */}
        {(listing.airline_name || listing.provider?.name) && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <MdOutlineFlight className="text-[#400198]" />
            <span>{listing.airline_name || listing.provider?.name}</span>
          </div>
        )}

        {/* From -> To */}
        {(listing.departure_city || listing.arrival_city) && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <span>{listing.departure_city}</span>
            <span className="text-[#400198]">{isRTL ? "<" : ">"}</span>
            <span>{listing.arrival_city}</span>
          </div>
        )}

        {/* Price */}
        {formatPrice(listing) && (
          <div className="flex items-center gap-1 text-sm mb-3">
            <span className="text-lg font-bold text-purple-600">
              {formatPrice(listing)}
            </span>
          </div>
        )}

        {/* Provider Name */}
        {listing.provider?.name && (
          <div className="flex items-center gap-2 mb-3">
            {listing.provider.logo && (
              <img
                src={listing.provider.logo}
                alt=""
                className="w-5 h-5 rounded-full"
              />
            )}
            <span className="text-xs text-gray-500">
              {listing.provider.name}
            </span>
          </div>
        )}

        <span className="block w-full bg-[#fd671a] text-white py-2.5 rounded-full font-medium text-sm text-center">
          {isRTL ? "عرض التفاصيل" : "View Details"}
        </span>
      </div>
    </Link>
  );

  const renderHotelCard = (listing: BookingListing) => (
    <Link
      to={getDetailPath(listing)}
      key={listing.id}
      className="block bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group no-underline text-inherit relative"
    >
      {renderFavoriteBtn(listing)}
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={getImageUrl(listing)}
          alt={listing.title || ""}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Stars Badge */}
        {listing.stars && (
          <div className="absolute bottom-3 left-3">
            <div className="flex items-center gap-0.5 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
              {Array.from({ length: listing.stars }).map(
                (_: unknown, i: number) => (
                  <FiStar
                    key={i}
                    className="text-yellow-400 text-xs fill-current"
                  />
                )
              )}
            </div>
          </div>
        )}
        {/* Views/Clicks */}
        <div className="absolute top-3 left-3 flex gap-2">
          {listing.views_count > 0 && (
            <span className="flex items-center gap-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
              <FiEye className="text-xs" />
              {listing.views_count}
            </span>
          )}
          {listing.clicks_count > 0 && (
            <span className="flex items-center gap-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
              <FiMousePointer className="text-xs" />
              {listing.clicks_count}
            </span>
          )}
        </div>
        {listing.provider?.logo && (
          <div className="absolute top-3 right-3">
            <img
              src={listing.provider.logo}
              alt={listing.provider.name || ""}
              className="w-10 h-10 rounded-full bg-white p-1 shadow"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-purple-800 mb-2 line-clamp-1">
          {listing.title}
        </h3>

        {/* City */}
        {listing.city && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <span>📍</span>
            <span>{listing.city}</span>
          </div>
        )}

        {/* Price */}
        {formatPrice(listing) && (
          <div className="flex items-center gap-1 text-sm mb-3">
            <span className="text-lg font-bold text-purple-600">
              {formatPrice(listing)}
            </span>
            <span className="text-xs text-gray-500">
              /{isRTL ? "ليلة" : "night"}
            </span>
          </div>
        )}

        {/* Provider */}
        {listing.provider?.name && (
          <div className="flex items-center gap-2 mb-3">
            {listing.provider.logo && (
              <img
                src={listing.provider.logo}
                alt=""
                className="w-5 h-5 rounded-full"
              />
            )}
            <span className="text-xs text-gray-500">
              {listing.provider.name}
            </span>
          </div>
        )}

        <span className="block w-full bg-[#fd671a] text-white py-2.5 rounded-full font-medium text-sm text-center">
          {isRTL ? "عرض التفاصيل" : "View Details"}
        </span>
      </div>
    </Link>
  );

  const renderCarCard = (listing: BookingListing) => (
    <Link
      to={getDetailPath(listing)}
      key={listing.id}
      className="block bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group no-underline text-inherit relative"
    >
      {renderFavoriteBtn(listing)}
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={getImageUrl(listing)}
          alt={listing.title || ""}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          {listing.views_count > 0 && (
            <span className="flex items-center gap-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
              <FiEye className="text-xs" />
              {listing.views_count}
            </span>
          )}
          {listing.clicks_count > 0 && (
            <span className="flex items-center gap-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
              <FiMousePointer className="text-xs" />
              {listing.clicks_count}
            </span>
          )}
        </div>
        {listing.provider?.logo && (
          <div className="absolute top-3 right-3">
            <img
              src={listing.provider.logo}
              alt={listing.provider.name || ""}
              className="w-10 h-10 rounded-full bg-white p-1 shadow"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-purple-800 mb-2 line-clamp-1">
          {listing.title}
        </h3>

        {/* Car Type */}
        {listing.car_type && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <FaCar className="text-[#400198]" />
            <span>{listing.car_type}</span>
          </div>
        )}

        {/* City */}
        {listing.city && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <span>📍</span>
            <span>{listing.city}</span>
          </div>
        )}

        {/* Price */}
        {formatPrice(listing) && (
          <div className="flex items-center gap-1 text-sm mb-3">
            <span className="text-lg font-bold text-purple-600">
              {formatPrice(listing)}
            </span>
            <span className="text-xs text-gray-500">
              /{isRTL ? "يوم" : "day"}
            </span>
          </div>
        )}

        {/* Provider + Rental Company */}
        {listing.provider?.name && (
          <div className="flex items-center gap-2 mb-3">
            {listing.provider.logo && (
              <img
                src={listing.provider.logo}
                alt=""
                className="w-5 h-5 rounded-full"
              />
            )}
            <span className="text-xs text-gray-500">
              {listing.provider.name}
              {listing.rental_company && ` - ${listing.rental_company}`}
            </span>
          </div>
        )}

        <span className="block w-full bg-[#fd671a] text-white py-2.5 rounded-full font-medium text-sm text-center">
          {isRTL ? "عرض التفاصيل" : "View Details"}
        </span>
      </div>
    </Link>
  );

  const renderCard = (listing: BookingListing) => {
    switch (activeTab) {
      case "flight":
        return renderFlightCard(listing);
      case "hotel":
        return renderHotelCard(listing);
      case "car":
        return renderCarCard(listing);
      default:
        return null;
    }
  };

  const renderLoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse"
        >
          <div className="h-48 bg-gray-200" />
          <div className="p-5 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-6 bg-gray-200 rounded w-1/3" />
            <div className="h-10 bg-gray-200 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">
        {activeTab === "flight"
          ? String.fromCodePoint(0x2708, 0xfe0f)
          : activeTab === "hotel"
            ? String.fromCodePoint(0x1f3e8)
            : String.fromCodePoint(0x1f697)}
      </div>
      <h3 className="text-xl font-semibold text-gray-700 mb-2">
        {isRTL ? "لا توجد نتائج" : "No results found"}
      </h3>
      <p className="text-gray-500">
        {isRTL
          ? "لا توجد حجوزات متاحة حاليا في هذا القسم"
          : "No bookings available in this section at the moment"}
      </p>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>
          {isRTL ? "الحجوزات - مكافآت" : "Bookings - Mokafaat"}
        </title>
        <meta
          name="description"
          content={
            isRTL
              ? "احجز رحلاتك وفنادقك وسياراتك بسهولة"
              : "Book your flights, hotels and cars easily"
          }
        />
      </Helmet>

      <section className="min-h-screen bg-gray-50">
        {/* Header */}
        <section className="relative w-full bg-[#1D0843] overflow-hidden min-h-[140px] flex items-center justify-center">
          <div className="absolute inset-0 bg-primary opacity-30" />
          <div className="relative pt-20 pb-16 px-6 mx-auto max-w-site text-center lg:pt-20 lg:pb-16 lg:px-12 flex flex-col justify-center z-10">
            <h1 className="font-semibold mt-8 text-2xl mb-4 tracking-tight leading-none text-white">
              {isRTL ? "الحجوزات" : "Bookings"}
            </h1>

            <div className="flex items-center justify-center text-sm md:text-base mb-8">
              <span className="text-white hover:text-purple-300 transition-colors cursor-pointer text-xs">
                {isRTL ? "الرئيسية" : "Home"}
              </span>
              <span className="text-white text-xs mx-2">|</span>
              <span className="text-[#fd671a] font-medium text-xs">
                {isRTL ? "الحجوزات" : "Bookings"}
              </span>
            </div>
          </div>

          <div className="absolute -bottom-10 transform z-9">
            <img
              src={AboutPattern}
              alt="Pattern"
              className="w-full h-96 animate-float"
            />
          </div>
        </section>

        {/* Tabs Section */}
        <section
          className="relative container mx-auto px-4 py-8 z-10"
          style={{ marginTop: "-80px" }}
        >
          <div className="max-w-lg mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4">
              {tabs.map((tab) => (
                <div
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`bg-white rounded-xl py-8 px-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group ${
                    activeTab === tab.key
                      ? "border-2 border-[#400198]"
                      : "border-2 border-transparent"
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={`w-14 h-14 mb-4 flex items-center justify-center rounded-full group-hover:from-purple-100 group-hover:to-purple-200 transition-all duration-300 ${
                        activeTab === tab.key
                          ? "bg-[#440798c9] text-white"
                          : "bg-gradient-to-br from-purple-50 to-purple-100 text-[#440798c9]"
                      }`}
                    >
                      {tab.icon === "plane" && (
                        <MdOutlineFlight className="text-2xl" />
                      )}
                      {tab.icon === "hotel" && (
                        <RiHotelLine className="text-2xl" />
                      )}
                      {tab.icon === "car" && <FaCar className="text-2xl" />}
                    </div>
                    <h3
                      className={`text-base font-semibold ${
                        activeTab === tab.key
                          ? "text-[#400198]"
                          : "text-gray-800"
                      }`}
                    >
                      {isRTL ? tab.label.ar : tab.label.en}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section className="pb-8 px-4">
          <div className="max-w-site mx-auto">
            {/* Section Title */}
            <div className="flex items-center gap-3 mb-6">
              {activeTab === "flight" && (
                <MdOutlineFlight className="text-[#400198] text-2xl" />
              )}
              {activeTab === "hotel" && (
                <RiHotelLine className="text-[#400198] text-2xl" />
              )}
              {activeTab === "car" && (
                <FaCar className="text-[#400198] text-2xl" />
              )}
              <h2 className="text-[#400198] text-2xl font-bold">
                {activeTab === "flight"
                  ? isRTL
                    ? "رحلات الطيران"
                    : "Flights"
                  : activeTab === "hotel"
                    ? isRTL
                      ? "الفنادق"
                      : "Hotels"
                    : isRTL
                      ? "السيارات"
                      : "Cars"}
              </h2>
              {!isLoading && listings.length > 0 && (
                <span className="text-sm text-gray-500">
                  ({listings.length}{" "}
                  {isRTL ? "نتيجة" : listings.length === 1 ? "result" : "results"}
                  )
                </span>
              )}
            </div>

            {/* Content */}
            {isLoading ? (
              renderLoadingSkeleton()
            ) : isError ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">
                  {String.fromCodePoint(0x26a0, 0xfe0f)}
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {isRTL ? "حدث خطأ" : "Something went wrong"}
                </h3>
                <p className="text-gray-500">
                  {isRTL
                    ? "يرجى المحاولة مرة أخرى لاحقا"
                    : "Please try again later"}
                </p>
              </div>
            ) : listings.length === 0 ? (
              renderEmptyState()
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {listings.map((listing: BookingListing) => renderCard(listing))}
              </div>
            )}
          </div>
        </section>
      </section>
      <GetStartedSection className="mt-16 mb-28" />
    </>
  );
};

export default BookingsPage;
