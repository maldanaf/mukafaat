"use client";

import React, { useState, useMemo } from "react";
import { useIsRTL } from "@hooks";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@/lib/router-compat";
import { PatternNewProperty } from "@assets";
import OwlCarousel from "@components/DynamicOwlCarousel";
import { IoIosArrowRoundForward } from "react-icons/io";
import InvestmentCard from "./InvestmentCard";
import { bookingProperties, type BookingProperty } from "./bookingData";
import { useShareSheetStore } from "@stores/shareSheetStore";
import { useBookings } from "@hooks/api/useMokafaatQueries";

const Boking: React.FC = () => {
  const isRTL = useIsRTL();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const openShare = useShareSheetStore((s) => s.openShare);
  const { data: bookingsData } = useBookings();

  // تحويل بيانات API لنفس شكل bookingProperties
  const apiProperties = useMemo<(BookingProperty & { slug?: string; type?: string })[]>(() => {
    const root = (bookingsData as Record<string, unknown>)?.data ?? bookingsData;
    const featured = (root as Record<string, unknown>)?.featured as Record<string, unknown[]> | undefined;
    if (!featured) return [];

    const categoryMap: Record<string, "cars" | "hotels" | "flights"> = {
      flight: "flights", hotel: "hotels", car: "cars",
    };

    const all: (BookingProperty & { slug?: string; type?: string })[] = [];
    for (const [apiType, items] of Object.entries(featured)) {
      const cat = categoryMap[apiType] || "hotels";
      for (const item of items as Array<Record<string, unknown>>) {
        all.push({
          id: Number(item.id),
          image: String(item.image ?? ""),
          title: String(item.title ?? ""),
          price: `${item.price_from} ${isRTL ? "ريال" : "SAR"}`,
          category: cat,
          rating: 4.8,
          location: apiType === "flight"
            ? `${item.origin_city ?? ""} - ${item.destination_city ?? ""}`
            : String(item.hotel_city ?? item.car_city ?? ""),
          feature: apiType === "flight"
            ? String(item.airline ?? "")
            : apiType === "hotel"
              ? `${item.hotel_stars ?? 5} ${isRTL ? "نجوم" : "Stars"}`
              : String(item.car_type ?? ""),
          slug: String(item.slug ?? item.id),
          type: apiType,
        });
      }
    }
    return all;
  }, [bookingsData, isRTL]);

  // استخدم API data لو موجودة، وإلا static
  const properties = apiProperties.length > 0 ? apiProperties : bookingProperties;

  // Filter options
  const filters = [
    { key: "all", label: t("home.bookings.filters.all"), count: properties.length },
    { key: "cars", label: t("home.bookings.filters.cars"), count: properties.filter((item) => item.category === "cars").length },
    { key: "hotels", label: t("home.bookings.filters.hotels"), count: properties.filter((item) => item.category === "hotels").length },
    { key: "flights", label: t("home.bookings.filters.flights"), count: properties.filter((item) => item.category === "flights").length },
  ];

  const filteredProperties = useMemo(() => {
    if (activeFilter === "all") return properties;
    return properties.filter((property) => property.category === activeFilter);
  }, [activeFilter, properties]);

  const owlCarouselOptions = {
    loop: filteredProperties.length > 1,
    margin: 24,
    nav: filteredProperties.length > 1,
    dots: false,
    autoplay: filteredProperties.length > 1,
    autoplayTimeout: 5000,
    autoplayHoverPause: true,
    rtl: false,
    responsive: {
      0: { items: 1, margin: 16 },
      600: { items: 2, margin: 20 },
      1000: { items: 4, margin: 24 },
    },
  };

  const handleShare = (id: number) => {
    const item = properties.find((x) => x.id === id);
    const title = item?.title ?? (isRTL ? "الحجوزات" : "Bookings");
    const url = `${window.location.origin}/bookings`;
    openShare({ title, url });
  };

  const getDetailPath = (item: BookingProperty & { slug?: string; type?: string }) => {
    const typeMap: Record<string, string> = { flights: "flight", hotels: "hotel", cars: "car" };
    const t = item.type || typeMap[item.category] || "hotel";
    return `/bookings/${t}/${item.slug || item.id}`;
  };

  return (
    <section className="pb-16 pt-20 lg:pb-20 relative overflow-hidden">
      <div className="container mx-auto relative px-4 z-10">
        <div className={`space-y-6`}>
          {/* Header */}
          <div className="text-start mb-4">
            <h2 className="text-[#400198] text-3xl font-bold">
              {t("home.bookings.title")}
            </h2>
            <p className="text-md text-gray-700 leading-relaxed">
              {t("home.bookings.description")}
            </p>
          </div>
        </div>
        <div className="block lg:flex gap-12 justify-between items-end">
          <div className="flex justify-start mb-0 gap-3 relative z-10">
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`px-5 py-3 rounded-full font-medium text-sm shadow-md transition-all duration-300 ${
                  activeFilter === filter.key
                    ? "bg-[#400198] text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
                style={{ fontFamily: isRTL ? "Readex Pro, sans-serif" : "Jost, sans-serif" }}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>

          {/* CTA Button */}
          <div className="pt-0">
            <button
              onClick={() => navigate("/bookings")}
              className="bg-[#400198] lg:mx-auto hover:scale-105 transition-transform duration-300 text-sm sm:text-md px-8 sm:px-8 lg:px-8 py-2 sm:py-2 font-semibold rounded-full text-white !flex items-center gap-2 whitespace-nowrap"
              style={{ marginTop: "0px", fontFamily: isRTL ? "Readex Pro, sans-serif" : "Jost, sans-serif" }}
            >
              <span>{t("home.bookings.viewAll")}</span>
              <IoIosArrowRoundForward className={`text-3xl transform ${isRTL ? "rotate-45" : "-rotate-45"}`} />
            </button>
          </div>
        </div>

        {/* Booking Properties Carousel */}
        <div className="mt-0 InvestmentCarousel">
          <OwlCarousel
            key={activeFilter}
            className="owl-theme"
            {...owlCarouselOptions}
            style={{ direction: "ltr" }}
          >
            {filteredProperties.map((property) => (
              <div key={property.id} className="item">
                <InvestmentCard
                  {...property}
                  onShare={handleShare}
                  onClick={() => navigate(getDetailPath(property as BookingProperty & { slug?: string; type?: string }))}
                />
              </div>
            ))}
          </OwlCarousel>
        </div>
      </div>

      <div className={`absolute -top-40 w-1/1 sm:w-1/1 ${isRTL ? "left-0" : "right-0"} z-0 hidden sm:block`}>
        <img src={PatternNewProperty} alt={t("worldwideProperties.appPattern")} className="h-auto animate-float" />
      </div>
    </section>
  );
};

export default Boking;
