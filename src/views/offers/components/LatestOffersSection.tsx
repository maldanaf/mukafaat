"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "@/lib/router-compat";
import { useIsRTL } from "@hooks";
import { type Offer } from "@data/offers";
import OfferCard from "./OfferCard";
import { EmptyState } from "@ui";
import { SectionTitle } from "./CatalogKit";
import OwlCarousel from "@components/DynamicOwlCarousel";
import { Pattern } from "@assets";
import { useWebOffers } from "@hooks/api/useMokafaatQueries";
import { mapApiOffersToModels } from "@network/mappers/offersMapper";
import { buildWebOffersParams } from "@utils/webFilters";
import { buildOfferUrl } from "@utils/offerUrl";

function extractOffersArray(res: unknown): Array<Record<string, unknown>> {
  const root = (res as Record<string, unknown>) ?? {};
  const data =
    (root.data as Record<string, unknown>) ?? (root as Record<string, unknown>);
  const offers = (data.offers ?? data.data ?? data) as unknown;
  return Array.isArray(offers)
    ? (offers as Array<Record<string, unknown>>)
    : [];
}

const LatestOffersSection: React.FC = () => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const [carouselKey, setCarouselKey] = useState(0);
  const owlCarouselRef = useRef<OwlCarousel | null>(null);

  const { data: latestRes, isLoading: apiLoading } = useWebOffers(
    buildWebOffersParams({ sortBy: "latest", search: searchQuery || undefined }),
  );

  const offers = useMemo(() => {
    const all = mapApiOffersToModels(extractOffersArray(latestRes));
    return searchQuery ? all : all.slice(0, 8);
  }, [latestRes, searchQuery]);

  // Force re-render when language or direction changes
  useEffect(() => {
    setCarouselKey((prev) => prev + 1);
  }, [isRTL]);

  // OwlCarousel options
  const owlCarouselOptions = useMemo(
    () => ({
      loop: offers.length > 4,
      margin: 10,
      nav: offers.length > 4,
      dots: false,
      autoplay: offers.length > 4,
      autoplayTimeout: 5000,
      autoplayHoverPause: true,
      rtl: false,
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
    [offers.length],
  );

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
    <section className="container relative z-[1] mx-auto overflow-hidden px-4 py-10">
      <div
        className={`absolute -top-20 w-1/2 sm:w-1/1 ${
          isRTL ? "-left-10" : "-right-10"
        } z-0 hidden sm:block`}
        style={{ transform: "rotate(-20deg)" }}
      >
        <img
          src={Pattern}
          alt={t("offersPage.patternAlt")}
          className="h-auto animate-float"
        />
      </div>
      <SectionTitle
        title={
          searchQuery
            ? isRTL
              ? `نتائج البحث عن "${searchQuery}"`
              : `Search results for "${searchQuery}"`
            : t("offersPage.latestOffers.title")
        }
        subtitle={
          searchQuery
            ? isRTL
              ? `${offers.length} نتيجة`
              : `${offers.length} result(s)`
            : t("offersPage.latestOffers.subtitle")
        }
      />

      <div
        className="relative OffersCarousel PropertiesCarousel"
        style={{
          direction: "ltr",
        }}
      >
        {apiLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : searchQuery || (isRTL && offers.length < 4) ? (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            style={{ direction: isRTL ? "rtl" : "ltr" }}
          >
            {offers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onOfferClick={handleOfferClick}
              />
            ))}
          </div>
        ) : (
          offers.length > 0 && (
            <OwlCarousel
              key={carouselKey}
              ref={owlCarouselRef}
              className="owl-theme"
              {...owlCarouselOptions}
              style={{
                direction: "ltr",
              }}
            >
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="item h-full"
                  style={{ direction: isRTL ? "rtl" : "ltr" }}
                >
                  <OfferCard offer={offer} onOfferClick={handleOfferClick} />
                </div>
              ))}
            </OwlCarousel>
          )
        )}
        {!apiLoading && offers.length === 0 && (
          <EmptyState
            title={
              searchQuery
                ? t("ui.empty.search", "لا نتائج لبحثك.")
                : t("offersPage.latestOffers.empty")
            }
            description=""
            actionLabel={searchQuery ? t("offerDetail.back_to_offers", "كل العروض") : undefined}
            actionTo={searchQuery ? "/offers" : undefined}
            compact
          />
        )}
      </div>
    </section>
  );
};

export default LatestOffersSection;
