import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://chefworkkit.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/blog",
          "/blog/",
          "/recipe-calculator",
          "/cost",
          "/qr",
          "/pricing",
        ],
        disallow: [
          "/account",
          "/login",
          "/register",
          "/recipes",
          "/ingredients",
          "/production",
          "/sop",
          "/api",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}