/** @type {import('next').NextConfig} */
const nextConfig = {
  // مؤشر التطوير كان يغطّي تبويبات شريط الموبايل السفلي
  devIndicators: false,
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    disableStaticImages: true,
    remotePatterns: [
      { protocol: "https", hostname: "mokafat.ivadso.com" },
      { protocol: "https", hostname: "mukafaat.com" },
    ],
  },
  async rewrites() {
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "https://mokafat.ivadso.com";
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
