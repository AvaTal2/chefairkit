import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://chefworkkit.com";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/recipe-calculator`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/cost`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/qr`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error(
        "Sitemap: missing Supabase environment variables"
      );

      return staticPages;
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseKey
    );

    const { data: blogs, error } = await supabase
      .from("blogs")
      .select("slug, created_at")
      .not("slug", "is", null)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Sitemap: failed to load blogs:",
        error
      );

      return staticPages;
    }

    const blogPages: MetadataRoute.Sitemap =
      (blogs || [])
        .filter(
          (blog) =>
            typeof blog.slug === "string" &&
            blog.slug.trim().length > 0
        )
        .map((blog) => ({
          url: `${baseUrl}/blog/${blog.slug}`,
          lastModified: blog.created_at
            ? new Date(blog.created_at)
            : new Date(),
          changeFrequency:
            "monthly" as const,
          priority: 0.7,
        }));

    return [
      ...staticPages,
      ...blogPages,
    ];
  } catch (error) {
    console.error(
      "Sitemap unexpected error:",
      error
    );

    return staticPages;
  }
}