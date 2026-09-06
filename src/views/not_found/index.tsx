"use client";

import { ChangePageTitle } from "@components";
import { APP_ROUTES } from "@constants";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@hooks";
import { Helmet } from "@/lib/helmet-compat";
import { HiOutlineHome } from "react-icons/hi";
import { BsChevronDown } from "react-icons/bs";
import { UnderTitle } from "@assets";
import { useNavigate } from "@/lib/router-compat";
import GetStartedSection from "@views/home/components/GetStartedSection";

function NotFoundPage() {
  const [t] = useTranslation();
  const isRTL = useIsRTL();
  const navigate = useNavigate();
  ChangePageTitle({ pageTitle: t("404.title") });

  return (
    <>
      <Helmet>
        <title>{t("404.title")}</title>
        <link rel="canonical" href="https://mukafaat.com.sa/404" />
        <meta name="description" content={t("404.description")} />
        <meta property="og:title" content={t("404.title")} />
        <meta property="og:description" content={t("404.description")} />
      </Helmet>

      <div className="min-h-screen bg-gray-50" style={{ paddingTop: "72px" }}>
        <div className="bg-white">
          <div className="container mx-auto px-4 lg:px-0 border-t-1 border-[#E5E5E5] pb-32">
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-[#141414] font-medium mb-4 pt-4">
              <HiOutlineHome className="me-2 text-lg" />
              <span
                className="cursor-pointer hover:text-[#fd671a] transition-colors"
                onClick={() => navigate("/")}
              >
                {t("ui.t_b986d8", "الرئيسية")}
              </span>
              <BsChevronDown
                className={`mx-2 transform ${
                  isRTL ? "rotate-90" : "rotate-[270deg]"
                }`}
              />
              <span>{t("notFound.t_7299fd", "الصفحة غير موجودة")}</span>
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
              {/* Main Content - Left Column */}
              <div className="w-full lg:w-3/4 space-y-6">
                {/* Article Header */}
                <div className="bg-white rounded-xl p-0">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-[#400198] mb-2">
                        {t("notFound.t_7299fd", "الصفحة غير موجودة")}
                      </h1>
                    </div>
                  </div>
                </div>

                {/* 404 Content */}
                <div className="bg-white rounded-xl pb-6">
                  <div className="prose max-w-none text-sm space-y-6">
                    {/* 404 Message */}
                    <div className="text-start pb-12">
                      <div className="mb-8">
                        <h2 className="text-8xl font-bold text-[#400198] mb-4">
                          404
                        </h2>
                        <div className="text-start gap-2 mb-4">
                          <span
                            className="text-[#400198] text-lg font-semibold uppercase tracking-wider"
                            style={{
                              fontFamily: isRTL
                                ? "Readex Pro, sans-serif"
                                : "Jost, sans-serif",
                            }}
                          >
                            {t("notFound.t_89c97e", "عذراً، الصفحة غير موجودة")}
                          </span>
                          <img
                            src={UnderTitle}
                            alt="underlineDecoration"
                            className="h-1 mt-2"
                          />
                        </div>
                        <p className="text-gray-700 leading-relaxed text-lg mb-8">
                          {t("notFound.t_ed2ef4", "الصفحة التي تبحث عنها غير موجودة أو تم نقلها. يرجى التحقق من الرابط أو العودة إلى الصفحة الرئيسية.")}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 justify-start">
                        <button
                          onClick={() => navigate(APP_ROUTES.home)}
                          className="bg-white border-2 border-[#400198] text-[#400198] px-8 py-3 rounded-full font-semibold hover:bg-[#400198] hover:text-white transition-all duration-300"
                        >
                          {t("notFound.t_3fb531", "العودة للرئيسية")}
                        </button>
                        <button
                          onClick={() => window.history.back()}
                          className="bg-white border-2 border-[#fd671a] text-[#fd671a] px-8 py-3 rounded-full font-semibold hover:bg-[#fd671a] hover:text-white transition-all duration-300"
                        >
                          {t("notFound.t_a72d38", "العودة للخلف")}
                        </button>
                      </div>
                    </div>

                    {/* Help Section */}
                    <div className="mt-12">
                      <div className="text-start gap-2 mb-4">
                        <span
                          className="text-[#400198] text-md font-semibold uppercase tracking-wider"
                          style={{
                            fontFamily: isRTL
                              ? "Readex Pro, sans-serif"
                              : "Jost, sans-serif",
                          }}
                        >
                          {t("notFound.t_48b043", "تحتاج مساعدة؟")}
                        </span>
                        <img
                          src={UnderTitle}
                          alt="underlineDecoration"
                          className="h-1 mt-2"
                        />
                      </div>
                      <p className="text-gray-700 leading-relaxed mb-4">
                        {t("notFound.t_ff49ab", "إذا كنت تواجه مشكلة في العثور على ما تبحث عنه، يمكنك:")}
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>
                          {t("notFound.t_7366d4", "استخدام شريط البحث في أعلى الصفحة")}
                        </li>
                        <li>
                          {t("notFound.t_df87a4", "تصفح فئات العروض والبطاقات والكوبونز")}
                        </li>
                        <li>
                          {t("notFound.t_85fc51", "التحقق من الروابط في القائمة الرئيسية")}
                        </li>
                        <li>
                          {t("notFound.t_4c1537", "الاتصال بنا للحصول على المساعدة")}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar - Right Column */}
              <div
                className="w-full lg:w-1/4 space-y-6"
                style={{
                  marginTop: "65px",
                }}
              >
                {/* Quick Links */}
                <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6">
                  <div className="text-start gap-2 mb-4">
                    <span
                      className="text-[#400198] text-md font-semibold uppercase tracking-wider"
                      style={{
                        fontFamily: isRTL
                          ? "Readex Pro, sans-serif"
                          : "Jost, sans-serif",
                      }}
                    >
                      {t("notFound.t_6e58cd", "روابط سريعة")}
                    </span>
                    <img
                      src={UnderTitle}
                      alt="underlineDecoration"
                      className="h-1 mt-2"
                    />
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate("/offers")}
                      className="w-full text-right hover:text-[#400198] transition-colors text-sm"
                    >
                      {t("notFound.t_7a56a6", "العروض")}
                    </button>
                    <button
                      onClick={() => navigate("/cards")}
                      className="w-full text-right hover:text-[#400198] transition-colors text-sm"
                    >
                      {t("cards.t_cd328b", "البطاقات")}
                    </button>
                    <button
                      onClick={() => navigate("/coupons")}
                      className="w-full text-right hover:text-[#400198] transition-colors text-sm"
                    >
                      {t("notFound.t_2164b4", "الكوبونز")}
                    </button>
                    <button
                      onClick={() => navigate("/bookings")}
                      className="w-full text-right hover:text-[#400198] transition-colors text-sm"
                    >
                      {t("notFound.t_fdf32a", "الحجوزات")}
                    </button>
                    <button
                      onClick={() => navigate("/contact")}
                      className="w-full text-right hover:text-[#400198] transition-colors text-sm"
                    >
                      {t("contact.t_c3721b", "اتصل بنا")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="pb-20">
        <GetStartedSection className="mt-0 mb-0" />
      </div>
    </>
  );
}

export default NotFoundPage;
