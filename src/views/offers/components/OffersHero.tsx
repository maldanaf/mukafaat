"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { PageHero } from "@ui";

/** ترويسة صفحة العروض — نفس ترويسة الصفحات الداخلية الموحّدة */
const OffersHero: React.FC = () => {
  const { t } = useTranslation();

  return (
    <PageHero
      title={t("offersPage.pageTitle")}
      eyebrow={t("offersPage.heroEyebrow", "وفّر أكثر")}
      subtitle={t(
        "offersPage.heroSubtitle",
        "آلاف العروض والخصومات من متاجرك المفضّلة — تصفّح، قارن، واشترِ في دقائق.",
      )}
      crumbs={[
        { label: t("home.navbar.home"), to: "/" },
        { label: t("offersPage.pageTitle") },
      ]}
    />
  );
};

export default OffersHero;
