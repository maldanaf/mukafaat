"use client";

import React, { useMemo } from "react";
import { POINTS_ENABLED } from "@config/features";
import { useParams, Link, useNavigate } from "@/lib/router-compat";
import { Helmet } from "@/lib/helmet-compat";
import { useIsRTL } from "@hooks";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { webApi } from "@network/services/mokafaatService";
import { LoadingSpinner } from "@components/LoadingSpinner";
import { AboutPattern } from "@assets";
import { FiMapPin, FiStar, FiEye, FiMousePointer, FiExternalLink, FiHeart } from "react-icons/fi";
import { MdOutlineFlight } from "react-icons/md";
import { RiHotelLine } from "react-icons/ri";
import { FaCar } from "react-icons/fa";
import CurrencyIcon from "@components/CurrencyIcon";
import { useFavorites, useFavoriteToggle } from "@hooks/api/useMokafaatQueries";
import { useUserStore } from "@stores/userStore";
import { normalizeFavoritesList } from "@utils/favorites";
import { toast } from "react-toastify";

const typeConfig = {
  flight: { icon: MdOutlineFlight, color: "bg-blue-500", label: { ar: "طيران", en: "Flight" } },
  hotel: { icon: RiHotelLine, color: "bg-mk-primary-light", label: { ar: "فندق", en: "Hotel" } },
  car: { icon: FaCar, color: "bg-orange-500", label: { ar: "سيارة", en: "Car" } },
};

