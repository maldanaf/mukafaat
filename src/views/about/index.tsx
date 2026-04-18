"use client";

import // AboutVideo,
// CoreValues,
// Features,
// OurStaff,
// VissionMission,
"./components/index";
import { useIsRTL } from "@hooks";
import {
  FAQSection,
  GetStartedSection,
  // GetStarted,
} from "@views/home/components";
import { t } from "i18next";
import { Helmet } from "@/lib/helmet-compat";
import { usePageDetail } from "@hooks/api/useMokafaatQueries";
import { useNavigate } from "@/lib/router-compat";
import { HiOutlineHome } from "react-icons/hi";
import { BsChevronDown } from "react-icons/bs";
import AboutComponent from "@views/home/components/AboutComponent";

const AboutPage = () => {
  const isRTL = useIsRTL();
  const navigate = useNavigate();

  // Fetch about page content from API
  const { data: pageResponse, isLoading } = usePageDetail("about-us");

  // Extract page content from API response
  const pageData = (pageResponse as Record<string, unknown>)?.data as
    | Record<string, unknown>
    | undefined;
  const page = pageData?.page as
    | { title?: string; content?: string }
    | undefined;

  return (
    <>
      <Helmet>
        <title>{t("home.navbar.about")}</title>
        <link rel="canonical" href="https://mukafaat.com/about" />
        <meta
          name="description"
          content="Learn more about our mission, values, and the team behind Mukafaat."
        />
        <meta property="og:title" content={t("home.navbar.about")} />
        <meta
          property="og:description"
          content="Learn more about our mission, values, and the team behind Mukafaat."
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50" style={{ paddingTop: "72px" }}>
        {/* Listing Header */}
        <div className="bg-white pb-6">
          <div className="container mx-auto px-4 lg:px-0 py-0">
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
                onClick={() => navigate("/about")}
              >
                {isRTL ? "من نحن" : t("about.hero.title")}
              </span>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-2">
                <h1
                  className="text-[#400198] text-3xl font-bold"
                  style={{
                    fontFamily: isRTL
                      ? "Readex Pro, sans-serif"
                      : "Jost, sans-serif",
                  }}
                >
                  {page?.title || (isRTL ? "من نحن - مكافئات" : "About Mukafaat")}
                </h1>
                <p className="text-gray-600 text-sm">
                  {isRTL
                    ? "اكتشف منصة مكافئات الرائدة في المملكة العربية السعودية لتوفير المال والاستفادة من أفضل العروض والخصومات على البطاقات الائتمانية والكوبونز والحجوزات."
                    : "Discover Mukafaat, the leading platform in Saudi Arabia for saving money and benefiting from the best offers and discounts on credit cards, coupons, and bookings."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* API content section - shown if API returns content */}
        {isLoading ? (
          <div className="bg-white py-8">
            <div className="container mx-auto px-4 lg:px-0">
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        ) : page?.content ? (
          <div className="bg-white py-8">
            <div className="container mx-auto px-4 lg:px-0">
              <div
                className="prose max-w-none text-sm text-gray-700 leading-relaxed [&_h2]:text-[#400198] [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-[#400198] [&_h3]:text-md [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-2 [&_ul]:ml-4 [&_p]:mb-3 [&_img]:rounded-xl [&_img]:my-4"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
            </div>
          </div>
        ) : null}

        <AboutComponent />
        <GetStartedSection className="mt-0 mb-0" /> <FAQSection />
        {/* <AboutVideo
          arDescription={aboutUs?.arDescription}
          enDescription={aboutUs?.enDescription}
        />
        <CoreValues />
        <VissionMission
          vissionDescription={ourVission}
          missionDescription={ourMission}
        />
        <GetStarted /> */}
      </div>
    </>
  );
};

export default AboutPage;
