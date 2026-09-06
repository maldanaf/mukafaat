"use client";

import { useIsRTL } from "@hooks";
import { usePageDetail } from "@hooks/api/useMokafaatQueries";
import GetStartedSection from "@views/home/components/GetStartedSection";
import { t } from "i18next";
import { Helmet } from "@/lib/helmet-compat";
import { HiOutlineHome } from "react-icons/hi";
import { BsChevronDown } from "react-icons/bs";
import { UnderTitle, PrivacyImage } from "@assets";
import { useNavigate } from "@/lib/router-compat";
import { LuPhoneCall } from "react-icons/lu";
import { useInquiryModal } from "@context";

function TermsConditionsPage() {
  const isRTL = useIsRTL();
  const navigate = useNavigate();
  const { openModal } = useInquiryModal();

  const { data: pageResponse, isLoading } = usePageDetail("terms-and-conditions");

  // Extract page content from API response
  const pageData = (pageResponse as Record<string, unknown>)?.data as
    | Record<string, unknown>
    | undefined;
  const page = pageData?.page as
    | { title?: string; content?: string }
    | undefined;

  // Hardcoded fallback content
  const fallbackContent = isRTL
    ? `<p>مرحباً بك في منصة مكافآت. تحكم هذه الشروط والأحكام استخدامك لموقعنا الإلكتروني وخدماتنا. من خلال الوصول إلى موقعنا الإلكتروني واستخدامه، فإنك تقبل وتوافق على الالتزام بهذه الشروط والأحكام.</p>
<p>إذا كنت لا توافق على أي جزء من هذه الشروط والأحكام، يرجى عدم استخدام موقعنا الإلكتروني أو خدماتنا. نحتفظ بالحق في تعديل هذه الشروط في أي وقت.</p>
<p>تنطبق هذه الشروط على جميع الزوار والمستخدمين والآخرين الذين يصلون إلى خدماتنا أو يستخدمونها. من خلال استخدام خدماتنا، فإنك توافق على الالتزام بهذه الشروط.</p>
<h3>قبول الشروط</h3>
<p>من خلال الوصول إلى هذا الموقع الإلكتروني واستخدامه، فإنك تقبل وتوافق على الالتزام بشروط وأحكام هذه الاتفاقية. إذا كنت لا توافق على الالتزام بما سبق، يرجى عدم استخدام هذه الخدمة.</p>
<h3>رخصة الاستخدام</h3>
<p>يُمنح الإذن لتحميل نسخة واحدة مؤقتة من المواد (المعلومات أو البرامج) على موقع منصة مكافآت الإلكتروني للعرض الشخصي غير التجاري المؤقت فقط.</p>
<p>هذا منح رخصة وليس نقل ملكية، وتحت هذه الرخصة لا يجوز لك: تعديل أو نسخ المواد، أو استخدام المواد لأي غرض تجاري، أو نقل المواد إلى شخص آخر.</p>
<p>ستنتهي هذه الرخصة تلقائياً إذا انتهكت أي من هذه القيود ويمكن إنهاؤها من قبل منصة مكافآت في أي وقت.</p>
<h3>إخلاء المسؤولية</h3>
<p>يتم تقديم المواد على موقع منصة مكافآت الإلكتروني على أساس t("termsPage.t_6ea159", 'كما هي'). لا تقدم منصة مكافآت أي ضمانات، صريحة أو ضمنية، وتتنصل وتنفي جميع الضمانات الأخرى بما في ذلك على سبيل المثال لا الحصر:</p>
<ul>
<li>الضمانات الضمنية للقابلية للتسويق أو الملاءمة لغرض معين</li>
<li>عدم انتهاك الملكية الفكرية أو انتهاك آخر للحقوق</li>
<li>دقة أو اكتمال أو موثوقية أي مواد</li>
<li>ملاءمة المعلومات لأي غرض محدد</li>
<li>توفر وإمكانية الوصول إلى الموقع الإلكتروني والخدمات</li>
<li>أمان نقل المعلومات</li>
<li>التوافق مع جميع الأجهزة والمتصفحات</li>
</ul>`
    : `<p>Welcome to Mukafaat platform. These terms and conditions govern your use of our website and services. By accessing and using our website, you accept and agree to be bound by these terms and conditions.</p>
<p>If you disagree with any part of these terms and conditions, please do not use our website or services. We reserve the right to modify these terms at any time.</p>
<p>These terms apply to all visitors, users, and others who access or use our services. By using our services, you agree to be bound by these terms.</p>
<h3>Acceptance of Terms</h3>
<p>By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
<h3>Use License</h3>
<p>Permission is granted to temporarily download one copy of the materials (information or software) on Mukafaat platform's website for personal, non-commercial transitory viewing only.</p>
<p>This is the grant of a license, not a transfer of title, and under this license you may not: modify or copy the materials, use the materials for any commercial purpose, or transfer the materials to another person.</p>
<p>This license shall automatically terminate if you violate any of these restrictions and may be terminated by Mukafaat platform at any time.</p>
<h3>Disclaimer</h3>
<p>The materials on Mukafaat platform's website are provided on an 'as is' basis. Mukafaat platform makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation:</p>
<ul>
<li>Implied warranties of merchantability or fitness for a particular purpose</li>
<li>Non-infringement of intellectual property or other violation of rights</li>
<li>Accuracy, completeness, or reliability of any materials</li>
<li>Suitability of information for any specific purpose</li>
<li>Availability and accessibility of the website and services</li>
<li>Security of information transmission</li>
<li>Compatibility with all devices and browsers</li>
</ul>`;

  const pageTitle = page?.title || (isRTL ? "الشروط والأحكام - مكافآت" : `${t("home.footer.terms")} - Mukafaat`);
  const pageContent = page?.content || fallbackContent;

  return (
    <>
      <Helmet>
        <title>{t("home.footer.terms")}</title>
        <link
          rel="canonical"
          href="https://mukafaat.com.sa/terms-and-conditions"
        />
        <meta name="description" content="Mukafaat Terms and Conditions" />
        <meta property="og:title" content={t("home.footer.terms")} />
        <meta
          property="og:description"
          content="Mukafaat Terms and Conditions"
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
                {t("ui.t_b986d8", "الرئيسية")}
              </span>
              <BsChevronDown
                className={`mx-2 transform ${
                  isRTL ? "rotate-90" : "rotate-[270deg]"
                }`}
              />

              <span> {t("home.footer.terms")}</span>
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
              {/* Main Content - Left Column */}
              <div className="w-full lg:w-3/4 space-y-6">
                {/* Article Header */}
                <div className="bg-white rounded-xl p-0">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-[#400198] mb-2">
                        {pageTitle}
                      </h1>
                    </div>
                  </div>
                </div>

                {/* Main Article Image */}
                <div className="bg-white rounded-2xl overflow-hidden">
                  <div className="p-0">
                    <img
                      src={PrivacyImage}
                      alt="termsConditions"
                      className="w-full h-[333px] object-cover rounded-2xl"
                    />
                  </div>
                </div>

                {/* Terms & Conditions Content */}
                <div className="bg-white rounded-xl py-6">
                  {isLoading ? (
                    <div className="space-y-4 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/3 mt-6"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/3 mt-6"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                    </div>
                  ) : (
                    <div
                      className="prose max-w-none text-sm text-gray-700 leading-relaxed [&_h3]:text-[#400198] [&_h3]:text-md [&_h3]:font-semibold [&_h3]:uppercase [&_h3]:tracking-wider [&_h3]:mt-6 [&_h3]:mb-3 [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-2 [&_ul]:ml-4 [&_p]:mb-3"
                      dangerouslySetInnerHTML={{ __html: pageContent }}
                    />
                  )}
                </div>
              </div>

              {/* Sidebar - Right Column */}
              <div
                className="w-full lg:w-1/4 space-y-6"
                style={{
                  marginTop: "65px",
                }}
              >
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
                      {t("blogs.t_e9dc26", "تحتاج مساعدة في التوفير؟")}
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
                        {t("blogs.t_0a9249", "الاسم")}
                      </label>
                      <input
                        type="text"
                        placeholder={t("blogs.t_ba0c2e", "أدخل الاسم")}
                        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#400198] focus:border-transparent ${
                          isRTL ? "text-right" : "text-left"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("contact.t_211cce", "رقم الهاتف")}
                      </label>
                      <input
                        type="tel"
                        placeholder={t("contact.t_211cce", "رقم الهاتف")}
                        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#400198] focus:border-transparent ${
                          isRTL ? "text-right" : "text-left"
                        }`}
                      />
                    </div>
                    <button
                      onClick={() =>
                        openModal(
                          t("blogs.t_16d7bd", "احصل على مساعدة في التوفير"),
                          t("blogs.t_1f8018", "املأ النموذج أدناه وسنتصل بك لمناقشة احتياجاتك في التوفير والاستفادة من أفضل العروض.")
                        )
                      }
                      className="bg-[#400198] h-[45px] w-full justify-center hover:scale-105 transition-transform duration-300 text-sm sm:text-md px-8 sm:px-8 lg:px-8 py-2 sm:py-2 font-semibold rounded-full text-white flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <LuPhoneCall className="text-lg" />
                      {t("blogs.t_74c16c", "اتصل بي")}
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

export default TermsConditionsPage;
