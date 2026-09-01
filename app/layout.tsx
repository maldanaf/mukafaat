import type { Metadata } from "next";
import Providers from "./Providers";
import RouteLoadingIndicator from "@components/RouteLoadingIndicator";
import "../src/index.css";
import { SITE_URL, absoluteUrl, alternateLanguages, SITE_NAME_EN } from "@config/site";
import { getSiteSettings, buildSiteSchema } from "@config/siteSettings";

export const metadata: Metadata = {
  // يجعل Next يحوّل كل رابط نسبي في الوسوم إلى مطلق على النطاق الصحيح
  metadataBase: new URL(SITE_URL),
  title:
    "Mukafaat - Offers, Discounts & Savings Platform - منصة العروض والخصومات والتوفير",
  description:
    "Mukafaat - Your ultimate destination for exclusive offers, discounts, credit cards, coupons, and bookings in Saudi Arabia. Save money with the best deals on financial services, travel, and more. | مكافئات - وجهتك المثلى للعروض الحصرية والخصومات والبطاقات الائتمانية والكوبونات والحجوزات في المملكة العربية السعودية.",
  keywords:
    "Mukafaat, Offers, Discounts, Credit Cards, Coupons, Bookings, Saudi Arabia, مكافئات، عروض، خصومات، بطاقات ائتمانية، كوبونات، حجوزات",
  robots: "index, follow",
  verification: {
    google: "Wl-zASC8dqrPG3PoyQZfKIkWIYX8fLislM_EXt6TC74",
  },
  openGraph: {
    title: "Mukafaat - Offers, Discounts & Savings Platform",
    description:
      "Mukafaat - Your ultimate destination for exclusive offers, discounts, credit cards, coupons, and bookings in Saudi Arabia.",
    url: SITE_URL,
    siteName: SITE_NAME_EN,
    type: "website",
    locale: "ar_SA",
    images: [absoluteUrl("/assets/logo-BcBtrMQ_.svg")],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mukafaat - Offers, Discounts & Savings Platform",
    description:
      "Mukafaat - Your ultimate destination for exclusive offers, discounts, credit cards, coupons, and bookings in Saudi Arabia.",
    images: [absoluteUrl("/assets/logo-BcBtrMQ_.svg")],
  },
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: "/favicon.png",
  },
};

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
