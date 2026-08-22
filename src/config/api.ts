/**
 * Mokafaat API Configuration
 *
 * التطوير المحلي: المتصفح يطلب من نفس الأصل ("") وNext يمرّر `/api/*` عبر rewrites
 * إلى الباك اند المحلي (يتجنّب CORS ويسهّل التشغيل).
 *
 * الإنتاج: بعض الاستضافات (cPanel/Passenger) لا تمرّر `/api/*` إلى تطبيق Next،
 * فيرجع 404. لذلك في بناء الإنتاج نستخدم عنوان الـ API المطلق مباشرة —
 * والباك اند يرسل `Access-Control-Allow-Origin: *` فلا مشكلة CORS.
 *
 * اضبط `NEXT_PUBLIC_API_BASE_URL` قبل `npm run build` (القيمة تُحقن وقت البناء).
 */
const CONFIGURED_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

const isBrowser = typeof window !== "undefined";
const isProduction = process.env.NODE_ENV === "production";

export const API_BASE_URL = isBrowser
  ? isProduction && CONFIGURED_API_URL
    ? CONFIGURED_API_URL // إنتاج: نداء مباشر لعنوان الـ API
    : "" // تطوير: نفس الأصل عبر rewrites
  : CONFIGURED_API_URL || "https://admin.mukafaat.com.sa";
