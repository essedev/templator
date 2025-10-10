import { db } from "@/db";
import { posts, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Section } from "@/components/common";

/**
 * Blog post detail page.
 * Dynamic route con params [slug].
 */
export const revalidate = 60;

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const [post] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.slug, params.slug), eq(posts.published, true)))
    .limit(1);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: post.title,
    description: post.excerpt || undefined,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  // Fetch post con join su author
  const [postData] = await db
    .select({
      post: posts,
      author: users,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(and(eq(posts.slug, params.slug), eq(posts.published, true)))
    .limit(1);

  if (!postData) {
    notFound();
  }

  const { post, author } = postData;

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
              {post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Draft"}
            </time>
          </div>

          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

          {post.excerpt && <p className="text-xl text-muted-foreground">{post.excerpt}</p>}

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
        {post.coverImage && (
          <div className="mb-8">
            <img src={post.coverImage} alt={post.title} className="w-full rounded-lg" />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none">
          {/* Simple content rendering - can be replaced with markdown renderer */}
          <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: post.content }} />
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
