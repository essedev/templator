import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { RoleSelector } from "./RoleSelector";

/**
 * Dashboard users management page (Admin only).
 * Mostra tutti gli utenti e permette di gestire i loro ruoli.
 */
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await auth();

  // Double check: anche se il middleware protegge, verifichiamo comunque
  if (!session?.user || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  // Fetch tutti gli utenti
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  // Statistiche per ruolo
  const usersByRole = {
    user: allUsers.filter((u) => u.role === "user").length,
    editor: allUsers.filter((u) => u.role === "editor").length,
    admin: allUsers.filter((u) => u.role === "admin").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">User Management</h2>
        <p className="text-muted-foreground">Manage users and their roles (Admin only)</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-3xl">{allUsers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Users</CardDescription>
            <CardTitle className="text-3xl">{usersByRole.user}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Editors</CardDescription>
            <CardTitle className="text-3xl">{usersByRole.editor}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Admins</CardDescription>
            <CardTitle className="text-3xl">{usersByRole.admin}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            List of all registered users. Click on role to change it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    {user.id === session.user.id && (
                      <Badge variant="outline" className="text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Joined: {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <RoleSelector
                  userId={user.id}
                  currentRole={user.role}
                  disabled={user.id === session.user.id}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Warning */}
      <Alert className="border-yellow-500/50 bg-yellow-500/10">
        <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
        <AlertTitle className="text-yellow-600 dark:text-yellow-500">
          Be careful when changing user roles
        </AlertTitle>
        <AlertDescription className="text-yellow-600/80 dark:text-yellow-500/80">
          Changing a user's role will immediately affect their permissions across the system. You
          cannot change your own role.
        </AlertDescription>
      </Alert>
    </div>
  );
}
