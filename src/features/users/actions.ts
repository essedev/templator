"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { Role } from "@/lib/permissions";

/**
 * Server action per aggiornare il ruolo di un utente.
 * Solo gli admin possono eseguire questa azione.
 */
export async function updateUserRole(userId: string, newRole: Role) {
  const session = await auth();

  // Verifica che l'utente sia autenticato e sia admin
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized: Only admins can update user roles");
  }

  // Non permettere all'admin di modificare il proprio ruolo
  if (session.user.id === userId) {
    throw new Error("You cannot change your own role");
  }

  try {
    // Aggiorna il ruolo dell'utente
    await db.update(users).set({ role: newRole }).where(eq(users.id, userId));

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
  const session = await auth();

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
    await db.delete(users).where(eq(users.id, userId));

    // Revalida la pagina
    revalidatePath("/dashboard/users");

    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new Error("Failed to delete user");
  }
}
