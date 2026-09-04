"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@/lib/router-compat";
import CardsHero from "./components/CardsHero";
import CardsSliderSection from "./components/CardsSliderSection";
import CardOfferCard from "@views/cards/[companyId]/components/OfferCard";
import { useIsRTL } from "@hooks";
import { Helmet } from "@/lib/helmet-compat";
import GetStartedSection from "@views/home/components/GetStartedSection";
import { useWebCards } from "@hooks/api/useMokafaatQueries";
import {
  mapApiHomeCardsToOffers,
  type CardOfferWithCompanyId,
} from "@network/mappers/cardsMapper";
import {
  CONTAINER,
  SkeletonGrid,
  EmptyState,
  ErrorState,
  Button,
  FOCUS,
} from "@ui";
import {
  Chip,
  ChipBar,
  ResultsCount,
  SectionTitle,
  SortSelect,
  TOOLBAR_CARD,
  TOOLBAR_FIELD,
} from "@views/offers/components/CatalogKit";
import { buildWebCardsParams } from "@utils/webFilters";
import { FiFilter, FiSearch } from "react-icons/fi";
import { IoMdClose } from "react-icons/io";
import CategoryCard from "@components/CategoryCard";
import { PinnedChipsBar, pick } from "@ui";
import usePinnedUnderHeader from "@hooks/usePinnedUnderHeader";
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
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("newest");
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
      sortBy: sortBy !== "newest" ? sortBy : undefined,
      perPage: 24,
      page,
    }),
    [selectedCountryId, appliedCardsFilters, search, sortBy, page],
  );

  const {
    data: cardsRes,
    isLoading,
    isError,
    refetch,
  } = useWebCards(buildWebCardsParams(baseParams));

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

  /** رابط صفحة التصنيف — نفس ما يستخدمه صف المربّعات */
  const categoryHref = useCallback(
    (id: number | string) =>
      `/cards/${categories.find((c) => c.id === id)?.slug ?? String(id)}`,
    [categories],
  );

  /** صف التصنيفات يتحوّل لشريط شرائح مثبّت تحت الهيدر عند تجاوزه */
  const categoriesRef = useRef<HTMLElement | null>(null);
  const categoriesPinned = usePinnedUnderHeader(categoriesRef);

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

  const pagination = useMemo(() => {
    const pg = (payload?.pagination as Record<string, unknown> | undefined) ?? {};
    return {
      currentPage: Number(pg.current_page ?? 0) || 0,
      lastPage: Number(pg.last_page ?? 1) || 1,
      total: Number(pg.total ?? 0) || 0,
    };
  }, [payload]);

  /**
   * تراكم نتائج البحث/الفلترة عبر الصفحات — يُصفَّر عند تغيّر أي فلتر
   * فقط، لا عند «عرض المزيد»، تماماً كصفحة العروض.
   */
  const [accumulatedCards, setAccumulatedCards] = useState<CardOfferWithCompanyId[]>([]);
  const filterSignature = useMemo(
    () =>
      JSON.stringify({ search, selectedCountryId, appliedCardsFilters, sortBy }),
    [search, selectedCountryId, appliedCardsFilters, sortBy],
  );
  const prevSigRef = useRef<string>("");
  const lastPageRef = useRef<number>(0);

  useEffect(() => {
    if (prevSigRef.current !== filterSignature) {
      prevSigRef.current = filterSignature;
      lastPageRef.current = 0;
      setAccumulatedCards([]);
      setPage(1);
    }
  }, [filterSignature]);

  useEffect(() => {
    if (!cardsRes) return;
    const responsePage = pagination.currentPage;
    if (responsePage <= lastPageRef.current) return;
    lastPageRef.current = responsePage;
    setAccumulatedCards((prev) =>
      responsePage === 1 ? filteredCards : [...prev, ...filteredCards],
    );
  }, [cardsRes, filteredCards, pagination.currentPage]);

  const hasMore = page < pagination.lastPage;
  const isLoadingMore = page > lastPageRef.current;

  const validityLabel = useCallback(
    (key: string) => t(`cardsPage.validity.${key}`, key),
    [t],
  );

  const hasFilters =
    !!search ||
    selectedCountryId !== "all" ||
    sortBy !== "newest" ||
    appliedCardsFilters.validityTypes.length > 0 ||
    appliedCardsFilters.isRenewable ||
    appliedCardsFilters.priceMin != null ||
    appliedCardsFilters.priceMax != null;

  if (isLoading) {
    return (
      <>
        <Helmet>
          <link rel="canonical" href="https://mukafaat.com.sa/cards" />
        </Helmet>
        {/* نسخة الموبايل تجلب بياناتها بنفسها */}
        <MobileCards />

        <div className="hidden lg:block">
          <CardsHero />
          <div className={`${CONTAINER} py-10`}>
            <SkeletonGrid
              count={8}
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <link rel="canonical" href="https://mukafaat.com.sa/cards" />
      </Helmet>

      {/* نسخة الموبايل */}
      <MobileCards />

      {/* نسخة الديسكتوب */}
      <div className="hidden lg:block">
      <CardsHero />

      {/* Main Categories — single-row horizontal scroll */}
      {categoryItems.length > 0 && (
        <section ref={categoriesRef} className="relative container mx-auto px-4 py-8 z-10">
          <div
            className="w-full max-w-site mx-auto"
            style={{ marginTop: "-40px" }}
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
                return (
                  <Link
                    key={cat.id}
                    to={categoryHref(cat.id)}
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

      <PinnedChipsBar
        pinned={categoriesPinned}
        title={t("cardsPage.categories", "التصنيفات")}
        items={categoryItems.map((cat, i) => ({
          id: cat.id,
          name: cat.name,
          image: cat.image,
          color: pick(i).c,
          href: categoryHref(cat.id),
        }))}
      />

      {/* شريط الأدوات — بحث + ترتيب + فلاتر + عدّاد */}
      <section className="container mx-auto px-4 pb-6">
        <div className={`${TOOLBAR_CARD} flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between`}>
          <ResultsCount
            count={pagination.total}
            label={t("cardsPage.cards_suffix", "بطاقة")}
          />

          <div className="flex flex-wrap items-center gap-2.5">
            <label className="relative flex min-w-[200px] flex-1 items-center lg:max-w-[300px]">
              <FiSearch aria-hidden className="pointer-events-none absolute start-3.5 text-mk-faint" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label={t("cardsPage.searchPlaceholder")}
                placeholder={t("cardsPage.searchPlaceholder")}
                className={`${TOOLBAR_FIELD} w-full ps-10 pe-4`}
              />
            </label>

            {/* الترتيب — من خيارات sort_by المدعومة في /api/web/cards */}
            <SortSelect
              value={sortBy}
              onChange={setSortBy}
              label={t("cardsPage.sortLabel", "الترتيب")}
              options={[
                "newest",
                "best_selling",
                "highest_discount",
                "price_low_high",
                "price_high_low",
                "most_viewed",
              ].map((key) => ({
                value: key,
                label: t(`cardsPage.sort.${key}`, key),
              }))}
            />

            <Button
              variant="outline"
              size="md"
              icon={<FiFilter />}
              onClick={() => {
                setDraftCardsFilters(appliedCardsFilters);
                setIsFilterOpen(true);
              }}
            >
              {t("cardsPage.filter")}
            </Button>
          </div>
        </div>

        {/* شرائح الدول — قابلة للتمرير أفقياً */}
        {countries.length > 0 && (
          <ChipBar className="mt-4" label={t("cardsPage.allCountries", "كل الدول")}>
            <Chip
              active={selectedCountryId === "all"}
              onClick={() => setSelectedCountryId("all")}
            >
              {t("cardsPage.allCountries", "كل الدول")}
            </Chip>
            {countries.map((c) => {
              const isEmoji = c.flag && c.flag.length <= 4;
              return (
                <Chip
                  key={c.id}
                  active={selectedCountryId === c.id}
                  onClick={() => setSelectedCountryId(c.id)}
                  icon={
                    isEmoji ? (
                      <span aria-hidden className="text-lg leading-none">
                        {c.flag}
                      </span>
                    ) : c.flag_url ? (
                      <img
                        src={c.flag_url}
                        alt=""
                        className="h-4 w-5 rounded-sm object-cover"
                      />
                    ) : undefined
                  }
                >
                  {c.name}
                </Chip>
              );
            })}
          </ChipBar>
        )}

        {hasFilters && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                const reset = createDefaultCardsFilters();
                setAppliedCardsFilters(reset);
                setDraftCardsFilters(reset);
                setSearch("");
                setSelectedCountryId("all");
                setSortBy("newest");
              }}
              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-[#FDE9EB] px-4 text-[12.5px] font-bold text-mk-red transition-colors hover:brightness-95 ${FOCUS}`}
            >
              <IoMdClose size={15} aria-hidden />
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
        <div className="flex items-center justify-between py-4 px-6 border-b border-mk-border">
          <h2 className="text-lg font-semibold text-mk-text">
            {t("cardsPage.filterSidebarTitle")}
          </h2>
          <button
            type="button"
            onClick={() => setIsFilterOpen(false)}
            className="text-mk-faint hover:text-mk-muted transition-colors duration-200 bg-mk-tint2 rounded-full p-2"
          >
            <IoMdClose size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pb-24 h-[calc(100vh-160px)]">
          <div className="space-y-6">
            {/* Validity types */}
            <div>
              <p className="text-sm font-semibold text-mk-text mb-3">
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
                      className={`px-3 py-2 rounded-mk-sm text-sm font-medium transition-colors border ${
                        selected
                          ? "bg-mk-tint text-mk-primary border-mk-border-strong"
                          : "bg-white text-mk-text-strong border-mk-border hover:bg-mk-tint3"
                      }`}
                    >
                      {validityLabel(v)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-mk-border pt-5">
              <label className="flex items-center gap-2 text-sm font-medium text-mk-text">
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

            <div className="border-t border-mk-border pt-5">
              <p className="text-sm font-semibold text-mk-text mb-3">
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
                  className="w-full px-4 py-3 rounded-mk-md border border-mk-border focus:outline-none focus:ring-2 focus:ring-[#400198]/30"
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
                  className="w-full px-4 py-3 rounded-mk-md border border-mk-border focus:outline-none focus:ring-2 focus:ring-[#400198]/30"
                  placeholder={t("cardsPage.max")}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-mk-border p-6">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                const reset = createDefaultCardsFilters();
                setDraftCardsFilters(reset);
                setAppliedCardsFilters(reset);
                setSearch("");
                setSelectedCountryId("all");
                setSortBy("newest");
              }}
              className="min-h-[44px] flex-1 rounded-mk-md bg-mk-tint2 px-4 font-bold text-mk-text-strong transition-colors hover:bg-mk-border-strong/60"
            >
              {t("cardsPage.reset")}
            </button>
            <button
              type="button"
              onClick={() => {
                setAppliedCardsFilters(draftCardsFilters);
                setIsFilterOpen(false);
              }}
              className="min-h-[44px] flex-1 rounded-mk-md bg-[linear-gradient(135deg,#FD671A,#E2560D)] px-4 font-bold text-white shadow-[0_10px_24px_-10px_rgba(226,86,13,0.9)] transition-transform hover:-translate-y-0.5"
            >
              {t("cardsPage.apply")}
            </button>
          </div>
        </div>
      </div>

      {isError ? (
        <div className={`${CONTAINER} py-10`}>
          <ErrorState onRetry={() => refetch()} />
        </div>
      ) : hasFilters ? (
        /* نتائج البحث/الفلترة — شبكة بعدّاد وحالة فراغ وزر «عرض المزيد» */
        <section className={`${CONTAINER} py-10`}>
          <SectionTitle
            title={t("cardsPage.sections.resultsTitle", "نتائج البحث")}
            subtitle={
              pagination.total > 0
                ? t("cardsPage.resultsCount", { count: pagination.total })
                : undefined
            }
          />

          {isLoading && accumulatedCards.length === 0 ? (
            <SkeletonGrid
              count={8}
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
            />
          ) : accumulatedCards.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {accumulatedCards.map((card) => (
                  <CardOfferCard
                    key={card.id}
                    offer={card}
                    companyId={card.companyId}
                    categories={categoryItems}
                  />
                ))}
              </div>
              {hasMore && (
                <div className="mt-10 flex justify-center">
                  <Button
                    variant="primary"
                    size="lg"
                    loading={isLoadingMore}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {isLoadingMore
                      ? t("ui.loading", "جارٍ التحميل…")
                      : t("ui.showMore", "عرض المزيد")}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              title={t("cardsPage.noResults", "لا توجد بطاقات مطابقة")}
              description=""
              actionLabel={t("cardsPage.clearAll")}
              onAction={() => {
                const reset = createDefaultCardsFilters();
                setAppliedCardsFilters(reset);
                setDraftCardsFilters(reset);
                setSearch("");
                setSelectedCountryId("all");
                setSortBy("newest");
              }}
            />
          )}
        </section>
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
