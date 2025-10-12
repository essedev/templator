"use server";

import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { updateProfileSchema } from "./schema";

/**
 * Server action per aggiornare il profilo dell'utente.
 * Ogni utente autenticato può aggiornare solo il proprio profilo.
 */
export async function updateProfile(input: unknown) {
  const session = await getSession();

  // Verifica che l'utente sia autenticato
  if (!session?.user) {
    throw new Error("Unauthorized: You must be logged in to update your profile");
  }

  // Validazione input con Zod schema
  const data = updateProfileSchema.parse(input);

  try {
    // Verifica se l'email è già in uso da un altro utente
    const existingUser = await db.select().from(user).where(eq(user.email, data.email)).limit(1);

    if (existingUser.length > 0 && existingUser[0].id !== session.user.id) {
      throw new Error("Email is already in use by another user");
    }

    // Aggiorna il profilo dell'utente autenticato
    await db
      .update(user)
      .set({
        name: data.name,
        email: data.email,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id));

    // Revalida la pagina profilo
    revalidatePath("/dashboard/profile");

    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update profile");
  }
}
