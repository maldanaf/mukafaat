import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/profile/", "/cart", "/saved", "/wallet", "/orders/"],
    },
    sitemap: "https://mukafaat.com/sitemap.xml",
  };
}
