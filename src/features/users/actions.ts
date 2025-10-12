"use server";

import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { updateUserRoleSchema } from "./schema";
import { sendEmail } from "@/lib/emails/send";
import { RoleChangedTemplate } from "@/lib/emails/templates/users/role-changed";

/**
 * Server action per aggiornare il ruolo di un utente.
 * Solo gli admin possono eseguire questa azione.
 */
export async function updateUserRole(userId: string, role: string) {
  const session = await getSession();

  // Verifica che l'utente sia autenticato e sia admin
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized: Only admins can update user roles");
  }

  // Validazione input con Zod schema
  const data = updateUserRoleSchema.parse({ userId, role });

  // Non permettere all'admin di modificare il proprio ruolo
  if (session.user.id === data.userId) {
    throw new Error("You cannot change your own role");
  }

  try {
    // Get user's current info before update
    const [targetUser] = await db.select().from(user).where(eq(user.id, data.userId)).limit(1);

    if (!targetUser) {
      throw new Error("User not found");
    }

    const oldRole = targetUser.role;

    // Aggiorna il ruolo dell'utente
    await db.update(user).set({ role: data.role }).where(eq(user.id, data.userId));

    // Send notification email to the user
    if (targetUser.email) {
      try {
        await sendEmail({
          to: targetUser.email,
          subject: "Your account role has been updated",
          react: RoleChangedTemplate({
            name: targetUser.name || "User",
            oldRole: oldRole,
            newRole: data.role,
            changedBy: session.user.name || session.user.email || "Admin",
            changedAt: new Date(),
          }),
        });
      } catch (emailError) {
        // Don't block role update if email fails
        console.error("Role change notification email failed:", emailError);
      }
    }

    // Revalida la pagina
    revalidatePath("/dashboard/users");

    return { success: true };
  } catch (error) {
    console.error("Error updating user role:", error);
    throw new Error("Failed to update user role");
  }
}

/**
 * Server action per eliminare un utente.
 * Solo gli admin possono eseguire questa azione.
 */
export async function deleteUser(userId: string) {
  const session = await getSession();

  // Verifica che l'utente sia autenticato e sia admin
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized: Only admins can delete users");
  }

  // Non permettere all'admin di eliminare se stesso
  if (session.user.id === userId) {
    throw new Error("You cannot delete yourself");
  }

  try {
    // Elimina l'utente (cascade eliminerà anche posts, sessions, ecc.)
    await db.delete(user).where(eq(user.id, userId));

    // Revalida la pagina
    revalidatePath("/dashboard/users");

    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new Error("Failed to delete user");
  }
}
