"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import OwlCarousel, {
  type OwlCarouselHandle,
} from "@components/DynamicOwlCarousel";
import { useIsRTL } from "@hooks";
import { Pattern } from "@assets";
import OfferCard from "@views/cards/[companyId]/components/OfferCard";
import type { CardOfferWithCompanyId } from "@network/mappers/cardsMapper";
import { SectionTitle } from "@views/offers/components/CatalogKit";

interface CategoryItem {
  id: number;
  name: string;
  image?: string;
}

interface CardsSliderSectionProps {
  title: string;
  subtitle: string;
  cards: CardOfferWithCompanyId[];
  isLoading?: boolean;
  categories?: CategoryItem[];
}

const SkeletonCard = () => (
  <div className="bg-white rounded-mk-md shadow-mk-raised overflow-hidden animate-pulse">
    <div className="h-48 bg-mk-border-strong/50" />
    <div className="p-4">
      <div className="h-6 bg-mk-border-strong/50 rounded mb-2" />
      <div className="h-4 bg-mk-border-strong/50 rounded mb-3 w-3/4" />
      <div className="flex gap-1 mb-4">
        <div className="h-6 bg-mk-border-strong/50 rounded-full w-16" />
        <div className="h-6 bg-mk-border-strong/50 rounded-full w-20" />
      </div>
      <div className="h-4 bg-mk-border-strong/50 rounded mb-4 w-1/2" />
      <div className="flex justify-between items-center">
        <div className="h-6 bg-mk-border-strong/50 rounded w-20" />
        <div className="h-6 bg-mk-border-strong/50 rounded w-24" />
      </div>
    </div>
  </div>
);

const CardsSliderSection: React.FC<CardsSliderSectionProps> = ({
  title,
  subtitle,
  cards,
  isLoading = false,
  categories,
}) => {
  const isRTL = useIsRTL();
  const [carouselKey, setCarouselKey] = useState(0);
  const owlCarouselRef = useRef<OwlCarouselHandle | null>(null);

  useEffect(() => {
    setCarouselKey((prev) => prev + 1);
  }, [isRTL]);

  const owlCarouselOptions = useMemo(
    () => ({
      loop: cards.length > 5,
      margin: 10,
      nav: cards.length > 5,
      dots: false,
      autoplay: cards.length > 5,
      autoplayTimeout: 5000,
      autoplayHoverPause: true,
      rtl: isRTL && cards.length < 5 ? "true" : "false",
      responsive: {
        0: { items: 1 },
        600: { items: 2 },
        900: { items: 3 },
        1280: { items: 5 },
      },
    }),
    [cards.length, isRTL],
  );

  return (
    <section className="container relative z-[1] mx-auto overflow-hidden px-4 py-10">
      <div
        className={`absolute -top-20 w-1/2 sm:w-1/1 ${
          isRTL ? "-left-10" : "-right-10"
        } z-0 hidden sm:block`}
        style={{ transform: "rotate(-20deg)" }}
      >
        <img src={Pattern} alt="" className="h-auto animate-float" />
      </div>
      <SectionTitle title={title} subtitle={subtitle} />

      <div
        className="relative OffersCarousel PropertiesCarousel"
        style={{
          direction: isRTL && cards.length < 4 ? "rtl" : "ltr",
        }}
      >
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : (
          cards.length > 0 && (
            <OwlCarousel
              key={carouselKey}
              ref={owlCarouselRef}
              className="owl-theme"
              {...owlCarouselOptions}
              style={{
                direction: isRTL && cards.length < 4 ? "rtl" : "ltr",
              }}
            >
              {cards.map((offer) => (
                <div
                  key={offer.id}
                  className="item h-full"
                  style={{ direction: isRTL ? "rtl" : "ltr" }}
                >
                  <OfferCard
                    offer={offer}
                    companyId={offer.companyId}
                    categories={categories}
                  />
                </div>
              ))}
            </OwlCarousel>
          )
        )}
        {!isLoading && cards.length === 0 && (
          <div className="text-center py-12 text-mk-muted">
            {isRTL ? "لا توجد بطاقات متاحة حالياً" : "No cards available at the moment"}
          </div>
        )}
      </div>
    </section>
  );
};

export default CardsSliderSection;
