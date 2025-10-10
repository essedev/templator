"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Dati per l'aggiornamento del profilo
 */
export interface UpdateProfileData {
  name: string;
  email: string;
}

/**
 * Server action per aggiornare il profilo dell'utente.
 * Ogni utente autenticato può aggiornare solo il proprio profilo.
 */
export async function updateProfile(data: UpdateProfileData) {
  const session = await auth();

  // Verifica che l'utente sia autenticato
  if (!session?.user) {
    throw new Error("Unauthorized: You must be logged in to update your profile");
  }

  // Validazione input
  if (!data.name?.trim()) {
    throw new Error("Name is required");
  }

  if (!data.email?.trim()) {
    throw new Error("Email is required");
  }

  // Validazione email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    throw new Error("Invalid email format");
  }

  try {
    // Verifica se l'email è già in uso da un altro utente
    const existingUser = await db.select().from(users).where(eq(users.email, data.email)).limit(1);

    if (existingUser.length > 0 && existingUser[0].id !== session.user.id) {
      throw new Error("Email is already in use by another user");
    }

    // Aggiorna il profilo dell'utente autenticato
    await db
      .update(users)
      .set({
        name: data.name.trim(),
        email: data.email.trim(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

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
