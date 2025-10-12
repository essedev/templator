import { db } from "@/db";
import { contactMessage } from "@/db/schema";
import { requireAuth } from "@/lib/rbac";
import { desc } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common";

/**
 * Dashboard contacts page (Editor/Admin only).
 * Mostra tutti i messaggi ricevuti dal form di contatto.
 */
export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  // Richiede ruolo editor o admin
  await requireAuth(["editor", "admin"]);

  // Fetch tutti i messaggi
  const messages = await db.select().from(contactMessage).orderBy(desc(contactMessage.createdAt));

  return (
    <div className="space-y-6">
      <PageHeader title="Contact Messages" description="Messages received from the contact form" />

      {/* Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Total Messages</CardDescription>
          <CardTitle className="text-3xl">{messages.length}</CardTitle>
        </CardHeader>
      </Card>

      {/* Messages List */}
      <div className="space-y-4">
        {messages.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">No messages received yet.</p>
            </CardContent>
          </Card>
        ) : (
          messages.map((message) => (
            <Card key={message.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{message.name}</CardTitle>
                    <CardDescription>{message.email}</CardDescription>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(message.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{message.message}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
