"use client";

import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { IoIosArrowRoundForward } from "react-icons/io";
import { useIsRTL } from "@hooks";
import { useNavigate } from "@/lib/router-compat";
import { useWebHome } from "@hooks/api/useMokafaatQueries";
import { mapApiCardsToModels } from "@network/mappers/cardsMapper";

interface CardTile {
  id: number;
  image: string;
  title: string;
  price?: string;
  category?: string;
  slug?: string;
  merchantSlug?: string;
}

const CardsSections = () => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const navigate = useNavigate();

  const { data: webHomeResponse } = useWebHome();

  const apiCards = useMemo(() => {
    if (!webHomeResponse) return [];
    const res = webHomeResponse as Record<string, unknown>;
    const data = res?.data as Record<string, unknown> | undefined;
    const cards = data?.cards as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(cards)) return [];
    return cards;
  }, [webHomeResponse]);

  const cardsImages = useMemo(() => {
    return mapApiCardsToModels(apiCards) as CardTile[];
  }, [apiCards]);

  const cardsDisplay = useMemo(() => {
    const placeholder: CardTile = {
      id: 0,
      image: "https://via.placeholder.com/300x200?text=Card",
      title: "بطاقة",
      price: "0.00",
      category: "",
    };
    const padded = [...cardsImages];
    while (padded.length < 8) {
      padded.push({ ...placeholder, id: padded.length + 1 });
    }
    return padded.slice(0, 8);
  }, [cardsImages]);

  const handleCardClick = (card: CardTile) => {
    if (card.merchantSlug && card.slug) {
      navigate(`/cards/${card.merchantSlug}/${card.slug}`);
    } else if (card.merchantSlug) {
      navigate(`/cards/${card.merchantSlug}`);
    } else {
      navigate("/cards");
    }
  };

  const renderCard = (card: CardTile, heightClass: string) => (
    <div
      onClick={() => handleCardClick(card)}
      className={`${heightClass} relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 ease-out group cursor-pointer`}
    >
      <img
        src={card.image}
        alt={card.title}
        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
      />
      {/* Permanent bottom gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />
      {/* Title */}
      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 pointer-events-none">
        <h3
          className="text-white font-bold text-sm md:text-base lg:text-lg leading-tight drop-shadow-lg line-clamp-2"
          style={{
            fontFamily: isRTL
              ? "Readex Pro, sans-serif"
              : "Jost, sans-serif",
            textShadow: "0 2px 6px rgba(0,0,0,0.6)",
          }}
        >
          {card.title}
        </h3>
        {card.price && Number(card.price) > 0 && (
          <div className="mt-1 flex items-center gap-1">
            <span className="text-[#fd671a] font-bold text-sm md:text-base">
              {Number(card.price).toFixed(2)}
            </span>
            <span className="text-white/80 text-xs">
              {isRTL ? "ر.س" : "SAR"}
            </span>
          </div>
        )}
      </div>
      {/* Extra hover overlay */}
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );

  return (
    <section className="py-16" style={{ backgroundColor: "#F7F8FB" }}>
      <div className="">
        {/* Header Section */}
        <div className="space-y-6 container mx-auto mb-6 px-4 flex-mobile">
          <div className="flex justify-between items-center">
            <div className="space-y-6">
              <div className="text-start mb-0">
                <h2 className="text-[#400198] text-3xl font-bold">
                  {t("home.cards.title")}
                </h2>
                <p className="text-md text-gray-700 leading-relaxed">
                  {t("home.cards.description")}
                </p>
              </div>
            </div>

            <div className="pt-0">
              <button
                onClick={() => navigate("/cards")}
                className="bg-[#400198] lg:mx-auto hover:scale-105 transition-transform duration-300 text-sm sm:text-md px-8 sm:px-8 lg:px-8 py-2 sm:py-2 font-semibold rounded-full text-white !flex items-center gap-2 whitespace-nowrap"
                style={{
                  marginTop: "0px",
                  fontFamily: isRTL
                    ? "Readex Pro, sans-serif"
                    : "Jost, sans-serif",
                }}
              >
                <span>{t("home.cards.viewAll")}</span>
                <IoIosArrowRoundForward
                  className={`text-3xl transform ${
                    isRTL ? "rotate-45" : "-rotate-45"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Gallery Grid — موبايل: شبكة منتظمة بارتفاع موحّد */}
        <div className="container mx-auto px-4 lg:hidden">
          <div className="grid grid-cols-2 gap-4">
            {cardsDisplay.slice(0, 4).map((card) => (
              <div key={card.id}>{renderCard(card, "aspect-[4/5]")}</div>
            ))}
          </div>
        </div>

        {/* Gallery Grid — ديسكتوب: شبكة bento (كما هي) */}
        <div className="container mx-auto px-4 hidden lg:block">
          <div className="flex gap-4 max-w-full overflow-hidden">
            {/* Group 1 */}
            <div className="w-full lg:w-1/2">
              <div
                className="grid grid-cols-3 gap-4"
                style={{ gridTemplateRows: "auto auto" }}
              >
                <div className="col-span-2 flex gap-4">
                  <div className="w-1/2">{renderCard(cardsDisplay[0], "h-220")}</div>
                  <div className="w-1/2">{renderCard(cardsDisplay[1], "h-220")}</div>
                </div>
                <div className="col-span-2">{renderCard(cardsDisplay[2], "h-220")}</div>
                <div className="col-span-1">{renderCard(cardsDisplay[3], "h-456")}</div>
              </div>
            </div>

            {/* Group 2 */}
            <div className="hidden lg:block w-1/2">
              <div
                className="grid grid-cols-3 gap-4"
                style={{ gridTemplateRows: "auto auto" }}
              >
                <div className="col-span-2 flex gap-4">
                  <div className="w-1/2">{renderCard(cardsDisplay[4], "h-220")}</div>
                  <div className="w-1/2">{renderCard(cardsDisplay[5], "h-220")}</div>
                </div>
                <div className="col-span-2">{renderCard(cardsDisplay[6], "h-220")}</div>
                <div className="col-span-1">{renderCard(cardsDisplay[7], "h-456")}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CardsSections;
