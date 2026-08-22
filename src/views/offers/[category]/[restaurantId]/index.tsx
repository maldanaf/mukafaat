"use client";

import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "@/lib/router-compat";
import { Helmet } from "@/lib/helmet-compat";
import { useIsRTL } from "@hooks";
import { FiArrowLeft, FiBookmark, FiEye } from "react-icons/fi";
import {
  getRestaurantById,
  offerCategories,
  type Offer,
  type MenuItem,
  type Restaurant,
} from "@data/offers";
import OfferCard from "./components/OfferCard";
import MenuItemCard from "../../components/MenuItemCard";
import { Pro1, Pro2, Pro3, Pro4, Pro5, Pro6, Pro7, Pro8 } from "@assets";
import { AboutPattern } from "@assets";
import GetStartedSection from "@views/home/components/GetStartedSection";
import { useWebHome, useMerchantDetail } from "@hooks/api/useMokafaatQueries";
import { stripHtml } from "@utils/stripHtml";
import { mapApiOffersToModels } from "@network/mappers/offersMapper";
import { LoadingSpinner } from "@components/LoadingSpinner";

const RestaurantDetailsPage = () => {
  const { category, merchantSlug } = useParams<{
    category: string;
    merchantSlug: string;
  }>();
  const navigate = useNavigate();
  const isRTL = useIsRTL();
  const [activeTab, setActiveTab] = useState<"offers" | "menu">("offers");
  const { data: merchantDetailData, isLoading: merchantLoading } = useMerchantDetail(merchantSlug);

  const restaurant = useMemo<Restaurant | null>(() => {
    if (!merchantDetailData) return null;
    const res = merchantDetailData as Record<string, unknown>;
    const data = (res?.data ?? res) as Record<string, unknown>;
    const m = data?.merchant as Record<string, unknown> | undefined;
    if (!m) return null;

    const merchantName = String(m.name ?? merchantSlug);
    const merchantLogo = m.logo ? String(m.logo) : "Pro1";
    const cat = m.category as Record<string, unknown> | undefined;
    const categoryKey = (category as string) || String(cat?.slug ?? "all");
    const categoryName = String(cat?.name ?? categoryKey);

    // عروض التاجر
    const offersRaw = (m.offers ?? []) as Array<Record<string, unknown>>;
    const offers = mapApiOffersToModels(offersRaw);

    // المنتجات
    const productsRaw = (m.products ?? []) as Array<Record<string, unknown>>;
    const menu = productsRaw.map((p, i) => ({
      id: String(p.id ?? `p-${i}`),
      title: { ar: String(p.name ?? ""), en: String(p.name ?? "") },
      description: { ar: String(p.description ?? ""), en: String(p.description ?? "") },
      image: String(p.image ?? ""),
      price: Number(p.price ?? 0),
      originalPrice: p.old_price ? Number(p.old_price) : undefined,
      features: [] as string[],
      rating: 0, reviewsCount: 0, views: 0, purchases: 0, bookmarks: 0,
      isPopular: false, isNew: false, isBestSeller: false,
      category: categoryKey, companyId: String(m.id ?? merchantSlug),
      maxQuantity: 10, isAvailable: true, preparationTime: "-",
    }));

    return {
      id: String(m.id ?? merchantSlug),
      slug: String(m.slug ?? merchantSlug),
      name: { ar: merchantName, en: merchantName },
      logo: merchantLogo,
      category: { key: categoryKey, ar: categoryName, en: categoryName },
      description: { ar: String(m.description ?? ""), en: String(m.description ?? "") },
      location: { ar: "-", en: "-" },
      distance: "-",
      rating: Number(m.avg_rating ?? 0),
      reviewsCount: Number(m.reviews_count ?? 0),
      views: Number(m.views_count ?? 0),
      saves: Number(m.followers_count ?? 0),
      color: "#400198",
      topColor: "bg-[#400198]",
      offers,
      menu,
      isOpen: Boolean(m.is_open),
      deliveryTime: String(m.delivery_time ?? "-"),
      minimumOrder: Number(m.min_order ?? 0),
      deliveryFee: Number(m.delivery_fee ?? 0),
      whatsapp: m.whatsapp ? String(m.whatsapp) : null,
    } as Restaurant & { whatsapp?: string | null };
  }, [merchantDetailData, merchantSlug, category]);

  const categoryInfo = offerCategories.find((cat) => cat.key === category);

  if (merchantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {isRTL ? "التاجر غير موجود" : "Merchant not found"}
          </h2>
          <button
            onClick={() => navigate("/offers")}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            {isRTL ? "العودة للعروض" : "Back to Offers"}
          </button>
        </div>
      </div>
    );
  }

  // Function to get restaurant image
  const getRestaurantImage = (logoName: string) => {
    // If it's already a URL, return it directly
    if (logoName.startsWith("http")) {
      return logoName;
    }

    // Otherwise, use the local images
    switch (logoName) {
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

  const handleOfferClick = (offer: Offer) => {
    navigate(`/offers/${category}/${merchantSlug}/${offer.slug || offer.id}`);
  };

  const handleMenuItemClick = (menuItem: MenuItem) => {
    navigate(`/offers/${category}/${merchantSlug}/${menuItem.id}`);
  };

  return (
    <>
      <Helmet>
        <title>
          {isRTL ? restaurant.name.ar : restaurant.name.en} -{" "}
          {isRTL ? "العروض" : "Offers"}
        </title>
        <link
          rel="canonical"
          href={`https://mukafaat.com/offers/${category}/${merchantSlug}`}
        />
      </Helmet>

      {/* Header */}
      <section className="relative w-full bg-[#1D0843] overflow-hidden min-h-[200px] flex items-center justify-center">
        <div className="absolute inset-0 bg-primary opacity-30" />
        <div className="relative w-full pt-10 pb-10 px-6 mx-auto max-w-site text-center lg:pt-12 lg:pb-10 lg:px-12 flex flex-col justify-center z-10">
          {/* Back Button */}
          <button
            onClick={() => navigate(`/offers/${category}`)}
            className="mb-5 inline-flex w-fit items-center gap-2 self-start rounded-full border border-white/25 bg-white/10 px-4 py-2 text-white transition-colors hover:bg-white/20"
          >
            <FiArrowLeft className="text-lg rtl:rotate-180" />
            <span className="text-sm">{isRTL ? "العودة" : "Back"}</span>
          </button>

          {/* Restaurant Logo */}
          <div className="w-14 h-14 mx-auto mb-4 rounded-full overflow-hidden">
            <img
              src={getRestaurantImage(restaurant.logo)}
              alt={restaurant.name[isRTL ? "ar" : "en"]}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-2xl font-bold mb-2 tracking-tight leading-none text-white">
            {isRTL ? restaurant.name.ar : restaurant.name.en}
          </h1>

          {/* Description */}
          <p className="text-white/80 text-base mb-4">
            {stripHtml(restaurant.description[isRTL ? "ar" : "en"])}
          </p>

          {/* Status + Delivery Info */}
          <div className="flex items-center justify-center gap-3 text-white/70 mb-4 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${restaurant.isOpen ? "bg-green-500/30 text-green-200" : "bg-red-500/30 text-red-200"}`}>
              {restaurant.isOpen ? (isRTL ? "مفتوح الآن" : "Open Now") : (isRTL ? "مغلق" : "Closed")}
            </span>
            {restaurant.deliveryTime && restaurant.deliveryTime !== "-" && (
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                🚗 {restaurant.deliveryTime} {isRTL ? "دقيقة" : "min"}
              </span>
            )}
            {restaurant.minimumOrder > 0 && (
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                {isRTL ? "حد أدنى" : "Min"}: {restaurant.minimumOrder} {isRTL ? "ر.س" : "SAR"}
              </span>
            )}
            {restaurant.deliveryFee > 0 && (
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                {isRTL ? "توصيل" : "Delivery"}: {restaurant.deliveryFee} {isRTL ? "ر.س" : "SAR"}
              </span>
            )}
            {(restaurant as unknown as Record<string,unknown>).whatsapp && (
              <a
                href={`https://wa.me/${(restaurant as unknown as Record<string,unknown>).whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-green-500/30 text-green-200 rounded-full text-sm hover:bg-green-500/50 transition-colors flex items-center gap-1"
              >
                📱 {isRTL ? "تواصل واتساب" : "WhatsApp"}
              </a>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 text-white/70 mb-4">
            <div className="flex items-center gap-1">
              <span className="text-yellow-400">★</span>
              <span>{restaurant.rating}</span>
              <span>({restaurant.reviewsCount})</span>
            </div>
            <div className="flex items-center gap-1">
              <FiEye />
              <span>{restaurant.views}</span>
            </div>
            <div className="flex items-center gap-1">
              <FiBookmark />
              <span>{restaurant.saves}</span>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center justify-center text-sm md:text-base">
            <Link
              to="/"
              className="text-white hover:text-purple-300 transition-colors cursor-pointer text-xs"
            >
              {isRTL ? "الرئيسية" : "Home"}
            </Link>
            <span className="text-white text-xs mx-2">|</span>
            <Link
              to="/offers"
              className="text-white hover:text-purple-300 transition-colors cursor-pointer text-xs"
            >
              {isRTL ? "العروض" : "Offers"}
            </Link>
            <span className="text-white text-xs mx-2">|</span>
            <Link
              to={`/offers/${category}`}
              className="text-white hover:text-purple-300 transition-colors cursor-pointer text-xs"
            >
              {restaurant?.category?.ar
                || (categoryInfo ? (isRTL ? categoryInfo.ar : categoryInfo.en) : null)
                || category}
            </Link>
            <span className="text-white text-xs mx-2">|</span>
            <span className="text-[#fd671a] font-medium text-xs">
              {isRTL ? restaurant.name.ar : restaurant.name.en}
            </span>
          </div>
        </div>

        {/* Pattern Background */}
        <div className="absolute -bottom-10 transform z-9">
          <img
            src={AboutPattern}
            alt="Pattern"
            className="w-full h-96 animate-float"
          />
        </div>
      </section>

      {/* Special Offers Section */}
      <section className="container mx-auto px-4 pb-16 mt-16 min-h-[50vh] flex flex-col">
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-12 items-start flex-1">
          <div className={`text-start ${isRTL ? "lg:order-1" : "lg:order-1"}`}>
            <h2 className="text-[#400198] text-3xl font-bold mb-3">
              {isRTL ? restaurant.name.ar : restaurant.name.en}
            </h2>
            <p className="text-md text-gray-700 leading-relaxed max-w-xl">
              {stripHtml(restaurant.description[isRTL ? "ar" : "en"])}
            </p>
          </div>
          <div
            className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${isRTL ? "lg:order-1" : "lg:order-2"}`}
          >
            {/* Delivery Time */}
            <div className="text-start flex items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-0 flex-shrink-0">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex flex-col gap-0 min-w-0">
                <h4 className="font-semibold text-gray-800 mb-0 text-[14px]">
                  {isRTL ? "وقت التوصيل" : "Delivery Time"}
                </h4>
                <p className="text-gray-600 font-medium mb-0">
                  {restaurant.deliveryTime}
                </p>
              </div>
            </div>

            {/* Minimum Order */}
            <div className="text-start flex items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center  mb-0 flex-shrink-0">
                <svg
                  className="w-7 h-7 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <div className="flex flex-col gap-0 min-w-0">
                <h4 className="font-semibold text-gray-800 mb-0 text-[14px]">
                  {isRTL ? "الحد الأدنى للطلب" : "Minimum Order"}
                </h4>
                <p className="text-gray-600 font-medium mb-0">
                  {restaurant.minimumOrder} {isRTL ? "ريال" : "SAR"}
                </p>
              </div>
            </div>

            {/* Delivery Fee */}
            <div className="text-start flex items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mb-0 flex-shrink-0">
                <svg
                  className="w-5 h-5 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <div className="flex flex-col gap-0 min-w-0">
                <h4 className="font-semibold text-gray-600 mb-0 text-[14px]">
                  {isRTL ? "رسوم التوصيل" : "Delivery Fee"}
                </h4>
                <p className="text-gray-600 font-medium mb-0">
                  {restaurant.deliveryFee === 0
                    ? isRTL
                      ? "مجاني"
                      : "Free"
                    : `${restaurant.deliveryFee} ${isRTL ? "ريال" : "SAR"}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex border-b border-gray-200">
            <button
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === "offers"
                  ? "text-[#400198] border-b-2 border-[#400198]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("offers")}
            >
              {isRTL ? "العروض" : "Offers"}
            </button>
            <button
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === "menu"
                  ? "text-[#400198] border-b-2 border-[#400198]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("menu")}
            >
              {isRTL ? "المنيو" : "Menu"}
            </button>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === "offers" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {restaurant.offers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onOfferClick={handleOfferClick}
              />
            ))}
          </div>
        )}

        {activeTab === "menu" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {restaurant.menu.length > 0 ? restaurant.menu.map((menuItem) => (
              <div key={menuItem.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                {menuItem.image && (
                  <div className="h-40 overflow-hidden">
                    <img src={menuItem.image} alt={menuItem.title[isRTL ? "ar" : "en"]} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1">{menuItem.title[isRTL ? "ar" : "en"]}</h3>
                  {menuItem.description[isRTL ? "ar" : "en"] && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{menuItem.description[isRTL ? "ar" : "en"]}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-[#400198]">{menuItem.price} <span className="text-xs">{isRTL ? "ر.س" : "SAR"}</span></span>
                    {menuItem.originalPrice && menuItem.originalPrice > menuItem.price && (
                      <span className="text-sm text-gray-400 line-through">{menuItem.originalPrice}</span>
                    )}
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                {isRTL ? "لا توجد منتجات حالياً" : "No products available"}
              </div>
            )}
          </div>
        )}
      </section>

      <GetStartedSection className="mt-16 mb-28" />
    </>
  );
};

export default RestaurantDetailsPage;
