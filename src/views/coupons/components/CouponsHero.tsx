"use client";

import { useTranslation } from "react-i18next";
import { PageHero } from "@ui";

/** ترويسة صفحة الكوبونات — نفس ترويسة الصفحات الداخلية الموحّدة */
const CouponsHero = () => {
  const { t } = useTranslation();

  return (
    <PageHero
      title={t("coupons.title")}
      eyebrow={t("coupons.hero_eyebrow", "انسخ واستخدم فوراً")}
      subtitle={t(
        "coupons.hero_subtitle",
        "أكواد خصم محدّثة يومياً على مئات العلامات التجارية — بنقرة واحدة.",
      )}
      crumbs={[
        { label: t("home.navbar.home"), to: "/" },
        { label: t("coupons.title") },
      ]}
    />
  );
};

export default CouponsHero;
