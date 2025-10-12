import { db } from "@/db";
import { post } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, Section } from "@/components/common";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Blog",
  description: "Latest articles and updates about Next.js, Drizzle, NextAuth, and web development",
  path: "/blog",
});

/**
 * Blog list page - mostra tutti i post pubblicati.
 * Server Component con data fetching diretto.
 */
export const revalidate = 60; // Revalidate ogni 60 secondi

export default async function BlogPage() {
  // Fetch solo post pubblicati
  const publishedPosts = await db
    .select()
    .from(post)
    .where(eq(post.published, true))
    .orderBy(desc(post.publishedAt));

  return (
    <Section>
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Blog" description="Latest articles and updates" />

        {publishedPosts.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-center text-muted-foreground">
                No published posts yet. Check back soon!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {publishedPosts.map((postItem) => (
              <Link key={postItem.id} href={`/blog/${postItem.slug}`}>
                <Card className="hover:border-foreground transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="mb-2 hover:underline">{postItem.title}</CardTitle>
                        {postItem.excerpt && <CardDescription>{postItem.excerpt}</CardDescription>}
                      </div>
                      <Badge variant="secondary">Published</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <time className="text-sm text-muted-foreground">
                      {postItem.publishedAt
                        ? new Date(postItem.publishedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "Draft"}
                    </time>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
