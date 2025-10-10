import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EditProfileForm } from "@/features/profile/EditProfileForm";
import { PageHeader } from "@/components/common";
import { Shield, Mail, Calendar, Clock } from "lucide-react";

/**
 * Dashboard profile page.
 * Mostra le informazioni del profilo utente.
 * Accessibile a tutti gli utenti autenticati.
 */
export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch dati utente completi
  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="View and manage your account information" />

      {/* Profile Information - Editable */}
      <EditProfileForm initialName={user.name ?? ""} initialEmail={user.email} />

      {/* Account Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Role Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Account Role</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Badge
                variant={
                  user.role === "admin"
                    ? "default"
                    : user.role === "editor"
                      ? "secondary"
                      : "outline"
                }
                className="text-sm px-3 py-1"
              >
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {user.role === "admin"
                  ? "Full access to all features and settings"
                  : user.role === "editor"
                    ? "Can manage content and view analytics"
                    : "Basic access to personal features"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Email Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Email Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {user.emailVerified ? (
                <>
                  <Badge variant="default" className="text-sm px-3 py-1">
                    ✓ Verified
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Your email address has been verified
                  </p>
                </>
              ) : (
                <>
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    Not Verified
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Please verify your email to unlock all features
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Member Since Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Member Since</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-semibold">
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <p className="text-sm text-muted-foreground">
                {Math.floor(
                  (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                )}{" "}
                days ago
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Last Activity Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Last Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-semibold">
                {new Date(user.updatedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <p className="text-sm text-muted-foreground">Profile last updated</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
