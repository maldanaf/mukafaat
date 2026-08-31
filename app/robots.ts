import type { MetadataRoute } from "next";

const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://mukafaat.com.sa"
).replace(/\/$/, "");

/**
 * قواعد الزحف.
 *
 * نمنع المسارات التي لا قيمة لها في الفهرسة أو التي تُهدر ميزانية الزحف:
 * صفحات الحساب، والدفع، ونتائج العمليات، وصفحات المصادقة.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/profile/",
          "/cart",
          "/saved",
          "/wallet",
          "/orders",
          "/orders/",
          "/login",
          "/register",
          "/confirm-email",
          // صفحات نتائج الدفع — محتوى مؤقّت لمستخدم بعينه
          "/subscription/payment",
          "/subscription/success",
          "/subscription/failed",
          "/subscription/invoice",
          "/bookings/*/payment",
          "/bookings/*/success",
          // معاملات الفرز والتصفية تُنتج تكراراً بلا قيمة
          "/*?*sort=",
          "/*?*page=",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
