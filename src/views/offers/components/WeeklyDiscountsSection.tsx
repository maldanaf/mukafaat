"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@/lib/router-compat";
import { useIsRTL } from "@hooks";
import OwlCarousel from "@components/DynamicOwlCarousel";
import { type Offer } from "@data/offers";
import OfferCard from "./OfferCard";
import { SkeletonGrid } from "@ui";
import { SectionTitle } from "./CatalogKit";
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

const WeeklyDiscountsSection: React.FC = () => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const navigate = useNavigate();
  const [carouselKey, setCarouselKey] = useState(0);
  const owlCarouselRef = useRef<OwlCarousel | null>(null);

  // نجلب كمية أكبر ثم نفلتر حسب price === 0 (platformPrice)
  const { data: freeRes, isLoading } = useWebOffers(
    buildWebOffersParams({ sortBy: "latest", perPage: 50 }),
  );

  const freeOffers = useMemo(
    () =>
      mapApiOffersToModels(extractOffersArray(freeRes))
        .filter((o) => Number(o.platformPrice ?? 0) <= 0)
        .slice(0, 8),
    [freeRes],
  );

  const handleOfferClick = (offer: Offer) => {
    navigate(buildOfferUrl(offer));
  };

  useEffect(() => {
    setCarouselKey((prev) => prev + 1);
  }, [isRTL]);

  const carouselOptions = useMemo(
    () => ({
      loop: freeOffers.length > 4,
      margin: 10,
      nav: freeOffers.length > 4,
      dots: false,
      autoplay: freeOffers.length > 4,
      autoplayTimeout: 4000,
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
    [freeOffers.length],
  );

  return (
    <section className="container mx-auto overflow-hidden px-4 py-0">
      <SectionTitle
        title={t("offersPage.freeOffers.title")}
        subtitle={t("offersPage.freeOffers.subtitle")}
      />

      <div
        className="relative OffersCarousel PropertiesCarousel -ms-[15px]"
        style={{
          direction: "ltr",
        }}
      >
        {isLoading ? (
          <SkeletonGrid
            count={4}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
          />
        ) : isRTL && freeOffers.length < 4 ? (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-6"
            style={{ direction: "rtl" }}
          >
            {freeOffers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onOfferClick={handleOfferClick}
              />
            ))}
          </div>
        ) : (
          <OwlCarousel
            key={carouselKey}
            ref={owlCarouselRef}
            className="owl-theme"
            {...carouselOptions}
            style={{ direction: "ltr" }}
          >
            {freeOffers.map((offer) => (
              <div
                key={offer.id}
                className="item h-full"
                style={{ direction: isRTL ? "rtl" : "ltr" }}
              >
                <OfferCard offer={offer} onOfferClick={handleOfferClick} />
              </div>
            ))}
          </OwlCarousel>
        )}
      </div>
    </section>
  );
};

export default WeeklyDiscountsSection;
