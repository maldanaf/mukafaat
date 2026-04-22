"use client";

import { Helmet } from "@/lib/helmet-compat";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "@/lib/router-compat";
import OffersHero from "./components/OffersHero";
import CategorySection from "./components/CategorySection";
import LatestOffersSection from "./components/LatestOffersSection";
import WeeklyDiscountsSection from "./components/WeeklyDiscountsSection";
import PaidOffersSection from "./components/PaidOffersSection";
import SuggestedOffersSection from "./components/SuggestedOffersSection";
import GetStartedSection from "@views/home/components/GetStartedSection";

const OffersPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const isSearching = searchQuery.trim().length > 0;

  return (
    <>
      <Helmet>
        <title>{t("offersPage.pageTitle")}</title>
        <link rel="canonical" href="https://mukafaat.com/offers" />
      </Helmet>

      <OffersHero />

      {!isSearching && <CategorySection />}

      <LatestOffersSection />

      {!isSearching && (
        <>
          <WeeklyDiscountsSection />
          <PaidOffersSection />
          <SuggestedOffersSection />
        </>
      )}

      <GetStartedSection className="mt-16 mb-28" />
    </>
  );
};

export default OffersPage;
