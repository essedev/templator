import { db } from "@/db";
import { post } from "@/db/schema";
import { requireAuth } from "@/lib/rbac";
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
 * Dashboard page per modificare blog post esistente (Editor/Admin only).
 */
export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;

  // Richiede ruolo editor o admin
  const session = await requireAuth(["editor", "admin"]);

  // Fetch post
  const [postData] = await db.select().from(post).where(eq(post.id, id)).limit(1);

  if (!postData) {
    notFound();
  }

  // Verifica ownership
  if (postData.authorId !== session.user.id) {
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
            postId={postData.id}
            defaultValues={{
              title: postData.title,
              slug: postData.slug,
              excerpt: postData.excerpt || undefined,
              content: postData.content,
              coverImage: postData.coverImage || undefined,
              published: postData.published,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
