import { db } from "@/db";
import { posts } from "@/db/schema";
import { auth } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common";
import { DeletePostButton } from "./DeletePostButton";

/**
 * Dashboard blog management page.
 * Lista tutti i post dell'utente corrente con CRUD operations.
 */
export const dynamic = "force-dynamic"; // Sempre fresh data

export default async function DashboardBlogPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch tutti i post dell'utente
  const userPosts = await db
    .select()
    .from(posts)
    .where(eq(posts.authorId, session.user.id))
    .orderBy(desc(posts.createdAt));

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
          {userPosts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle>{post.title}</CardTitle>
                      <Badge variant={post.published ? "default" : "secondary"}>
                        {post.published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    {post.excerpt && <CardDescription>{post.excerpt}</CardDescription>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <p>Created: {new Date(post.createdAt).toLocaleDateString("en-US")}</p>
                    {post.publishedAt && (
                      <p>Published: {new Date(post.publishedAt).toLocaleDateString("en-US")}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {post.published && (
                      <Link href={`/blog/${post.slug}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    )}
                    <Link href={`/dashboard/blog/${post.id}/edit`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                    <DeletePostButton postId={post.id} postTitle={post.title} />
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
