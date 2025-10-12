import { MetadataRoute } from "next";
import { db } from "@/db";
import { post } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  // Get all published blog posts
  const publishedPosts = await db
    .select({
      slug: post.slug,
      updatedAt: post.updatedAt,
      publishedAt: post.publishedAt,
    })
    .from(post)
    .where(eq(post.published, true));

  // Static routes
  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
  ];

  // Dynamic blog post routes
  const blogRoutes = publishedPosts.map((postItem) => ({
    url: `${baseUrl}/blog/${postItem.slug}`,
    lastModified: postItem.updatedAt || postItem.publishedAt || new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...routes, ...blogRoutes];
}
