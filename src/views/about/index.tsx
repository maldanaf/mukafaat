"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Helmet } from "@/lib/helmet-compat";
import { useNavigate } from "@/lib/router-compat";
import { HiOutlineHome } from "react-icons/hi";
import { BsChevronDown } from "react-icons/bs";
import { useIsRTL } from "@hooks";
import { GetStartedSection } from "@views/home/components";
import { usePageDetail } from "@hooks/api/useMokafaatQueries";
import { EmptyState } from "@ui";
import { BreadcrumbSchema } from "@components/seo";

/**
 * صفحة «من نحن».
 *
 * كل محتواها يأتي من لوحة التحكم (الصفحات ← من نحن) عبر
 * `GET /api/pages/about-us` — العنوان والنص معاً بلغة المستخدم.
 * لا نص ثابت في الكود ولا في ملفات الترجمة، عدا فتات المسار
 * وقسم تحميل التطبيق المشترك مع بقية الموقع.
 */
const AboutPage: React.FC = () => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const navigate = useNavigate();

  const { data: pageResponse, isLoading } = usePageDetail("about-us");

  const pageData = (pageResponse as Record<string, unknown>)?.data as
    | Record<string, unknown>
    | undefined;
  const page = pageData?.page as
    | { title?: string; content?: string }
    | undefined;

  const title = page?.title ?? "";
  const content = page?.content ?? "";

  return (
    <>
      <Helmet>
        <title>{title || t("home.navbar.about")}</title>
        <link rel="canonical" href="https://mukafaat.com.sa/about" />
        {/* الوصف من محتوى الصفحة نفسه بعد تجريده من الوسوم */}
        <meta
          name="description"
          content={content.replace(/<[^>]*>/g, " ").slice(0, 160).trim()}
        />
        <meta property="og:title" content={title || t("home.navbar.about")} />
      </Helmet>

      <BreadcrumbSchema
        items={[
          { name: t("home.navbar.home", "الرئيسية"), path: "/" },
          { name: title || t("home.navbar.about") },
        ]}
      />

      <div className="min-h-screen bg-gray-50" style={{ paddingTop: "72px" }}>
        <div className="bg-white pb-6">
          <div className="container mx-auto px-4 py-0 lg:px-0">
            {/* فتات المسار */}
            <nav className="mb-4 flex items-center pt-4 text-sm font-medium text-[#141414]">
              <HiOutlineHome className="me-2 text-lg" />
              <button
                type="button"
                onClick={() => navigate("/")}
                className="hover:text-mk-primary"
              >
                {t("home.navbar.home", t("ui.t_b986d8", "الرئيسية"))}
              </button>
              <BsChevronDown
                className={`mx-2 text-xs ${isRTL ? "rotate-90" : "rotate-[270deg]"}`}
              />
              <span className="text-mk-primary">
                {title || t("home.navbar.about")}
              </span>
            </nav>

            {/* عنوان الصفحة من اللوحة */}
            {!isLoading && title && (
              <h1 className="m-0 text-[26px] font-extrabold text-mk-text-strong">
                {title}
              </h1>
            )}
          </div>
        </div>

        {/* محتوى الصفحة من اللوحة */}
        <div className="bg-white py-8">
          <div className="container mx-auto px-4 lg:px-0">
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-4 w-full rounded bg-gray-200" />
                <div className="h-4 w-5/6 rounded bg-gray-200" />
                <div className="h-4 w-2/3 rounded bg-gray-200" />
              </div>
            ) : content ? (
              <div
                className="prose max-w-none text-sm leading-relaxed text-gray-700 [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#400198] [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:text-md [&_h3]:font-semibold [&_h3]:text-[#400198] [&_img]:my-4 [&_img]:rounded-xl [&_p]:mb-3 [&_ul]:ml-4 [&_ul]:list-inside [&_ul]:list-disc [&_ul]:space-y-2"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              // لا محتوى في اللوحة بعد — لا نعرض صفحة فارغة بلا تفسير
              <EmptyState
                title={t("common.noContent", t("ui.t_614dbf", "لا يوجد محتوى"))}
              />
            )}
          </div>
        </div>

        <GetStartedSection className="mb-0 mt-0" />
      </div>
    </>
  );
};

export default AboutPage;
