"use client";

import React, { useState, useMemo } from "react";
import { Helmet } from "@/lib/helmet-compat";
import { useParams, useNavigate } from "@/lib/router-compat";
import { IoLocationOutline } from "react-icons/io5";
import { BsChevronDown } from "react-icons/bs";
import { HiOutlineHome } from "react-icons/hi";
import { LuCalendarRange } from "react-icons/lu";
import { IoPersonOutline } from "react-icons/io5";
import { LuPhoneCall } from "react-icons/lu";
import { HiOutlineEye } from "react-icons/hi";
import { UnderTitle } from "@assets";
import useIsRTL from "@hooks/useIsRTL";
import { useInquiryModal } from "@context";
import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";
import { GetStartedSection } from "@views/home/components";
import {
  useWebHome,
  useWebNewsDetail,
} from "@hooks/api/useMokafaatQueries";
import { mapApiNewsToModels } from "@network/mappers/newsMapper";

const BlogArticlePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isRTL = useIsRTL();
  const { openModal } = useInquiryModal();
  const { data: webHomeResponse, isLoading: newsLoading } = useWebHome();

  // Fetch individual article detail from API
  const { data: articleDetailResponse, isLoading: detailLoading } =
    useWebNewsDetail(slug);

  const [currentRecentPage, setCurrentRecentPage] = useState(1);

  const newsList = useMemo(() => {
    if (!webHomeResponse) return [];
    const res = webHomeResponse as Record<string, unknown>;
    const data = res?.data as Record<string, unknown> | undefined;
    const news = data?.news as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(news)) return [];
    return mapApiNewsToModels(news);
  }, [webHomeResponse]);

  // Extract article detail from API response
  const articleDetail = useMemo(() => {
    if (!articleDetailResponse) return null;
    const res = articleDetailResponse as Record<string, unknown>;
    const data = res?.data as Record<string, unknown> | undefined;
    // API may return { data: { news: {...} } } or { data: {...} }
    const article = (data?.news ?? data?.article ?? data) as Record<
      string,
      unknown
    > | null;
    return article;
  }, [articleDetailResponse]);

  /**
   * بيانات المقالة من استجابة التفاصيل لا من قائمة الرئيسية.
   *
   * كانت تُلتقط من `useWebHome` بالبحث عن الـ slug، فتحمل ما ترسله
   * الرئيسية فقط: عدّاد مشاهدات صفراً وتصنيفاً ثابتاً وبلا كاتب —
   * ولا تظهر أصلاً إن لم تكن المقالة ضمن ما ترسله الرئيسية.
   */
  const currentArticle = useMemo(() => {
    if (articleDetail) {
      const mapped = mapApiNewsToModels([articleDetail]);
      if (mapped.length) return mapped[0];
    }
    return newsList.find((article) => article.slug === slug);
  }, [articleDetail, newsList, slug]);

  const relatedArticles = useMemo(() => {
    if (!currentArticle) return [];
    return newsList.filter(
      (article) =>
        article.category === currentArticle.category && article.slug !== slug
    );
  }, [currentArticle, slug, newsList]);

  // Get article content from detail API, fallback to description from list
  const articleContent = useMemo(() => {
    if (articleDetail) {
      const content =
        articleDetail.content ??
        articleDetail.body ??
        articleDetail.description ??
        articleDetail.summary;
      if (content && typeof content === "string" && content.length > 0) {
        return content;
      }
    }
    return null;
  }, [articleDetail]);

  // Article image from detail or list
  const articleImage = useMemo(() => {
    if (articleDetail?.image && typeof articleDetail.image === "string") {
      return articleDetail.image;
    }
    return currentArticle?.image;
  }, [articleDetail, currentArticle]);

  // Article title from detail or list
  const articleTitle = useMemo(() => {
    if (articleDetail?.title && typeof articleDetail.title === "string") {
      return articleDetail.title;
    }
    return isRTL ? currentArticle?.title : currentArticle?.titleEn;
  }, [articleDetail, currentArticle, isRTL]);

  // Loading: wait for API before showing 404
  if (newsLoading || detailLoading) {
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center"
        style={{ paddingTop: "72px" }}
      >
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#400198] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">
            {isRTL ? "جاري التحميل..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  // If article not found after load, show 404
  if (!currentArticle && !articleDetail) {
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center"
        style={{ paddingTop: "72px" }}
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#400198] mb-4">
            {isRTL ? "المقال غير موجود" : "Article Not Found"}
          </h1>
          <p className="text-gray-600 mb-6">
            {isRTL
              ? "المقال الذي تبحث عنه غير موجود."
              : "The article you're looking for doesn't exist."}
          </p>
          <button
            onClick={() => navigate("/blogs")}
            className="bg-[#400198] text-white px-6 py-3 rounded-full hover:bg-[#fd671a] transition-colors"
          >
            {isRTL ? "العودة للمدونة" : "Back to Blogs"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {articleTitle || (isRTL ? currentArticle?.title : currentArticle?.titleEn)} -{" "}
          {isRTL ? "مكافآت" : "Mukafaat"}
        </title>
        <meta
          name="description"
          content={
            isRTL
              ? currentArticle?.description
              : currentArticle?.descriptionEn
          }
        />
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
                {isRTL ? "الرئيسية" : "Home"}
              </span>
              <BsChevronDown
                className={`mx-2 transform ${
                  isRTL ? "rotate-90" : "rotate-[270deg]"
                }`}
              />
              <span
                className="cursor-pointer hover:text-[#fd671a] transition-colors"
                onClick={() => navigate("/blogs")}
              >
                {isRTL ? "المدونة والأخبار" : "Blogs & News"}
              </span>
              <BsChevronDown
                className={`mx-2 transform ${
                  isRTL ? "rotate-90" : "rotate-[270deg]"
                }`}
              />
              <span>
                {articleTitle || (isRTL ? currentArticle?.title : currentArticle?.titleEn)}
              </span>
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
              {/* Main Content - Left Column */}
              <div className="w-full lg:w-3/4 space-y-6">
                {/* Article Header */}
                <div className="bg-white rounded-xl p-0">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                      {/* H1 يصدر من الخادم — هذا عنوان مرئي بمستوى H2 */}
                      <h2 className="text-2xl font-bold text-[#400198] mb-2">
                        {articleTitle || (isRTL ? currentArticle?.title : currentArticle?.titleEn)}
                      </h2>
                    </div>
                  </div>
                </div>

                {/* Article Metadata Pills */}
                {currentArticle && (
                  <div className="bg-white rounded-xl p-0">
                    <div className="flex flex-wrap gap-4 mb-4">
                      {/* Date Pill */}
                      <div className="flex items-center shadow-md gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full">
                        <LuCalendarRange className="text-[#fd671a] text-lg" />
                        <span className="text-[#400198] font-medium text-sm">
                          {isRTL ? currentArticle.date : currentArticle.dateEn}
                        </span>
                      </div>

                      {/* Editor Pill */}
                      <div className="flex items-center shadow-md gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full">
                        <IoPersonOutline className="text-[#fd671a] text-lg" />
                        {/* اسم من أضاف المقالة — كان نصّاً ثابتاً «الإدارة» */}
                        <span className="text-[#400198] font-medium text-sm">
                          {currentArticle.author ||
                            (isRTL ? "فريق مكافآت" : "Mukafaat Team")}
                        </span>
                      </div>

                      {/* Views Pill */}
                      <div className="flex items-center shadow-md gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full">
                        <HiOutlineEye className="text-[#fd671a] text-lg" />
                        <span className="text-[#400198] font-medium text-sm">
                          {currentArticle.views}
                        </span>
                      </div>

                      <div className="flex items-center shadow-md gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full ml-auto">
                        <IoLocationOutline className="text-[#fd671a] text-lg" />
                        <span className="text-[#400198] font-medium text-sm">
                          {isRTL
                            ? currentArticle.categoryAr
                            : currentArticle.categoryEn}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Main Article Image */}
                <div className="bg-white rounded-2xl overflow-hidden">
                  <div className="p-0">
                    <img
                      src={articleImage}
                      alt={articleTitle || ""}
                      className="w-full h-80 object-cover rounded-2xl"
                    />
                  </div>
                </div>

                {/* Article Content */}
                <div className="bg-white rounded-xl p-0">
                  <div className="text-start gap-2 mb-3">
                    <span
                      className="text-[#400198] text-md font-semibold uppercase tracking-wider"
                      style={{
                        fontFamily: isRTL
                          ? "Readex Pro, sans-serif"
                          : "Jost, sans-serif",
                      }}
                    >
                      {isRTL ? "محتوى المقال" : "Article Content"}
                    </span>
                    <img
                      src={UnderTitle}
                      alt="underlineDecoration"
                      className="h-1 mt-2"
                    />
                  </div>

                  {articleContent ? (
                    <div
                      className="prose max-w-none text-sm mt-4 text-gray-700 leading-relaxed [&_h3]:text-[#400198] [&_h3]:text-md [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-2 [&_ul]:ml-4 [&_p]:mb-4 [&_img]:rounded-xl [&_img]:my-4"
                      dangerouslySetInnerHTML={{ __html: articleContent }}
                    />
                  ) : (
                    <div className="prose max-w-none text-sm mt-4">
                      <p className="text-gray-700 leading-relaxed mb-4">
                        {isRTL
                          ? currentArticle?.description
                          : currentArticle?.descriptionEn}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar - Right Column */}
              <div className="w-full lg:w-1/4 space-y-6">
                {/* Recent Posts Section */}
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
                      {isRTL ? "المقالات الحديثة" : "Recent Posts"}
                    </span>
                    <img
                      src={UnderTitle}
                      alt="underlineDecoration"
                      className="h-1 mt-2"
                    />
                  </div>

                  {/* Recent Posts List */}
                  <div className="space-y-4">
                    {relatedArticles
                      .slice((currentRecentPage - 1) * 4, currentRecentPage * 4)
                      .map((article) => (
                        <div
                          key={article.id}
                          className="cursor-pointer hover:shadow-md transition-shadow duration-200"
                          onClick={() => navigate(`/blogs/${article.slug}`)}
                        >
                          <div className="bg-white rounded-lg border border-gray-200 p-4">
                            {/* Top Row - Date and Views */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <LuCalendarRange className="text-[#fd671a] text-sm" />
                                <span className="text-gray-700 text-xs font-medium">
                                  {isRTL ? article.date : article.dateEn}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <HiOutlineEye className="text-[#fd671a] text-sm" />
                                <span className="text-gray-700 text-xs font-medium">
                                  {article.views}
                                </span>
                              </div>
                            </div>

                            {/* Category */}
                            <div className="mb-2">
                              <span className="text-[#fd671a] text-xs font-medium">
                                {isRTL
                                  ? article.categoryAr
                                  : article.categoryEn}
                              </span>
                            </div>

                            {/* Title */}
                            <h4 className="text-[#400198] text-sm font-bold leading-tight line-clamp-2">
                              {isRTL ? article.title : article.titleEn}
                            </h4>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Pagination for Recent Posts */}
                  {relatedArticles.length > 4 && (
                    <div className="mt-6">
                      <div className="flex items-center justify-center gap-2">
                        {/* Previous Button */}
                        <button
                          onClick={() =>
                            setCurrentRecentPage((prev) =>
                              Math.max(1, prev - 1)
                            )
                          }
                          disabled={currentRecentPage === 1}
                          className={`w-8 h-8 rounded-full border border-gray-300 transition-colors flex items-center justify-center ${
                            currentRecentPage === 1
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <span className="text-sm font-medium">
                            <MdArrowBackIosNew />
                          </span>
                        </button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                          {Array.from(
                            { length: Math.ceil(relatedArticles.length / 4) },
                            (_, i) => i + 1
                          )
                            .slice(0, 5)
                            .map((page) => (
                              <button
                                key={page}
                                onClick={() => setCurrentRecentPage(page)}
                                className={`w-8 h-8 rounded-full font-medium text-sm flex items-center justify-center transition-colors ${
                                  currentRecentPage === page
                                    ? "bg-[#400198] text-white"
                                    : "text-gray-700 hover:bg-gray-100"
                                }`}
                              >
                                {page}
                              </button>
                            ))}
                          {Math.ceil(relatedArticles.length / 4) > 5 && (
                            <>
                              <span className="text-gray-700 text-sm">...</span>
                              <button
                                onClick={() =>
                                  setCurrentRecentPage(
                                    Math.ceil(relatedArticles.length / 4)
                                  )
                                }
                                className={`w-8 h-8 rounded-full font-medium text-sm flex items-center justify-center transition-colors ${
                                  currentRecentPage ===
                                  Math.ceil(relatedArticles.length / 4)
                                    ? "bg-[#400198] text-white"
                                    : "text-gray-700 hover:bg-gray-100"
                                }`}
                              >
                                {Math.ceil(relatedArticles.length / 4)}
                              </button>
                            </>
                          )}
                        </div>

                        {/* Next Button */}
                        <button
                          onClick={() =>
                            setCurrentRecentPage((prev) =>
                              Math.min(
                                Math.ceil(relatedArticles.length / 4),
                                prev + 1
                              )
                            )
                          }
                          disabled={
                            currentRecentPage ===
                            Math.ceil(relatedArticles.length / 4)
                          }
                          className={`w-8 h-8 rounded-full border border-gray-300 transition-colors flex items-center justify-center ${
                            currentRecentPage ===
                            Math.ceil(relatedArticles.length / 4)
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <span className="text-sm font-medium">
                            <MdArrowForwardIos />
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {/* Categories Section */}
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
                      {isRTL ? "الفئات" : "Categories"}
                    </span>
                    <img
                      src={UnderTitle}
                      alt="underlineDecoration"
                      className="h-1 mt-2"
                    />
                  </div>

                  {/* Categories List */}
                  <div className="space-y-3">
                    {Array.from(
                      new Set(newsList.map((article) => article.category))
                    ).map((category) => (
                      <div
                        key={category}
                        className={`cursor-pointer py-3 px-4 rounded-full border transition-all duration-200 ${
                          category === currentArticle?.category
                            ? "bg-[#400198] text-white border-[#400198]"
                            : "bg-white text-[#4C4C4C] border-gray-200 hover:border-[#400198] hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          // Navigate to blogs page with category filter
                          navigate("/blogs", {
                            state: { selectedCategory: category },
                          });
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">
                            {isRTL
                              ? newsList.find(
                                  (article) => article.category === category
                                )?.categoryAr || category
                              : category}
                          </span>
                          <span className="text-xs opacity-75">
                            {
                              newsList.filter(
                                (article) => article.category === category
                              ).length
                            }{" "}
                            {isRTL ? "مقال" : "articles"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Contact Form */}
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
                      {isRTL
                        ? "تحتاج مساعدة في التوفير؟"
                        : "Need help with savings?"}
                    </span>
                    <img
                      src={UnderTitle}
                      alt="underlineDecoration"
                      className="h-1 mt-2"
                    />
                  </div>
                  {/* Form Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {isRTL ? "الاسم" : "Name"}
                      </label>
                      <input
                        type="text"
                        placeholder={isRTL ? "أدخل الاسم" : "Enter Name"}
                        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#400198] focus:border-transparent ${
                          isRTL ? "text-right" : "text-left"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {isRTL ? "رقم الهاتف" : "Phone Number"}
                      </label>
                      <input
                        type="tel"
                        placeholder={isRTL ? "رقم الهاتف" : "Phone Number"}
                        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#400198] focus:border-transparent ${
                          isRTL ? "text-right" : "text-left"
                        }`}
                      />
                    </div>
                    <button
                      onClick={() =>
                        openModal(
                          isRTL
                            ? "احصل على مساعدة في التوفير"
                            : "Get Savings Help",
                          isRTL
                            ? "املأ النموذج أدناه وسنتصل بك لمناقشة احتياجاتك في التوفير والاستفادة من أفضل العروض."
                            : "Fill out the form below and we'll call you back to discuss your savings needs and how to benefit from the best offers."
                        )
                      }
                      className="bg-[#400198] h-[45px] w-full justify-center hover:scale-105 transition-transform duration-300 text-sm sm:text-md px-8 sm:px-8 lg:px-8 py-2 sm:py-2 font-semibold rounded-full text-white flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <LuPhoneCall className="text-lg" />
                      {isRTL ? "اتصل بي" : "Call me"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="pb-20">
        <GetStartedSection className="mt-0 mb-0" />{" "}
      </div>
    </>
  );
};

export default BlogArticlePage;
