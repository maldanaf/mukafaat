"use client";

import { useMemo, useState } from "react";
import { useParams, useNavigate } from "@/lib/router-compat";
import { Helmet } from "@/lib/helmet-compat";
import { useIsRTL } from "@hooks";
import { FiArrowLeft } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import GetStartedSection from "@views/home/components/GetStartedSection";
import OfferCard from "./components/OfferCard";
import CategoryCard from "@components/CategoryCard";
import { useWebCategoryCards } from "@hooks/api/useMokafaatQueries";
import {
  mapApiHomeCardsToOffers,
  type CardOfferWithCompanyId,
} from "@network/mappers/cardsMapper";
import { LoadingSpinner } from "@components/LoadingSpinner";

interface ApiCategory {
  id: number;
  name: string;
  slug?: string;
  image?: string;
  parent_id?: number | null;
}

interface ApiCardCountry {
  id: number;
  name: string;
  code?: string;
  flag?: string;
  flag_url?: string;
}

const CategoryCardsPage = () => {
  const { merchantSlug } = useParams<{ merchantSlug: string }>();
  const navigate = useNavigate();
  const isRTL = useIsRTL();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [selectedSubId, setSelectedSubId] = useState<number | "all">("all");
  const [selectedCountryId, setSelectedCountryId] =
    useState<number | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);

  const params = useMemo(
    () => ({
      subcategory_id: selectedSubId !== "all" ? selectedSubId : undefined,
      card_country_id:
        selectedCountryId !== "all" ? selectedCountryId : undefined,
      search: search.trim() || undefined,
      per_page: 30,
      page: currentPage,
    }),
    [selectedSubId, selectedCountryId, search, currentPage],
  );

  const { data: response, isLoading } = useWebCategoryCards(
    merchantSlug ?? "",
    params,
  );

  const data = useMemo(() => {
    const res = response as Record<string, unknown> | undefined;
    return (res?.data as Record<string, unknown>) ?? null;
  }, [response]);

  const category = useMemo((): ApiCategory | null => {
    const c = data?.category as ApiCategory | undefined;
    return c ?? null;
  }, [data]);

  const subcategories = useMemo((): ApiCategory[] => {
    const arr = data?.subcategories as ApiCategory[] | undefined;
    return Array.isArray(arr) ? arr : [];
  }, [data]);

  const countries = useMemo((): ApiCardCountry[] => {
    const arr = data?.card_countries as ApiCardCountry[] | undefined;
    return Array.isArray(arr) ? arr : [];
  }, [data]);

  const cards = useMemo((): CardOfferWithCompanyId[] => {
    const arr = data?.cards as Array<Record<string, unknown>> | undefined;
    return mapApiHomeCardsToOffers(Array.isArray(arr) ? arr : []);
  }, [data]);

  const pagination = useMemo(() => {
    const p = data?.pagination as Record<string, number> | undefined;
    return {
      currentPage: Number(p?.current_page ?? 1),
      lastPage: Number(p?.last_page ?? 1),
      total: Number(p?.total ?? 0),
    };
  }, [data]);

  const filteredCards = useMemo(() => {
    if (!search.trim()) return cards;
    const q = search.toLowerCase();
    return cards.filter(
      (o) =>
        (o.title?.ar ?? "").toLowerCase().includes(q) ||
        (o.title?.en ?? "").toLowerCase().includes(q),
    );
  }, [cards, search]);

  if (isLoading && !category) {
    return (
      <>
        <Helmet>
          <title>{isRTL ? "البطاقات" : "Cards"}</title>
        </Helmet>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </>
    );
  }

  if (!merchantSlug || (!isLoading && !category)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {isRTL ? "التصنيف غير موجود" : "Category not found"}
          </h2>
          <button
            onClick={() => navigate("/cards")}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            {isRTL ? "العودة للبطاقات" : "Back to Cards"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {category?.name} - {isRTL ? "البطاقات" : "Cards"}
        </title>
        <link
          rel="canonical"
          href={`https://mukafaat.com/cards/${merchantSlug}`}
        />
      </Helmet>

      {/* Header */}
      <section className="relative w-full bg-[#1D0843] overflow-hidden min-h-[200px] flex items-center justify-center">
        {category?.image ? (
          <div className="absolute inset-0">
            <img
              src={category.image}
              alt=""
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-[#1D0843]/80" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-primary opacity-30" />
        )}
        <div className="relative pt-24 pb-10 px-6 mx-auto max-w-screen-xl text-center lg:pt-24 lg:pb-10 lg:px-12 flex flex-col justify-center z-10">
          <button
            onClick={() => navigate("/cards")}
            className={`absolute top-4 ${isRTL ? "right-4" : "left-4"} text-white hover:text-purple-300 transition-colors flex items-center gap-2`}
          >
            <FiArrowLeft className={`text-xl ${isRTL ? "rotate-180" : ""}`} />
            <span className="text-sm">{isRTL ? "العودة" : "Back"}</span>
          </button>

          <h1 className="text-white text-3xl md:text-4xl font-bold mb-2">
            {category?.name}
          </h1>
          <p className="text-white/80 text-sm">
            {pagination.total}{" "}
            {isRTL ? "بطاقة متاحة" : "cards available"}
          </p>
        </div>
      </section>

      {/* Subcategories — same design as main categories on the index page */}
      {subcategories.length > 0 && (
        <section className="relative container mx-auto px-4 py-8 z-10">
          <div
            className="w-full max-w-6xl mx-auto"
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
              {/* "All" tile */}
              <button
                type="button"
                onClick={() => {
                  setSelectedSubId("all");
                  setCurrentPage(1);
                }}
                className="flex-shrink-0 w-[150px] md:w-[160px] xl:w-[170px] text-start"
                style={{ scrollSnapAlign: "start" }}
              >
                <CategoryCard
                  icon={category?.image || ""}
                  title={isRTL ? "الكل" : "All"}
                  alt={isRTL ? "الكل" : "All"}
                  selected={selectedSubId === "all"}
                />
              </button>

              {subcategories.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => {
                    setSelectedSubId(sub.id);
                    setCurrentPage(1);
                  }}
                  className="flex-shrink-0 w-[150px] md:w-[160px] xl:w-[170px] text-start"
                  style={{ scrollSnapAlign: "start" }}
                >
                  <CategoryCard
                    icon={sub.image || category?.image || ""}
                    title={sub.name}
                    alt={sub.name}
                    selected={selectedSubId === sub.id}
                  />
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Country flags strip */}
      {countries.length > 0 && (
        <section className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedCountryId("all");
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                selectedCountryId === "all"
                  ? "bg-[#400198] text-white border-[#400198]"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {isRTL ? "كل الدول" : "All countries"}
            </button>
            {countries.map((c) => {
              const selected = selectedCountryId === c.id;
              const isEmoji = c.flag && c.flag.length <= 4;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedCountryId(c.id);
                    setCurrentPage(1);
                  }}
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
        </section>
      )}

      {/* Search */}
      <section className="container mx-auto px-4 pb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("cardsPage.searchPlaceholder")}
          className="w-full md:w-96 px-5 py-3 rounded-full font-medium text-sm shadow-md transition-all duration-300 bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#400198] focus:border-transparent"
        />
      </section>

      {/* Cards grid */}
      <section className="container mx-auto px-4 pb-10">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner />
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {isRTL
              ? "لا توجد بطاقات متاحة حالياً"
              : "No cards available at the moment"}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredCards.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                companyId={offer.companyId}
                categories={subcategories.map((s) => ({
                  id: s.id,
                  name: s.name,
                  image: s.image,
                }))}
              />
            ))}
          </div>
        )}

        {/* Simple pagination */}
        {pagination.lastPage > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRTL ? "السابق" : "Previous"}
            </button>
            <span className="text-sm text-gray-700">
              {currentPage} / {pagination.lastPage}
            </span>
            <button
              type="button"
              disabled={currentPage >= pagination.lastPage}
              onClick={() =>
                setCurrentPage((p) => Math.min(pagination.lastPage, p + 1))
              }
              className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRTL ? "التالي" : "Next"}
            </button>
          </div>
        )}
      </section>

      <GetStartedSection className="mt-16 mb-28" />
    </>
  );
};

export default CategoryCardsPage;
