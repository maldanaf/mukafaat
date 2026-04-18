import type { Metadata } from "next";
import Script from "next/script";
import Providers from "./Providers";
import RouteLoadingIndicator from "@components/RouteLoadingIndicator";
import "../src/index.css";

export const metadata: Metadata = {
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
    url: "https://mukafaat.com",
    images: ["https://mukafaat.com/assets/logo-BcBtrMQ_.svg"],
  },
  alternates: {
    canonical: "https://mukafaat.com",
  },
  icons: {
    icon: "/favicon.png",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Mukafaat",
  description:
    "Mukafaat - Your ultimate destination for exclusive offers, discounts, credit cards, coupons, and bookings in Saudi Arabia.",
  url: "https://mukafaat.com",
  logo: "https://mukafaat.com/assets/logo-BcBtrMQ_.svg",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    telephone: "+966501234567",
    email: "support@mukafaat.com",
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Riyadh",
    addressRegion: "Riyadh",
    addressCountry: "Saudi Arabia",
  },
  sameAs: [
    "https://wa.me/+966501234567",
    "https://www.linkedin.com/company/mukafaat",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <head>
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
            // Prevent removeChild crashes from browser extensions / DOM mutations
            var origRemoveChild = Node.prototype.removeChild;
            Node.prototype.removeChild = function(child) {
              if (child.parentNode !== this) {
                return child;
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
      </head>
      <body suppressHydrationWarning>
        <RouteLoadingIndicator />
        <Providers>{children}</Providers>
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
