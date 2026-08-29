"use client";

import { useTranslation } from "react-i18next";
import { PageHero } from "@ui";

/** ترويسة صفحة البطاقات — نفس ترويسة الصفحات الداخلية الموحّدة */
const CardsHero = () => {
  const { t } = useTranslation();
  const title = t("home.navbar.cards", "البطاقات");

  return (
    <PageHero
      title={title}
      eyebrow={t("cardsPage.heroEyebrow", "اشترِ مرة، وفّر طوال العام")}
      subtitle={t(
        "cardsPage.heroSubtitle",
        "بطاقات خصم من أفضل المتاجر — خصومات متجدّدة بسعر واحد.",
      )}
      crumbs={[{ label: t("home.navbar.home", "الرئيسية"), to: "/" }, { label: title }]}
    />
  );
};

export default CardsHero;
