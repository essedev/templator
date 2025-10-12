import { db } from "@/db";
import { post, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Section } from "@/components/common";
import { createMetadata } from "@/lib/metadata";

/**
 * Blog post detail page.
 * Dynamic route con params [slug].
 */
export const revalidate = 60;

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const [postData] = await db
    .select()
    .from(post)
    .where(and(eq(post.slug, slug), eq(post.published, true)))
    .limit(1);

  if (!postData) {
    return createMetadata({
      title: "Post Not Found",
      noIndex: true,
    });
  }

  return createMetadata({
    title: postData.title,
    description: postData.excerpt || `Read ${postData.title} on Templator blog`,
    image: postData.coverImage || undefined,
    path: `/blog/${postData.slug}`,
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  // Fetch post con join su author
  const [postData] = await db
    .select({
      post: post,
      author: user,
    })
    .from(post)
    .leftJoin(user, eq(post.authorId, user.id))
    .where(and(eq(post.slug, slug), eq(post.published, true)))
    .limit(1);

  if (!postData) {
    notFound();
  }

  const { post: postItem, author } = postData;

  return (
    <Section>
      <article className="mx-auto max-w-3xl">
        {/* Back link */}
        <Link
          href="/blog"
          className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-block"
        >
          ← Back to blog
        </Link>

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">Published</Badge>
            <time className="text-sm text-muted-foreground">
              {postItem.publishedAt
                ? new Date(postItem.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Draft"}
            </time>
          </div>

          <h1 className="text-4xl font-bold mb-4">{postItem.title}</h1>

          {postItem.excerpt && <p className="text-xl text-muted-foreground">{postItem.excerpt}</p>}

          {/* Author */}
          {author && (
            <div className="flex items-center gap-3 mt-6">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                {author.name ? author.name[0].toUpperCase() : "A"}
              </div>
              <div>
                <p className="text-sm font-medium">{author.name || "Anonymous"}</p>
                <p className="text-xs text-muted-foreground">{author.email}</p>
              </div>
            </div>
          )}
        </header>

        <Separator className="mb-8" />

        {/* Cover image */}
        {postItem.coverImage && (
          <div className="mb-8 relative w-full aspect-video">
            <Image
              src={postItem.coverImage}
              alt={postItem.title}
              fill
              className="object-cover rounded-lg"
              sizes="(max-width: 768px) 100vw, 800px"
              unoptimized
            />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none">
          {/* Simple content rendering - can be replaced with markdown renderer */}
          <div
            className="whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: postItem.content }}
          />
        </div>

        <Separator className="my-8" />

        {/* Footer */}
        <footer>
          <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to blog
          </Link>
        </footer>
      </article>
    </Section>
  );
}
