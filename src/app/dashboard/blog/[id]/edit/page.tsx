import { db } from "@/db";
import { posts } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { PostForm } from "@/features/blog/PostForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface EditPostPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Dashboard page per modificare blog post esistente.
 */
export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch post
  const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);

  if (!post) {
    notFound();
  }

  // Verifica ownership
  if (post.authorId !== session.user.id) {
    redirect("/dashboard/blog");
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Edit Post</CardTitle>
          <CardDescription>
            Update your blog post. Changes will be saved to database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PostForm
            mode="edit"
            postId={post.id}
            defaultValues={{
              title: post.title,
              slug: post.slug,
              excerpt: post.excerpt || undefined,
              content: post.content,
              coverImage: post.coverImage || undefined,
              published: post.published,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
