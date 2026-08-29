"use client";

import React from "react";
import { useIsRTL } from "@hooks";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@/lib/router-compat";
import { useSiteSettings } from "@hooks/api/useMokafaatQueries";
import {
  FaCalendarAlt,
  FaPercent,
  FaCreditCard,
  FaTicketAlt,
} from "react-icons/fa";
import {
  WorldwidePropertiesplaneVector,
  NewOffers,
  PatternNewProperty,
} from "@assets";

interface CardItem {
  id: number;
  name: string;
  icon: React.ReactNode;
  title: string;
  path: string;
}

const PopularCountries: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = useIsRTL();
  const navigate = useNavigate();
  const { data: settingsData } = useSiteSettings();
  const langBase = i18n.language?.split("-")[0] || "ar";

  // Read section texts from /api/web/settings (supports 4 languages: ar/en/ur/hi)
  // Response shape: { data: { settings: { home: {...}, home_new_title_ar: "...", ... } } }
  const root = settingsData as Record<string, unknown> | undefined;
  const settings = (
    (root?.data as Record<string, unknown>)?.settings ??
    (root?.settings as Record<string, unknown>) ??
    root
  ) as Record<string, unknown> | undefined;
  const homeSection = (settings?.home ?? {}) as Record<string, string>;

  const getSetting = (baseKey: string, fallback: string): string => {
    // Try language-specific flat key (e.g. home_new_title_ar)
    const flatKey = `${baseKey}_${langBase}`;
    const flat = settings?.[flatKey];
    if (typeof flat === "string" && flat.trim()) return flat;
    // Try nested "home" object (already localized by server)
    const nestedKey = baseKey.replace(/^home_/, "");
    const nested = homeSection[nestedKey];
    if (typeof nested === "string" && nested.trim()) return nested;
    return fallback;
  };

  const sectionTitle = getSetting("home_new_title", t("home.popularCountries.title"));
  const sectionDescription = getSetting("home_new_description", t("popularCountries.description"));

  const newCards: CardItem[] = [
    {
      id: 1,
      name: "bookings",
      icon: <FaCalendarAlt className="text-4xl text-mk-primary" />,
      title: t("home.serviceCards.bookings.title"),
      path: "/bookings",
    },
    {
      id: 2,
      name: "discounts",
      icon: <FaPercent className="text-4xl text-orange-600" />,
      title: t("home.serviceCards.discounts.title"),
      path: "/offers",
    },
    {
      id: 3,
      name: "cards",
      icon: <FaCreditCard className="text-4xl text-blue-600" />,
      title: t("home.serviceCards.cards.title"),
      path: "/cards",
    },
    {
      id: 4,
      name: "coupons",
      icon: <FaTicketAlt className="text-4xl text-green-600" />,
      title: t("home.serviceCards.coupons.title"),
      path: "/coupons",
    },
  ];

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  return (
    <section className="pt-0 pb-10 relative overflow-hidden">
      <div
        className={`absolute -top-40 w-1/1 sm:w-1/1 ${
          isRTL ? "left-0" : "right-0"
        } z-10 hidden sm:block`}
      >
        <img
          src={PatternNewProperty}
          alt="offers"
          className="h-auto animate-float"
        />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        {/* <div
          className={`mobile-animation absolute bottom-44  transform ${
            isRTL ? "left-[12%]" : "right-[10%]"
          } z-10`}
        >
          <img
            src={OurAppPattern}
            alt="App Pattern"
            className="w-48 h-auto animate-float"
          />
        </div> */}
        <div className="flex  gap-12 items-center">
          {/* Left Section - Content */}
          <div
            className={`relative space-y-4 w-full lg:w-2/3 lg:pe-20 ${
              isRTL ? "lg:order-1" : "lg:order-2"
            }`}
          >
            {/* Header */}
            <div className="text-start mb-4">
              {/* <div className="text-start gap-2 mb-3">
                <span
                  className="text-[#fd671a] text-md font-semibold uppercase tracking-wider"
                  style={{
                    fontFamily: isRTL
                      ? "Readex Pro, sans-serif"
                      : "Jost, sans-serif",
                  }}
                >
                  {t("popularCountries.subtitle")}
                </span>
                <img
                  src={UnderTitle}
                  alt="underlineDecoration"
                  className="h-1 mt-2"
                />
              </div> */}
              <h2
                className="text-[#400198] text-3xl font-bold"
                style={{
                  fontFamily: isRTL
                    ? "Readex Pro, sans-serif"
                    : "Jost, sans-serif",
                }}
              >
                {sectionTitle}
              </h2>
            </div>

            {/* Description */}
            <p
              className="text-md text-gray-700 leading-relaxed"
              style={{
                fontFamily: isRTL
                  ? "Readex Pro, sans-serif"
                  : "Jost, sans-serif",
              }}
            >
              {sectionDescription}
            </p>

            {/* البطاقات الأربع (الحجوزات، العروض، البطاقات، الكوبونز) */}
            <div className="grid grid-cols-2 lg:flex lg:gap-6 gap-4 overflow-x-auto lg:overflow-visible py-8 relative z-10">
              {newCards.map((card) => (
                <div
                  key={card.id}
                  className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 w-full lg:w-[180px] h-[160px] lg:flex-shrink-0 cursor-pointer group relative overflow-hidden"
                  style={{
                    boxShadow:
                      "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  }}
                  onClick={() => handleCardClick(card.path)}
                >
                  {/* Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-mk-tint3 via-white to-orange-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  {/* Card Content */}
                  <div className="flex flex-col items-center h-full relative z-10">
                    {/* Card Icon Container */}
                    <div className="mb-4 flex-1 flex items-center justify-center relative">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-mk-tint to-orange-100 flex items-center justify-center group-hover:from-mk-border-strong group-hover:to-orange-200 transition-all duration-500 shadow-lg">
                        <div className="group-hover:scale-110 transition-transform duration-500">
                          {card.icon}
                        </div>
                      </div>
                      <div className="absolute -top-2 -right-2 w-4 h-4 bg-mk-primary-soft rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100 animate-pulse"></div>
                      <div className="absolute -bottom-1 -left-2 w-3 h-3 bg-orange-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 delay-200 animate-pulse"></div>
                    </div>

                    <h3
                      className="text-base font-bold text-gray-800 text-center leading-tight group-hover:text-mk-primary transition-colors duration-300"
                      style={{
                        fontFamily: isRTL
                          ? "Readex Pro, sans-serif"
                          : "Jost, sans-serif",
                      }}
                    >
                      {card.title}
                    </h3>

                    <div className="w-8 h-1 bg-gradient-to-r from-mk-primary-soft to-orange-400 rounded-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>

                  <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-mk-border-strong transition-colors duration-500"></div>
                </div>
              ))}
            </div>
            <div
              className={`absolute bottom-20 w-[30%] sm:w-[30%] ${
                isRTL ? "left-0" : "right-0"
              } z-0 hidden sm:block`}
            >
              <img
                src={WorldwidePropertiesplaneVector}
                alt={t("worldwideProperties.planeVector")}
                className="h-auto animate-float"
              />
            </div>
          </div>

          {/* Right Section - Image Collage */}
          <div
            className={`relative hidden lg:block w-1/3 ${
              isRTL ? "lg:order-1" : "lg:order-2"
            }`}
          >
            {/* Top Image */}
            <div className={`relative mb-8`}>
              <img
                src={NewOffers}
                alt={t("popularCountries.modernCity")}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
      {/* <div
        className={`absolute -top-40  w-1/1 sm:w-1/1 ${
          isRTL ? "left-0" : "right-0"
        } z-0 hidden sm:block`}
      >
        <img
          src={PatternNewProperty}
          alt={t("worldwideProperties.appPattern")}
          className="h-auto animate-float"
        />
      </div> */}
    </section>
  );
};

export default PopularCountries;
