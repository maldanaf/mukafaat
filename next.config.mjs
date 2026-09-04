/** @type {import('next').NextConfig} */
const nextConfig = {
  // يسمح بتشغيل أكثر من خادم تطوير على نفس المشروع دون تضارب على .next
  // (الافتراضي كما هو؛ يُضبط بـ NEXT_DIST_DIR عند الحاجة فقط)
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // مؤشر التطوير كان يغطّي تبويبات شريط الموبايل السفلي
  devIndicators: false,
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // أخطاء الأنواع صفر الآن — نُبقي البناء يفشل عند أي خطأ جديد
    ignoreBuildErrors: false,
  },
  images: {
    disableStaticImages: true,
    remotePatterns: [
      { protocol: "https", hostname: "mokafat.ivadso.com" },
      { protocol: "https", hostname: "admin.mukafaat.com.sa" },
      { protocol: "https", hostname: "mukafaat.com.sa" },
      { protocol: "https", hostname: "mukafaat.com" },
    ],
  },
  // ملف ربط تطبيق iOS بلا امتداد — لا بدّ أن يُخدم بنوع application/json
  async headers() {
    return [
      {
        source: "/.well-known/apple-app-site-association",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
    ];
  },
  /**
   * الصفحات المُدارة من اللوحة لها مساران: المختصر و`/pages/{slug}`.
   *
   * كلاهما يعطي 200 بنفس المحتوى — تكرار صريح يضرّ بالفهرسة. نُبقي
   * المختصر ونحوّل الطويل إليه تحويلاً دائماً (301).
   */
  async redirects() {
    const duplicates = [
      ["about-us", "/about"],
      ["contact-us", "/contact"],
      ["privacy-policy", "/privacy-policy"],
      ["terms-and-conditions", "/terms-and-conditions"],
    ];

    return duplicates.map(([slug, destination]) => ({
      source: `/pages/${slug}`,
      destination,
      // 301 صراحةً لا 308: الزبون طلبها بهذا الرقم، والاثنان دائمان
      // لكن 301 هي المتعارف عليها في تقارير السيو
      statusCode: 301,
    }));
  },

  async rewrites() {
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "https://admin.mukafaat.com.sa";
    return [
      { source: "/api/:path*", destination: `${apiBaseUrl}/api/:path*` },
      { source: "/orders/success", destination: "/orders-success" },
      { source: "/orders/failure", destination: "/orders-failure" },
      { source: "/orders/callback", destination: "/orders-callback" },
      {
        source: "/cards/:companyId/success",
        destination: "/cards-success/:companyId",
      },
    ];
  },
  transpilePackages: ["antd"],
};

export default nextConfig;
