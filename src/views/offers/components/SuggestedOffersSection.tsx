"use client";

import React, { useState, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@/lib/router-compat";
import { useIsRTL } from "@hooks";
import OwlCarousel, {
  type OwlCarouselHandle,
} from "@components/DynamicOwlCarousel";
import { type Offer } from "@data/offers";
import OfferCard from "./OfferCard";
import { EmptyState } from "@ui";
import { SectionTitle, Chip, ChipBar } from "./CatalogKit";
import { FiEye, FiStar } from "react-icons/fi";
import { IoLocationOutline } from "react-icons/io5";
import { useWebHome } from "@hooks/api/useMokafaatQueries";
import { mapApiOffersToModels } from "@network/mappers/offersMapper";
import { buildOfferUrl } from "@utils/offerUrl";

const SuggestedOffersSection: React.FC = () => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<
    "nearby" | "most-viewed" | "highest-rated"
  >("most-viewed");
  const [isLoading, setIsLoading] = useState(false);
  const [carouselKey, setCarouselKey] = useState(0);
  const owlCarouselRef = useRef<OwlCarouselHandle | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const { data: webHomeResponse } = useWebHome();

  const apiOffersByType = useMemo(() => {
    if (!webHomeResponse) return { today: [], new: [], best_selling: [] };
    const res = webHomeResponse as Record<string, unknown>;
    const data = res?.data as Record<string, unknown> | undefined;
    const offers = data?.offers as
      | Record<string, Array<Record<string, unknown>>>
      | undefined;
    return {
      today: mapApiOffersToModels(
        Array.isArray(offers?.today) ? offers.today : []
      ),
      new: mapApiOffersToModels(Array.isArray(offers?.new) ? offers.new : []),
      best_selling: mapApiOffersToModels(
        Array.isArray(offers?.best_selling) ? offers.best_selling : []
      ),
    };
  }, [webHomeResponse]);

  const filters = useMemo(
    () =>
      [
        {
          key: "most-viewed" as const,
          labelKey: "offersPage.suggestedOffers.filterMostViewed",
          icon: <FiEye />,
        },
        {
          key: "highest-rated" as const,
          labelKey: "offersPage.suggestedOffers.filterHighestRated",
          icon: <FiStar />,
        },
        {
          key: "nearby" as const,
          labelKey: "offersPage.suggestedOffers.filterNearby",
          icon: <IoLocationOutline />,
        },
      ] as const,
    [],
  );

  const offers = useMemo(() => {
    switch (activeFilter) {
      case "most-viewed":
        return apiOffersByType.best_selling;
      case "highest-rated":
        return apiOffersByType.new;
      case "nearby":
        return userLocation ? apiOffersByType.today : [];
      default:
        return [];
    }
  }, [activeFilter, userLocation, apiOffersByType]);

  // OwlCarousel options
  const owlCarouselOptions = useMemo(
    () => ({
      loop: offers.length > 4, // Only loop if there are more than 4 items
      margin: 10,
      nav: offers.length > 4, // Only show navigation if there are more than 4 items
      dots: false,
      autoplay: offers.length > 4, // Only autoplay if there are more than 4 items
      autoplayTimeout: 5000,
      autoplayHoverPause: true,
      rtl: (isRTL && offers.length < 4) ? "true" : "false",
      responsive: {
        0: {
          items: 1,
        },
        600: {
          items: 2,
        },
        1000: {
          items: 4,
        },
      },
    }),
    [offers.length, isRTL]
  );

  const handleLocationRequest = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          // Fallback to Riyadh coordinates
          setUserLocation({ lat: 24.7136, lng: 46.6753 });
        }
      );
    } else {
      // Fallback to Riyadh coordinates
      setUserLocation({ lat: 24.7136, lng: 46.6753 });
    }
  };

  const handleFilterChange = (
    filterKey: "most-viewed" | "highest-rated" | "nearby"
  ) => {
    setIsLoading(true);
    setActiveFilter(filterKey);
    setCarouselKey((prev) => prev + 1);

    if (filterKey === "nearby" && !userLocation) {
      handleLocationRequest();
    }

    requestAnimationFrame(() => setIsLoading(false));
  };

  const handleOfferClick = (offer: Offer) => {
    navigate(buildOfferUrl(offer));
  };

  // Skeleton component
  const SkeletonCard = () => (
    <div className="bg-white rounded-mk-md shadow-mk-raised overflow-hidden animate-pulse">
      <div className="h-48 bg-mk-border-strong/50"></div>
      <div className="p-4">
        <div className="h-6 bg-mk-border-strong/50 rounded mb-2"></div>
        <div className="h-4 bg-mk-border-strong/50 rounded mb-3 w-3/4"></div>
        <div className="flex gap-1 mb-4">
          <div className="h-6 bg-mk-border-strong/50 rounded-full w-16"></div>
          <div className="h-6 bg-mk-border-strong/50 rounded-full w-20"></div>
        </div>
        <div className="h-4 bg-mk-border-strong/50 rounded mb-4 w-1/2"></div>
        <div className="flex justify-between items-center">
          <div className="h-6 bg-mk-border-strong/50 rounded w-20"></div>
          <div className="h-6 bg-mk-border-strong/50 rounded w-24"></div>
        </div>
      </div>
    </div>
  );

  return (
    <section className="container mx-auto overflow-hidden px-4 py-10">
      <SectionTitle
        title={t("offersPage.suggestedOffers.title")}
        subtitle={t("offersPage.suggestedOffers.subtitle")}
      />

      {/* شرائح الترتيب/التصفية — قابلة للتمرير أفقياً */}
      <ChipBar className="relative z-[1] mb-8" label={t("ui.filters", "الفلاتر")}>
        {filters.map((filter) => (
          <Chip
            key={filter.key}
            active={activeFilter === filter.key}
            onClick={() => handleFilterChange(filter.key)}
            icon={<span aria-hidden>{filter.icon}</span>}
          >
            {t(filter.labelKey)}
          </Chip>
        ))}
      </ChipBar>

      {/* Location Request for Nearby */}
      {activeFilter === "nearby" && !userLocation && (
        <div className="text-center mb-8">
          <div className="mx-auto max-w-md rounded-mk-lg border border-mk-border bg-[linear-gradient(150deg,#F7F5FC,#EFEAF8)] p-6 shadow-mk-card">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#400198,#6703EB)] text-white">
              <IoLocationOutline size={26} aria-hidden />
            </span>
            <h3 className="m-0 mb-2 text-[17px] font-extrabold text-mk-text">
              {t("offersPage.suggestedOffers.locationTitle")}
            </h3>
            <p className="m-0 mb-4 text-[13px] leading-relaxed text-mk-muted">
              {t("offersPage.suggestedOffers.locationDescription")}
            </p>
            <button
              type="button"
              onClick={handleLocationRequest}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[linear-gradient(135deg,#FD671A,#E2560D)] px-6 text-[13.5px] font-extrabold text-white shadow-[0_10px_24px_-10px_rgba(226,86,13,0.9)] transition-transform hover:-translate-y-0.5"
            >
              {t("offersPage.suggestedOffers.shareLocation")}
            </button>
          </div>
        </div>
      )}

      {/* Offers Carousel */}
      <div
        className="relative OffersCarousel PropertiesCarousel"
        style={{
          direction: isRTL && offers.length < 4 ? "rtl" : "ltr",
        }}
      >
        {isLoading ? (
          // Loading skeleton
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-10">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : offers.length > 0 ? (
          // Offers Carousel with key to force re-render
          <OwlCarousel
            key={carouselKey}
            ref={owlCarouselRef}
            className="owl-theme"
            {...owlCarouselOptions}
            style={{
              direction: isRTL && offers.length < 4 ? "rtl" : "ltr",
            }}
          >
            {offers.slice(0, 8).map((offer) => (
              <div
                key={offer.id}
                className="item h-full"
                style={{ direction: isRTL ? "rtl" : "ltr" }}
              >
                <OfferCard offer={offer} onOfferClick={handleOfferClick} />
              </div>
            ))}
          </OwlCarousel>
        ) : (
          <EmptyState
            icon={
              activeFilter === "nearby" ? (
                <IoLocationOutline />
              ) : activeFilter === "most-viewed" ? (
                <FiEye />
              ) : (
                <FiStar />
              )
            }
            title={t("offersPage.suggestedOffers.emptyTitle")}
            description={t("offersPage.suggestedOffers.emptyHint")}
          />
        )}
      </div>

    </section>
  );
};

export default SuggestedOffersSection;
