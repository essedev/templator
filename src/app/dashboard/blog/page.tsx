import { db } from "@/db";
import { post } from "@/db/schema";
import { requireAuth } from "@/lib/rbac";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common";
import { DeletePostButton } from "./DeletePostButton";

/**
 * Dashboard blog management page (Editor/Admin only).
 * Lista tutti i post dell'utente corrente con CRUD operations.
 */
export const dynamic = "force-dynamic"; // Sempre fresh data

export default async function DashboardBlogPage() {
  // Richiede ruolo editor o admin
  const session = await requireAuth(["editor", "admin"]);

  // Fetch tutti i post dell'utente
  const userPosts = await db
    .select()
    .from(post)
    .where(eq(post.authorId, session.user.id))
    .orderBy(desc(post.createdAt));

  return (
    <div>
      <PageHeader title="Blog Posts" description="Manage your blog posts">
        <Link href="/dashboard/blog/new">
          <Button>Create New Post</Button>
        </Link>
      </PageHeader>

      {userPosts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground mb-4">
              You haven't created any posts yet.
            </p>
            <div className="text-center">
              <Link href="/dashboard/blog/new">
                <Button>Create Your First Post</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {userPosts.map((postItem) => (
            <Card key={postItem.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle>{postItem.title}</CardTitle>
                      <Badge variant={postItem.published ? "default" : "secondary"}>
                        {postItem.published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    {postItem.excerpt && <CardDescription>{postItem.excerpt}</CardDescription>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <p>Created: {new Date(postItem.createdAt).toLocaleDateString("en-US")}</p>
                    {postItem.publishedAt && (
                      <p>Published: {new Date(postItem.publishedAt).toLocaleDateString("en-US")}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {postItem.published && (
                      <Link href={`/blog/${postItem.slug}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    )}
                    <Link href={`/dashboard/blog/${postItem.id}/edit`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                    <DeletePostButton postId={postItem.id} postTitle={postItem.title} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
