import type { Metadata } from "next";
import Providers from "./Providers";
import RouteLoadingIndicator from "@components/RouteLoadingIndicator";
import "../src/index.css";
import { SITE_URL, absoluteUrl, alternateLanguages, SITE_NAME_EN } from "@config/site";
import { getSiteSettings, buildSiteSchema } from "@config/siteSettings";

/** العنوان والوصف الافتراضيان — يُستبدلان بما في لوحة التحكم إن وُجد */
const DEFAULT_TITLE =
  "مكافآت | عروض وخصومات وكوبونات وبطاقات رقمية في السعودية";
const DEFAULT_DESCRIPTION =
  "مكافآت — منصة العروض والخصومات في السعودية: خصومات دائمة لدى المتاجر الشريكة، وكوبونات وأكواد خصم، وبطاقات رقمية تصلك فوراً.";

/**
 * بيانات الصفحة الافتراضية.
 *
 * `generateMetadata` لا `metadata` ثابتة، لأن الوصف يأتي من إعدادات
 * لوحة التحكم؛ وبلا ذلك يبقى الوصف مكتوباً في الكود فلا يملك صاحب
 * الموقع تغييره.
 *
 * ملاحظة: لا `alternates.canonical` هنا. كانت مضبوطة على الرئيسية
 * فورثتها كل صفحة بلا بيانات خاصة (/blogs و/faq)، فأشارت روابطها
 * الأساسية إلى الرئيسية وأخبرت المحرّكات أنها نسخ مكرّرة منها.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const general = (settings?.general ?? {}) as Record<string, unknown>;

  const siteName = String(general.site_name || "").trim() || "مكافآت";
  const description =
    String(general.site_description || "").trim() || DEFAULT_DESCRIPTION;

  return {
    // يجعل Next يحوّل كل رابط نسبي في الوسوم إلى مطلق على النطاق الصحيح
    metadataBase: new URL(SITE_URL),
    title: {
      default: DEFAULT_TITLE,
      // الصفحات الداخلية تُلحق اسمها باسم المنصّة
      template: `%s | ${siteName}`,
    },
    description,
    keywords:
      "مكافآت, عروض, خصومات, كوبونات, أكواد خصم, بطاقات رقمية, السعودية, Mukafaat, offers, discounts, coupons",
    robots: "index, follow",
    verification: {
      google: "Wl-zASC8dqrPG3PoyQZfKIkWIYX8fLislM_EXt6TC74",
    },
    openGraph: {
      title: DEFAULT_TITLE,
      description,
      url: SITE_URL,
      siteName: SITE_NAME_EN,
      type: "website",
      locale: "ar_SA",
      images: [absoluteUrl("/assets/logo-BcBtrMQ_.svg")],
    },
    twitter: {
      card: "summary_large_image",
      title: DEFAULT_TITLE,
      description,
      images: [absoluteUrl("/assets/logo-BcBtrMQ_.svg")],
    },
    icons: {
      icon: "/favicon.png",
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // بيانات السكيما من لوحة التحكم — الهاتف والبريد والعنوان والحسابات
  const settings = await getSiteSettings();
  const jsonLd = buildSiteSchema(settings);

  return (
    <html suppressHydrationWarning>
      <head>
        {/*
          روابط اللغات البديلة.
          نكتبها يدوياً لأن `alternates.languages` في Next يُسقط معامل
          الاستعلام `?lang=` عند تطبيع الروابط، فتخرج الخمس متطابقة.
        */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {Object.entries(alternateLanguages("/")).map(([locale, href]) => (
          <link key={locale} rel="alternate" hrefLang={locale} href={href} />
        ))}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var l = localStorage.getItem('language') || 'ar';
              var b = l.split('-')[0];
              var r = (b === 'ar' || b === 'ur') ? 'rtl' : 'ltr';
              document.documentElement.setAttribute('lang', b);
              document.documentElement.setAttribute('dir', r);
            } catch(e) {
              document.documentElement.setAttribute('lang', 'ar');
              document.documentElement.setAttribute('dir', 'rtl');
            }
            // Prevent removeChild crashes from DOM mutations
            var origRemoveChild = Node.prototype.removeChild;
            Node.prototype.removeChild = function(child) {
              if (!child || child.parentNode !== this) {
                return child || this;
              }
              return origRemoveChild.call(this, child);
            };
            var origInsertBefore = Node.prototype.insertBefore;
            Node.prototype.insertBefore = function(newNode, refNode) {
              if (refNode && refNode.parentNode !== this) {
                return newNode;
              }
              return origInsertBefore.call(this, newNode, refNode);
            };
          })();
        `}} />

        {/*
          ختم التحقّق — المركز السعودي للأعمال.
          السكربت هنا، وحاوية الختم في <body>: المتصفّح لا يقبل <div>
          داخل <head> فينقله خارجه، فيختلف ما صيّره السيرفر عمّا يبنيه
          العميل وتنهار الترطيب (hydration) في كل صفحات الموقع.
        */}
        <script
          src="https://eauthenticate.saudibusiness.gov.sa/EAuthSealApi/seal.js"
          async
        />
      </head>
      <body suppressHydrationWarning>
        <RouteLoadingIndicator />
        <Providers>{children}</Providers>

        {/* ختم التحقّق — المركز السعودي للأعمال */}
        <div
          className="sbc-verify-seal"
          data-token="RDdhYk03RERjVmUzSVFiTTg2TnNPUT09"
          data-position="bottom-left"
        />
        <script
          src="https://eauthenticate.saudibusiness.gov.sa/EAuthSealApi/seal.js"
          async
        />
      </body>
    </html>
  );
}