export default function BookingDetailPage() {
  const { type, slug } = useParams<{ type: string; slug: string }>();
  const isRTL = useIsRTL();
  const { t: _t, i18n } = useTranslation();
  const langBase = i18n.language?.split("-")[0] || "ar";
  const navigate = useNavigate();
  const isAuthenticated = useUserStore((s) => !!s.token);
  const { data: favoritesData } = useFavorites();
  const toggleFavorite = useFavoriteToggle();
  const favoritesList = useMemo(
    () => normalizeFavoritesList(favoritesData ?? null),
    [favoritesData],
  );

  const { data: rawData, isLoading } = useQuery({
    queryKey: ["mokafaat", "booking-detail", slug, langBase],
    queryFn: () => webApi.bookingDetail(slug!).then((r) => r.data),
    enabled: !!slug,
  });

  const listing = useMemo(() => {
    const root = (rawData as Record<string, unknown>)?.data ?? rawData;
    return (root as Record<string, unknown>)?.listing as Record<string, unknown> | null;
  }, [rawData]);

  const related = useMemo(() => {
    const root = (rawData as Record<string, unknown>)?.data ?? rawData;
    return ((root as Record<string, unknown>)?.related ?? []) as Array<Record<string, unknown>>;
  }, [rawData]);

  const handleBookNow = async () => {
    if (!listing) return;
    try {
      const res = await webApi.bookingClick(Number(listing.id));
      const body = (res.data as Record<string, unknown>)?.data as
        | Record<string, unknown>
        | undefined;
      const url = body?.affiliate_url ?? (listing as Record<string, unknown>).affiliate_url;
      window.open(String(url), "_blank");
    } catch {
      window.open(String(listing.affiliate_url), "_blank");
    }
  };

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

  const tc = typeConfig[(type as keyof typeof typeConfig) || "hotel"];
  const TypeIcon = tc?.icon || RiHotelLine;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{isRTL ? "العرض غير موجود" : "Listing not found"}</h2>
          <Link to="/bookings" className="bg-[#400198] text-white px-6 py-3 rounded-lg">{isRTL ? "العودة للحجوزات" : "Back to Bookings"}</Link>
        </div>
      </div>
    );
  }

  const title = String(listing.title ?? "");
  const description = String(listing.description ?? "");
  const image = String(listing.image ?? "");
  const priceFrom = Number(listing.price_from ?? 0);
  const priceTo = Number(listing.price_to ?? 0);
  const currency = String(listing.price_currency ?? "SAR");
  const provider = listing.provider as Record<string, unknown> | null;
  const providerName = String(provider?.name ?? "");
  const providerLogo = String(provider?.logo ?? "");
  const viewsCount = Number(listing.views_count ?? 0);
  const clicksCount = Number(listing.clicks_count ?? 0);

  // SEO
  const pageTitle = `${title} | ${isRTL ? "مكافآت" : "Mukafaat"}`;
  const pageDescription = description || title;
  const canonicalUrl = `https://mukafaat.com.sa/bookings/${type}/${slug}`;

  // Type-specific info
  const originCity = String(listing.origin_city ?? "");
  const destCity = String(listing.destination_city ?? "");
  const airline = String(listing.airline ?? "");
  const hotelStars = Number(listing.hotel_stars ?? 0);
  const hotelCity = String(listing.hotel_city ?? "");
  const hotelAddress = String(listing.hotel_address ?? "");
  const carType = String(listing.car_type ?? "");
  const carCity = String(listing.car_city ?? "");
  const rentalCompany = String(listing.rental_company ?? "");

  const priceLabel = type === "hotel" ? (isRTL ? "/ ليلة" : "/ night") : type === "car" ? (isRTL ? "/ يوم" : "/ day") : "";

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={image} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Hero */}
      <section className="relative w-full bg-[linear-gradient(150deg,#1B1150_0%,#400198_55%,#6703EB_100%)] overflow-hidden min-h-[180px] flex items-center justify-center">
        <div className="absolute inset-0 bg-primary opacity-30" />
        <div className="relative pt-20 pb-8 px-6 mx-auto max-w-site w-full text-center z-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className={`${tc?.color || "bg-mk-primary-light"} text-white p-2 rounded-full`}>
              <TypeIcon className="w-5 h-5" />
            </span>
            <span className="text-white/80 text-sm">{tc?.label[isRTL ? "ar" : "en"]}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">{title}</h1>
          {/* Breadcrumb */}
          <nav className="flex items-center justify-center gap-1 text-xs text-white/70" aria-label="breadcrumb">
            <Link to="/" className="hover:text-white">{isRTL ? "الرئيسية" : "Home"}</Link>
            <span>|</span>
            <Link to="/bookings" className="hover:text-white">{isRTL ? "الحجوزات" : "Bookings"}</Link>
            <span>|</span>
            <Link to={`/bookings?tab=${type}`} className="hover:text-white">{tc?.label[isRTL ? "ar" : "en"]}</Link>
            <span>|</span>
            <span className="text-[#fd671a]">{title}</span>
          </nav>
        </div>
        <div className="absolute -bottom-10 z-0">
          <img src={AboutPattern} alt="" className="w-full h-96 animate-float" />
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 max-w-site">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* المحتوى الرئيسي */}
          <div className="lg:col-span-2 space-y-6">
            {/* الصورة */}
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img src={image} alt={title} className="w-full h-[400px] object-cover" />
            </div>

            {/* تفاصيل حسب النوع */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{isRTL ? "التفاصيل" : "Details"}</h2>

              {type === "flight" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">{isRTL ? "من" : "From"}</p>
                      <p className="text-lg font-bold text-gray-900">{originCity}</p>
                    </div>
                    <div className="flex-1 flex items-center justify-center px-4">
                      <div className="w-full border-t-2 border-dashed border-blue-300 relative">
                        <MdOutlineFlight className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500 text-xl bg-blue-50 px-1" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">{isRTL ? "إلى" : "To"}</p>
                      <p className="text-lg font-bold text-gray-900">{destCity}</p>
                    </div>
                  </div>
                  {airline && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MdOutlineFlight className="text-blue-500" />
                      <span className="font-medium">{isRTL ? "الناقل:" : "Airline:"}</span>
                      <span>{airline}</span>
                    </div>
                  )}
                </div>
              )}

              {type === "hotel" && (
                <div className="space-y-4">
                  {hotelStars > 0 && (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: hotelStars }).map((_, i) => (
                        <FiStar key={i} className="text-yellow-400 fill-yellow-400 w-5 h-5" />
                      ))}
                      <span className="text-sm text-gray-500 ms-2">{hotelStars} {isRTL ? "نجوم" : "Stars"}</span>
                    </div>
                  )}
                  {hotelCity && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <FiMapPin className="text-mk-primary-light" />
                      <span className="font-medium">{isRTL ? "المدينة:" : "City:"}</span>
                      <span>{hotelCity}</span>
                    </div>
                  )}
                  {hotelAddress && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <FiMapPin className="text-gray-400" />
                      <span className="font-medium">{isRTL ? "العنوان:" : "Address:"}</span>
                      <span>{hotelAddress}</span>
                    </div>
                  )}
                </div>
              )}

              {type === "car" && (
                <div className="space-y-4">
                  {carType && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <FaCar className="text-orange-500" />
                      <span className="font-medium">{isRTL ? "نوع السيارة:" : "Car Type:"}</span>
                      <span>{carType}</span>
                    </div>
                  )}
                  {carCity && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <FiMapPin className="text-orange-500" />
                      <span className="font-medium">{isRTL ? "المدينة:" : "City:"}</span>
                      <span>{carCity}</span>
                    </div>
                  )}
                  {rentalCompany && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <FaCar className="text-gray-400" />
                      <span className="font-medium">{isRTL ? "شركة التأجير:" : "Rental Company:"}</span>
                      <span>{rentalCompany}</span>
                    </div>
                  )}
                </div>
              )}

              {/* الوصف */}
              {description && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold text-gray-800 mb-2">{isRTL ? "الوصف" : "Description"}</h3>
                  <p className="text-gray-600 leading-relaxed">{description}</p>
                </div>
              )}

              {/* الإحصائيات */}
              <div className="mt-6 pt-6 border-t flex items-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-1"><FiEye /> {viewsCount} {isRTL ? "مشاهدة" : "views"}</span>
                <span className="flex items-center gap-1"><FiMousePointer /> {clicksCount} {isRTL ? "حجز" : "bookings"}</span>
              </div>
            </div>
          </div>

          {/* الشريط الجانبي - الأسعار والحجز */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6 space-y-4">
              {/* كارد السعر */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                {/* المزود */}
                {provider && (
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                    {providerLogo && (
                      <img src={providerLogo} alt={providerName} className="w-10 h-10 rounded-lg object-contain bg-gray-50 p-1" />
                    )}
                    <div>
                      <p className="text-xs text-gray-500">{isRTL ? "عبر" : "via"}</p>
                      <p className="font-semibold text-gray-800">{providerName}</p>
                    </div>
                  </div>
                )}

                {/* السعر */}
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-1">{isRTL ? "يبدأ من" : "Starting from"}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#400198]">{priceFrom}</span>
                    <CurrencyIcon size={20} className="text-[#400198]" />
                    {priceLabel && <span className="text-sm text-gray-500">{priceLabel}</span>}
                  </div>
                  {priceTo > priceFrom && (
                    <p className="text-sm text-gray-400 mt-1">
                      {isRTL ? "حتى" : "Up to"} {priceTo} {currency}
                    </p>
                  )}
                </div>

                {/* زر الحجز + المفضلة */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBookNow}
                    className="flex-1 py-3.5 bg-[#400198] text-white rounded-xl font-bold text-lg hover:bg-[#33007a] transition-colors flex items-center justify-center gap-2"
                  >
                    <FiExternalLink />
                    {isRTL ? "احجز الآن" : "Book Now"}
                  </button>
                  <button
                    onClick={(e) => handleFavoriteToggle(e, Number(listing.id))}
                    className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all ${
                      isBookingFavorite(Number(listing.id))
                        ? "border-red-500 text-red-500 bg-red-50"
                        : "border-gray-200 text-gray-600 hover:border-red-500 hover:text-red-500"
                    }`}
                    aria-label="favorite"
                  >
                    <FiHeart className={`text-xl ${isBookingFavorite(Number(listing.id)) ? "fill-current" : ""}`} />
                  </button>
                </div>
                <p className="text-xs text-gray-400 text-center mt-2">
                  {isRTL ? "سيتم توجيهك لموقع المزود لإتمام الحجز" : "You will be redirected to the provider's website"}
                </p>
              </div>

              {/* معلومات إضافية */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-800 mb-3">{isRTL ? "لماذا تحجز عبر مكافآت؟" : "Why book via Mukafaat?"}</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {isRTL ? "أسعار حصرية ومخفضة" : "Exclusive discounted prices"}
                  </li>
                  {/* نظام النقاط مخفي — POINTS_ENABLED */}
                  {POINTS_ENABLED && (
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      {isRTL ? "اكسب نقاط مع كل حجز" : "Earn points with every booking"}
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {isRTL ? "دعم فني على مدار الساعة" : "24/7 customer support"}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {isRTL ? "ضمان أفضل سعر" : "Best price guarantee"}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* عروض مشابهة */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              {isRTL ? "عروض مشابهة" : "Similar Listings"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((item) => {
                const itemId = item.id;
                const itemType = (item.type as string) || type || "hotel";
                const itemSlug = (item.slug as string) || String(itemId);
                const fav = isBookingFavorite(Number(itemId));
                return (
                  <Link
                    to={`/bookings/${itemType}/${itemSlug}`}
                    key={String(itemId)}
                    className="block bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all no-underline text-inherit relative"
                  >
                    <button
                      onClick={(e) => handleFavoriteToggle(e, Number(itemId))}
                      className={`absolute top-2 end-2 z-10 w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow transition-all ${
                        fav ? "text-red-500" : "text-gray-600 hover:text-red-500"
                      }`}
                      aria-label="favorite"
                    >
                      <FiHeart className={`text-sm ${fav ? "fill-current" : ""}`} />
                    </button>
                    <div className="relative h-40 overflow-hidden">
                      <img src={String(item.image ?? "")} alt={String(item.title ?? "")} className="w-full h-full object-cover" />
                      <span className={`absolute top-2 start-2 ${tc?.color} text-white text-xs px-2 py-1 rounded`}>
                        {tc?.label[isRTL ? "ar" : "en"]}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 text-sm mb-2 line-clamp-2">{String(item.title ?? "")}</h3>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[#400198] font-bold">
                          {String(item.price_from ?? "")} <CurrencyIcon size={12} className="inline" />
                        </span>
                        {Boolean((item.provider as Record<string, unknown>)?.logo) && (
                          <img src={String((item.provider as Record<string, unknown>).logo)} alt="" className="h-5 object-contain" />
                        )}
                      </div>
                      <span className="block w-full py-2 bg-[#400198] text-white rounded-lg text-sm font-medium text-center">
                        {isRTL ? "عرض التفاصيل" : "View Details"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
