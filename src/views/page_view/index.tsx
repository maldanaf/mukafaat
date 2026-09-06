"use client";

import React from "react";
import { useParams, Link } from "@/lib/router-compat";
import { Helmet } from "@/lib/helmet-compat";
import { useIsRTL } from "@hooks";
import { useTranslation } from "react-i18next";
import { usePageDetail, useSubscriptionPlans } from "@hooks/api/useMokafaatQueries";
import { LoadingSpinner } from "@components/LoadingSpinner";
import { AboutPattern } from "@assets";
import { FiCheckCircle } from "react-icons/fi";
import CurrencyIcon from "@components/CurrencyIcon";

export default function PageView() {
  const { slug } = useParams<{ slug: string }>();
  const isRTL = useIsRTL();
  const { t, i18n } = useTranslation();
  const langBase = i18n.language?.split("-")[0] || "ar";
  const { data, isLoading } = usePageDetail(slug || "");

  const page = React.useMemo(() => {
    const root = (data as Record<string, unknown>)?.data ?? data;
    const inner = (root as Record<string, unknown>)?.page ?? (root as Record<string, unknown>)?.data ?? root;
    return inner as Record<string, unknown> | null;
  }, [data]);

  const title = (() => {
    if (!page) return "";
    const t = page[`title_${langBase}`] ?? page.title_ar ?? page.title_en ?? page.title;
    return typeof t === "string" ? t : "";
  })();
  const content = (() => {
    if (!page) return "";
    const c = page[`content_${langBase}`] ?? page.content_ar ?? page.content_en ?? page.content;
    return typeof c === "string" ? c : "";
  })();

  const isCompanySubscriptions = slug === "company-subscriptions";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">{t("notFound.t_7299fd", "الصفحة غير موجودة")}</h2>
          <Link to="/" className="bg-[#400198] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#33007a] transition-colors inline-block">
            {t("ui.t_b986d8", "الرئيسية")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>

      {/* Hero */}
      <section className="relative w-full bg-[linear-gradient(150deg,#1B1150_0%,#400198_55%,#6703EB_100%)] overflow-hidden min-h-[180px] flex items-center justify-center">
        <div className="absolute inset-0 bg-primary opacity-30" />
        <div className="relative pt-20 pb-10 px-6 mx-auto max-w-site w-full text-center z-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{title}</h1>
          <nav className="flex items-center justify-center gap-1 text-xs text-white/70">
            <Link to="/" className="hover:text-white">{t("ui.t_b986d8", "الرئيسية")}</Link>
            <span>|</span>
            <span className="text-[#fd671a]">{title}</span>
          </nav>
        </div>
        <div className="absolute -bottom-10 z-0">
          <img src={AboutPattern} alt="" className="w-full h-96 animate-float" />
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-10">
          <article
            className="page-content"
            style={{
              direction: isRTL ? "rtl" : "ltr",
              textAlign: isRTL ? "right" : "left",
            }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>

        {/* Company Subscriptions: show plans */}
        {isCompanySubscriptions && <CompanyPlansSection />}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .page-content h2 {
          color: #400198;
          font-weight: bold;
          margin-top: 1.8rem;
          margin-bottom: 0.8rem;
          font-size: 1.5rem;
          border-bottom: 2px solid #fd671a;
          padding-bottom: 0.5rem;
          display: inline-block;
        }
        .page-content h3 {
          color: #6b2bb8;
          font-weight: bold;
          margin-top: 1.4rem;
          margin-bottom: 0.6rem;
          font-size: 1.2rem;
        }
        .page-content p { color: #4a5568; line-height: 1.9; margin-bottom: 1rem; }
        .page-content ul { padding-${isRTL ? "right" : "left"}: 1.5rem; margin: 1rem 0; list-style: disc; }
        .page-content ol { padding-${isRTL ? "right" : "left"}: 1.5rem; margin: 1rem 0; list-style: decimal; }
        .page-content li { color: #4a5568; margin-bottom: 0.5rem; line-height: 1.8; }
        .page-content strong { color: #1a202c; }
      ` }} />
    </>
  );
}

function CompanyPlansSection() {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const { i18n } = useTranslation();
  const langBase = i18n.language?.split("-")[0] || "ar";
  const { data: plansData, isLoading } = useSubscriptionPlans("company");

  const plans = React.useMemo(() => {
    const root = (plansData as Record<string, unknown>)?.data ?? plansData;
    const list = (root as Record<string, unknown>)?.plans ?? (root as Record<string, unknown>)?.data ?? root;
    return Array.isArray(list) ? (list as Array<Record<string, unknown>>) : [];
  }, [plansData]);

  const getName = (plan: Record<string, unknown>) =>
    (plan[`name_${langBase}`] as string) || (plan.name_ar as string) || (plan.name_en as string) || "";
  const getDesc = (plan: Record<string, unknown>) =>
    (plan[`description_${langBase}`] as string) || (plan.description_ar as string) || (plan.description_en as string) || "";

  const durationLabels: Record<string, { ar: string; en: string }> = {
    monthly: { ar: t("cards.t_564ef2", "شهري"), en: "Monthly" },
    "3_months": { ar: t("pageView.t_492634", "٣ شهور"), en: "3 Months" },
    "6_months": { ar: t("pageView.t_0b0ad4", "٦ شهور"), en: "6 Months" },
    yearly: { ar: t("cards.t_019ca7", "سنوي"), en: "Yearly" },
    "2_years": { ar: t("pageView.t_01c15a", "سنتين"), en: "2 Years" },
  };

  return (
    <div className="mt-10">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[#400198] mb-2">
          {t("pageView.t_bb7ad4", "اختر الباقة المناسبة لشركتك")}
        </h2>
        <p className="text-gray-600">
          {t("pageView.t_326571", "باقات مرنة تناسب كل الأحجام والميزانيات")}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><LoadingSpinner /></div>
      ) : plans.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-2xl">
          {t("pageView.t_14555f", "لا توجد باقات متاحة حالياً. تواصل معنا للحصول على عرض مخصص.")}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan, idx) => {
            const durCode = String(plan.duration || "yearly");
            const dur = durationLabels[durCode] || { ar: durCode, en: durCode };
            const isFeatured = idx === 1 || plan.is_featured;
            return (
              <div
                key={String(plan.id)}
                className={`rounded-2xl border-2 p-6 transition-all hover:shadow-xl ${
                  isFeatured ? "border-[#fd671a] bg-gradient-to-br from-[#fff7f2] to-white shadow-lg scale-105" : "border-gray-200 bg-white"
                }`}
              >
                {Boolean(isFeatured) && (
                  <div className="bg-[#fd671a] text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">
                    {t("pageView.t_55033b", "⭐ الأكثر شعبية")}
                  </div>
                )}
                <h3 className="text-2xl font-bold text-[#400198] mb-2">{getName(plan)}</h3>
                {getDesc(plan) && <p className="text-gray-600 text-sm mb-4">{getDesc(plan)}</p>}

                <div className="mb-4 flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-[#400198]">{Number(plan.price).toLocaleString()}</span>
                  <CurrencyIcon size={20} className="text-[#400198]" />
                  <span className="text-sm text-gray-500">/ {isRTL ? dur.ar : dur.en}</span>
                </div>

                {plan.max_employees ? (
                  <div className="mb-4 text-sm text-gray-600">
                    <FiCheckCircle className="inline text-green-500 me-1" />
                    {isRTL ? `حتى ${plan.max_employees} موظف` : `Up to ${plan.max_employees} employees`}
                  </div>
                ) : null}

                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-start gap-2">
                    <FiCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{t("pageView.t_433312", "وصول لكل العروض الحصرية")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FiCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{t("pageView.t_832c42", "لوحة تحكم لإدارة الموظفين")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FiCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{t("pageView.t_f6a07c", "تقارير وإحصائيات مفصلة")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FiCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{t("pageView.t_1c850b", "دعم مخصص 24/7")}</span>
                  </li>
                </ul>

                <Link
                  to="/contact"
                  className={`block w-full text-center py-3 rounded-xl font-bold transition-colors ${
                    isFeatured ? "bg-[#fd671a] text-white hover:bg-[#e55a15]" : "bg-[#400198] text-white hover:bg-[#33007a]"
                  }`}
                >
                  {t("pageView.t_8e3378", "اطلب هذه الباقة")}
                </Link>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-center mt-8 p-6 bg-gray-50 rounded-2xl">
        <p className="text-gray-700 mb-3">
          {t("pageView.t_9ceea1", "تحتاج لباقة مخصصة لشركتك؟")}
        </p>
        <Link to="/contact" className="inline-block bg-[#400198] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#33007a]">
          {t("faq.t_988638", "تواصل معنا")}
        </Link>
      </div>
    </div>
  );
}
