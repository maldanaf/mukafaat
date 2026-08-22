"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@/lib/router-compat";
import CardsHero from "./components/CardsHero";
import CardsSliderSection from "./components/CardsSliderSection";
import { useIsRTL } from "@hooks";
import { Helmet } from "@/lib/helmet-compat";
import GetStartedSection from "@views/home/components/GetStartedSection";
import { useWebCards } from "@hooks/api/useMokafaatQueries";
import {
  mapApiHomeCardsToOffers,
  type CardOfferWithCompanyId,
} from "@network/mappers/cardsMapper";
import { LoadingSpinner } from "@components/LoadingSpinner";
import { buildWebCardsParams } from "@utils/webFilters";
import { FiFilter } from "react-icons/fi";
import { IoMdClose } from "react-icons/io";
import CategoryCard from "@components/CategoryCard";
import MobileCards from "./mobile/MobileCards";

interface ApiCategory {
  id: number;
  name: string;
  slug?: string;
  image?: string;
}

interface ApiCardCountry {
  id: number;
  name: string;
  code?: string;
  flag?: string;
  flag_url?: string;
}

const CardsPage = () => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [search, setSearch] = useState<string>("");
  const [selectedCountryId, setSelectedCountryId] = useState<number | "all">("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const createDefaultCardsFilters = useCallback(
    () => ({ validityTypes: [] as string[] }),
    [],
  );
  const [draftCardsFilters, setDraftCardsFilters] = useState<{
    validityTypes: string[];
    isRenewable?: boolean;
    priceMin?: number;
    priceMax?: number;
  }>(createDefaultCardsFilters);
  const [appliedCardsFilters, setAppliedCardsFilters] = useState<{
    validityTypes: string[];
    isRenewable?: boolean;
    priceMin?: number;
    priceMax?: number;
  }>(createDefaultCardsFilters);

  const baseParams = useMemo(
    () => ({
      cardCountryId:
        selectedCountryId !== "all" ? Number(selectedCountryId) : undefined,
      validityTypes:
        appliedCardsFilters.validityTypes.length > 0
          ? appliedCardsFilters.validityTypes
          : undefined,
      isRenewable: appliedCardsFilters.isRenewable,
      priceMin: appliedCardsFilters.priceMin,
      priceMax: appliedCardsFilters.priceMax,
      search: search || undefined,
      perPage: 30,
      page: 1,
    }),
    [selectedCountryId, appliedCardsFilters, search],
  );

  const { data: cardsRes, isLoading } = useWebCards(
    buildWebCardsParams(baseParams),
  );

  const extractCardsPayload = useCallback((res: unknown) => {
    const root = (res as Record<string, unknown>) ?? {};
    return (root.data as Record<string, unknown>) ?? root;
  }, []);

  const payload = useMemo(
    () => extractCardsPayload(cardsRes),
    [cardsRes, extractCardsPayload],
  );

  const categories = useMemo((): ApiCategory[] => {
    const arr = payload?.categories as ApiCategory[] | undefined;
    return Array.isArray(arr) ? arr : [];
  }, [payload]);

  const countries = useMemo((): ApiCardCountry[] => {
    const arr = payload?.card_countries as ApiCardCountry[] | undefined;
    return Array.isArray(arr) ? arr : [];
  }, [payload]);

  const categoryItems = useMemo(
    () =>
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        image: c.image,
      })),
    [categories],
  );

  const latestCards = useMemo((): CardOfferWithCompanyId[] => {
    const arr = (payload?.latest_cards ?? payload?.cards) as
      | Array<Record<string, unknown>>
      | undefined;
    return mapApiHomeCardsToOffers(Array.isArray(arr) ? arr : []);
  }, [payload]);

  const recommendedCards = useMemo((): CardOfferWithCompanyId[] => {
    const arr = payload?.recommended_cards as
      | Array<Record<string, unknown>>
      | undefined;
    return mapApiHomeCardsToOffers(Array.isArray(arr) ? arr : []);
  }, [payload]);

  const featuredCards = useMemo((): CardOfferWithCompanyId[] => {
    const arr = payload?.featured_cards as
      | Array<Record<string, unknown>>
      | undefined;
    return mapApiHomeCardsToOffers(Array.isArray(arr) ? arr : []);
  }, [payload]);

  const filteredCards = useMemo((): CardOfferWithCompanyId[] => {
    const arr = payload?.cards as Array<Record<string, unknown>> | undefined;
    return mapApiHomeCardsToOffers(Array.isArray(arr) ? arr : []);
  }, [payload]);

  const hasFilters =
    !!search ||
    selectedCountryId !== "all" ||
    appliedCardsFilters.validityTypes.length > 0 ||
    appliedCardsFilters.isRenewable ||
    appliedCardsFilters.priceMin != null ||
    appliedCardsFilters.priceMax != null;

  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>{t("cardsPage.pageTitle")}</title>
          <link rel="canonical" href="https://mukafaat.com/cards" />
        </Helmet>
        {/* نسخة الموبايل تجلب بياناتها بنفسها */}
        <MobileCards />

        <div className="hidden lg:block">
          <CardsHero />
          <div className="min-h-[40vh] flex items-center justify-center">
            <LoadingSpinner />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t("cardsPage.pageTitle")}</title>
        <link rel="canonical" href="https://mukafaat.com/cards" />
      </Helmet>

      {/* نسخة الموبايل */}
      <MobileCards />

      {/* نسخة الديسكتوب */}
      <div className="hidden lg:block">
      <CardsHero />

      {/* Main Categories — single-row horizontal scroll */}
      {categoryItems.length > 0 && (
        <section className="relative container mx-auto px-4 py-8 z-10">
          <div
            className="w-full max-w-site mx-auto"
            style={{ marginTop: "-80px" }}
          >
            <div
              className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
              style={{
                direction: isRTL ? "rtl" : "ltr",
                scrollSnapType: "x mandatory",
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {categoryItems.map((cat) => {
                const slug =
                  categories.find((c) => c.id === cat.id)?.slug ??
                  String(cat.id);
                return (
                  <Link
                    key={cat.id}
                    to={`/cards/${slug}`}
                    className="flex-shrink-0 w-[150px] md:w-[160px] xl:w-[170px]"
                    style={{ scrollSnapAlign: "start" }}
                  >
                    <CategoryCard
                      icon={cat.image || ""}
                      title={cat.name}
                      alt={cat.name}
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Search + Filter trigger */}
      <section className="container mx-auto px-4 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="w-full md:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("cardsPage.searchPlaceholder")}
              className="w-full px-5 py-3 rounded-full font-medium text-sm shadow-md transition-all duration-300 bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#400198] focus:border-transparent"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setDraftCardsFilters(appliedCardsFilters);
              setIsFilterOpen(true);
            }}
            className="px-5 py-3 rounded-full font-medium text-sm shadow-md transition-all duration-300 bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 inline-flex items-center gap-2"
          >
            <FiFilter size={18} />
            {t("cardsPage.filter")}
          </button>
        </div>

        {/* Country chips */}
        {countries.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCountryId("all")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                selectedCountryId === "all"
                  ? "bg-[#400198] text-white border-[#400198]"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {t("cardsPage.allCountries", "كل الدول")}
            </button>
            {countries.map((c) => {
              const selected = selectedCountryId === c.id;
              const isEmoji = c.flag && c.flag.length <= 4;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCountryId(c.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    selected
                      ? "bg-[#400198] text-white border-[#400198]"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {isEmoji ? (
                    <span className="text-lg leading-none">{c.flag}</span>
                  ) : c.flag_url ? (
                    <img
                      src={c.flag_url}
                      alt={c.name}
                      className="w-5 h-4 object-cover rounded-sm"
                    />
                  ) : null}
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {hasFilters && (
          <div className="text-sm text-gray-600 mt-4">
            <button
              type="button"
              onClick={() => {
                const reset = createDefaultCardsFilters();
                setAppliedCardsFilters(reset);
                setDraftCardsFilters(reset);
                setSearch("");
                setSelectedCountryId("all");
              }}
              className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium hover:bg-red-200 transition-colors"
            >
              {t("cardsPage.clearAll")}
            </button>
          </div>
        )}
      </section>

      {/* Filter Sidebar */}
      {isFilterOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsFilterOpen(false)}
        />
      )}
      <div
        className={`fixed top-0 h-full w-full md:w-1/2 lg:w-1/3 xl:w-1/4 bg-white z-[9999] transition-all duration-300 ease-in-out shadow-2xl ${
          isFilterOpen
            ? isRTL
              ? "right-0 translate-x-0"
              : "left-0 translate-x-0"
            : isRTL
              ? "-right-full translate-x-full"
              : "-left-full -translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between py-4 px-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            {t("cardsPage.filterSidebarTitle")}
          </h2>
          <button
            type="button"
            onClick={() => setIsFilterOpen(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 bg-gray-100 rounded-full p-2"
          >
            <IoMdClose size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pb-24 h-[calc(100vh-160px)]">
          <div className="space-y-6">
            {/* Validity types */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-3">
                {t("cardsPage.validityType")}
              </p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    "daily",
                    "weekly",
                    "monthly",
                    "quarterly",
                    "semi_annual",
                    "annual",
                    "unlimited",
                  ] as const
                ).map((v) => {
                  const selected = draftCardsFilters.validityTypes.includes(v);
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() =>
                        setDraftCardsFilters((p) => ({
                          ...p,
                          validityTypes: selected
                            ? p.validityTypes.filter((x) => x !== v)
                            : [...p.validityTypes, v],
                        }))
                      }
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                        selected
                          ? "bg-purple-100 text-purple-700 border-purple-200"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-5">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <input
                  type="checkbox"
                  checked={Boolean(draftCardsFilters.isRenewable)}
                  onChange={(e) =>
                    setDraftCardsFilters((p) => ({
                      ...p,
                      isRenewable: e.target.checked ? true : undefined,
                    }))
                  }
                />
                {t("cardsPage.renewable")}
              </label>
            </div>

            <div className="border-t border-gray-200 pt-5">
              <p className="text-sm font-semibold text-gray-800 mb-3">
                {t("cardsPage.priceRange")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min={0}
                  value={draftCardsFilters.priceMin ?? ""}
                  onChange={(e) =>
                    setDraftCardsFilters((p) => ({
                      ...p,
                      priceMin:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#400198]/30"
                  placeholder={t("cardsPage.min")}
                />
                <input
                  type="number"
                  min={0}
                  value={draftCardsFilters.priceMax ?? ""}
                  onChange={(e) =>
                    setDraftCardsFilters((p) => ({
                      ...p,
                      priceMax:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#400198]/30"
                  placeholder={t("cardsPage.max")}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 p-6">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                const reset = createDefaultCardsFilters();
                setDraftCardsFilters(reset);
                setAppliedCardsFilters(reset);
                setSearch("");
                setSelectedCountryId("all");
              }}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              {t("cardsPage.reset")}
            </button>
            <button
              type="button"
              onClick={() => {
                setAppliedCardsFilters(draftCardsFilters);
                setIsFilterOpen(false);
              }}
              className="flex-1 px-4 py-2 bg-[#fd671a] text-white rounded-lg font-medium hover:bg-[#e55a17] transition-colors"
            >
              {t("cardsPage.apply")}
            </button>
          </div>
        </div>
      </div>

      {hasFilters ? (
        <CardsSliderSection
          title={t("cardsPage.sections.resultsTitle", "نتائج البحث")}
          subtitle=""
          cards={filteredCards}
          isLoading={isLoading}
          categories={categoryItems}
        />
      ) : (
        <>
          <CardsSliderSection
            title={t("cardsPage.sections.latestTitle")}
            subtitle={t("cardsPage.sections.latestSubtitle")}
            cards={latestCards}
            isLoading={isLoading}
            categories={categoryItems}
          />

          <CardsSliderSection
            title={t("cardsPage.sections.recommendedTitle", "اخترنا لك")}
            subtitle={t("cardsPage.sections.recommendedSubtitle", "بطاقات قد تعجبك")}
            cards={recommendedCards}
            isLoading={isLoading}
            categories={categoryItems}
          />

          <CardsSliderSection
            title={t("cardsPage.sections.featuredTitle", "بطاقات مميزة")}
            subtitle={t("cardsPage.sections.featuredSubtitle", "اختيارنا المميز")}
            cards={featuredCards}
            isLoading={isLoading}
            categories={categoryItems}
          />
        </>
      )}

      <GetStartedSection className="mt-16 mb-28" />
      </div>
    </>
  );
};

export default CardsPage;
