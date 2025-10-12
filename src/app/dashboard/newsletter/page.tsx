import { db } from "@/db";
import { newsletterSubscriber } from "@/db/schema";
import { requireAuth } from "@/lib/rbac";
import { desc } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common";

/**
 * Dashboard newsletter page (Editor/Admin only).
 * Mostra tutti i subscribers della newsletter.
 */
export const dynamic = "force-dynamic";

export default async function NewsletterPage() {
  // Richiede ruolo editor o admin
  await requireAuth(["editor", "admin"]);

  // Fetch tutti i subscribers
  const subscribers = await db
    .select()
    .from(newsletterSubscriber)
    .orderBy(desc(newsletterSubscriber.subscribedAt));

  const activeSubscribers = subscribers.filter((s) => s.status === "active");
  const unsubscribed = subscribers.filter((s) => s.status === "unsubscribed");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Newsletter Subscribers"
        description="View and manage your newsletter subscribers"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Subscribers</CardDescription>
            <CardTitle className="text-3xl">{subscribers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl text-green-500">{activeSubscribers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Unsubscribed</CardDescription>
            <CardTitle className="text-3xl text-muted-foreground">{unsubscribed.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Subscribers List */}
      <Card>
        <CardHeader>
          <CardTitle>All Subscribers</CardTitle>
          <CardDescription>List of all newsletter subscribers and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {subscribers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No subscribers yet.</p>
          ) : (
            <div className="space-y-3">
              {subscribers.map((subscriber) => (
                <div
                  key={subscriber.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{subscriber.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Subscribed: {new Date(subscriber.subscribedAt).toLocaleDateString()}
                      {subscriber.unsubscribedAt &&
                        ` • Unsubscribed: ${new Date(
                          subscriber.unsubscribedAt
                        ).toLocaleDateString()}`}
                    </p>
                  </div>
                  <Badge variant={subscriber.status === "active" ? "default" : "secondary"}>
                    {subscriber.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
