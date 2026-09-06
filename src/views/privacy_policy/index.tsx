"use client";

import { useIsRTL } from "@hooks";
import { usePageDetail } from "@hooks/api/useMokafaatQueries";
import { t } from "i18next";
import { Helmet } from "@/lib/helmet-compat";
import { HiOutlineHome } from "react-icons/hi";
import { BsChevronDown } from "react-icons/bs";
import { UnderTitle, PrivacyImage } from "@assets";
import { useNavigate } from "@/lib/router-compat";
import { LuPhoneCall } from "react-icons/lu";
import { useInquiryModal } from "@context";
import GetStartedSection from "@views/home/components/GetStartedSection";

function PrivacyPolicyPage() {
  const isRTL = useIsRTL();
  const navigate = useNavigate();
  const { openModal } = useInquiryModal();

  const { data: pageResponse, isLoading } = usePageDetail("privacy-policy");

  // Extract page content from API response
  const pageData = (pageResponse as Record<string, unknown>)?.data as
    | Record<string, unknown>
    | undefined;
  const page = pageData?.page as
    | { title?: string; content?: string }
    | undefined;

  // Hardcoded fallback content
  const fallbackContent = isRTL
    ? `<p>أحد أولوياتنا الرئيسية في منصة مكافآت هو حماية خصوصية زوارنا، وتحتوي وثيقة سياسة الخصوصية هذه على أنواع المعلومات التي يتم جمعها وتسجيلها من قبل منصة مكافآت وكيفية استخدامنا لها.</p>
<p>إذا كان لديك أسئلة إضافية أو تحتاج إلى مزيد من المعلومات حول سياسة الخصوصية الخاصة بنا، فلا تتردد في الاتصال بنا.</p>
<p>تنطبق سياسة الخصوصية هذه فقط على أنشطتنا عبر الإنترنت، وتشمل زوار موقعنا الإلكتروني فيما يتعلق بالمعلومات التي شاركوها و/أو نجمعها في منصة مكافآت. لا تنطبق هذه السياسة على أي معلومات يتم جمعها خارج الإنترنت أو عبر قنوات أخرى غير هذا الموقع الإلكتروني.</p>
<h3>الموافقة</h3>
<p>عند استخدام موقعنا الإلكتروني، فإنك توافق على سياسة الخصوصية الخاصة بنا والشروط المنشورة.</p>
<h3>المعلومات التي نجمعها</h3>
<p>المعلومات الشخصية التي يُطلب منك تقديمها، والأسباب التي تطلب منك تقديمها، ستكون واضحة لك في النقطة التي نطلب منك فيها تقديم معلوماتك الشخصية.</p>
<p>إذا اتصلت بنا مباشرة، فقد نتلقى معلومات إضافية عنك مثل اسمك وعنوان بريدك الإلكتروني ورقم هاتفك ومحتوى الرسالة و/أو المرفقات التي قد ترسلها لنا، وأي معلومات أخرى قد تختار تقديمها.</p>
<p>عندما تسجل للحصول على حساب، قد نطلب معلومات الاتصال الخاصة بك، بما في ذلك عناصر مثل الاسم واسم الشركة والعنوان وعنوان البريد الإلكتروني ورقم الهاتف.</p>
<h3>كيف نستخدم معلوماتك</h3>
<p>نستخدم المعلومات التي نجمعها بطرق مختلفة، بما في ذلك:</p>
<ul>
<li>تقديم وتشغيل وصيانة موقعنا الإلكتروني</li>
<li>تحسين وتخصيص وتوسيع موقعنا الإلكتروني</li>
<li>فهم وتحليل كيفية استخدامك لموقعنا الإلكتروني</li>
<li>تطوير منتجات وخدمات وميزات ووظائف جديدة</li>
<li>التواصل معك، إما مباشرة أو من خلال أحد شركائنا</li>
<li>إرسال رسائل بريد إلكتروني</li>
<li>العثور على شيء ومنع الاحتيال</li>
</ul>`
    : `<p>One of our main priorities at Mukafaat platform is to protect the privacy of our visitors, and this privacy policy document contains the types of information that is collected and recorded by Mukafaat platform and how we use it.</p>
<p>If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us.</p>
<p>This Privacy Policy applies only to our online activities, and it includes visitors to our website with respect to the information they shared and/or we collect at Mukafaat platform. This policy does not apply to any information collected offline or via channels other than this website.</p>
<h3>Consent</h3>
<p>When using our website, you agree to our privacy policy and its published terms.</p>
<h3>The information we collect</h3>
<p>The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information.</p>
<p>If you contact us directly, we may receive additional information about you such as your name, email address, telephone number, the contents of the message and/or attachments that you may send us, and any other information that you may choose to provide.</p>
<p>When you register for an Account, we may ask for your contact information, including items such as name, company name, address, email address, and phone number.</p>
<h3>How we use your information</h3>
<p>We use the information we collect in various ways, including to:</p>
<ul>
<li>Providing, operating, and maintaining our website</li>
<li>Improve, customize and expand our website</li>
<li>Understand and analyze how you use our website</li>
<li>Develop new products, services, features, and functionality</li>
<li>Communicate with you, either directly or through one of our partners</li>
<li>Send emails</li>
<li>Find something and prevent fraud</li>
</ul>`;

  const pageTitle = page?.title || (isRTL ? "سياسة الخصوصية - مكافآت" : `${t("home.footer.privacy")} - Mukafaat`);
  const pageContent = page?.content || fallbackContent;

  return (
    <>
      <Helmet>
        <title>{t("home.footer.privacy")}</title>
        <link rel="canonical" href="https://mukafaat.com.sa/privacy-policy" />
        <meta name="description" content="Mukafaat Privacy Policy" />
        <meta property="og:title" content={t("home.footer.privacy")} />
        <meta property="og:description" content="Mukafaat Privacy Policy" />
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

              <span>{isRTL ? "سياسة الخصوصية" : t("home.footer.privacy")}</span>
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
                      alt="privacyPolicy"
                      className="w-full h-[333px] object-cover rounded-2xl"
                    />
                  </div>
                </div>

                {/* Privacy Policy Content */}
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

export default PrivacyPolicyPage;
