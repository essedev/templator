import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, sessions, posts, contactMessages, newsletterSubscribers } from "@/db/schema";
import { redirect } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleGate } from "@/components/auth";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Query statistiche base
  const [userCountResult, sessionCountResult] = await Promise.all([
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(sessions),
  ]);

  const userCount = userCountResult[0]?.count ?? 0;
  const sessionCount = sessionCountResult[0]?.count ?? 0;

  // My Posts count (solo per editor/admin che possono scrivere)
  let myPostsCount = 0;
  if (session.user.role === "editor" || session.user.role === "admin") {
    const myPostsResult = await db
      .select({ count: count() })
      .from(posts)
      .where(eq(posts.authorId, session.user.id));
    myPostsCount = myPostsResult[0]?.count ?? 0;
  }

  // Query statistiche avanzate (solo editor/admin)
  let totalPostsCount = 0;
  let contactCount = 0;
  let subscriberCount = 0;

  if (session.user.role === "editor" || session.user.role === "admin") {
    const [totalPostsResult, contactResult, subscriberResult] = await Promise.all([
      db.select({ count: count() }).from(posts),
      db.select({ count: count() }).from(contactMessages),
      db.select({ count: count() }).from(newsletterSubscribers),
    ]);

    totalPostsCount = totalPostsResult[0]?.count ?? 0;
    contactCount = contactResult[0]?.count ?? 0;
    subscriberCount = subscriberResult[0]?.count ?? 0;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {session.user.name}!</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening with your account.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* My Posts - Solo Editor/Admin */}
        <RoleGate allowedRoles={["editor", "admin"]}>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>My Posts</CardDescription>
              <CardTitle className="text-4xl">{myPostsCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Total posts you've created</p>
            </CardContent>
          </Card>
        </RoleGate>

        {/* Editor/Admin Stats */}
        <RoleGate allowedRoles={["editor", "admin"]}>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>All Posts</CardDescription>
              <CardTitle className="text-4xl">{totalPostsCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Total posts in the system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Contact Messages</CardDescription>
              <CardTitle className="text-4xl">{contactCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Messages from contact form</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Newsletter Subscribers</CardDescription>
              <CardTitle className="text-4xl">{subscriberCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Active newsletter subscribers</p>
            </CardContent>
          </Card>
        </RoleGate>

        {/* Admin Stats */}
        <RoleGate allowedRoles={["admin"]}>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Users</CardDescription>
              <CardTitle className="text-4xl">{userCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Registered users in the system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active Sessions</CardDescription>
              <CardTitle className="text-4xl">{sessionCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Currently active sessions</p>
            </CardContent>
          </Card>
        </RoleGate>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks you might want to do</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <RoleGate allowedRoles={["editor", "admin"]}>
              <a
                href="/dashboard/blog"
                className="block px-4 py-2 hover:bg-muted rounded-md transition-colors"
              >
                Manage Blog Posts →
              </a>
            </RoleGate>
            <RoleGate allowedRoles={["editor", "admin"]}>
              <a
                href="/dashboard/newsletter"
                className="block px-4 py-2 hover:bg-muted rounded-md transition-colors"
              >
                View Newsletter Subscribers →
              </a>
            </RoleGate>
            <RoleGate allowedRoles={["admin"]}>
              <a
                href="/dashboard/users"
                className="block px-4 py-2 hover:bg-muted rounded-md transition-colors"
              >
                Manage Users →
              </a>
            </RoleGate>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
