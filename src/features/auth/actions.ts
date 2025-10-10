"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { registerSchema } from "./schema";

/**
 * Server Action: registra nuovo utente.
 *
 * @param input - Dati form registrazione (validati con Zod)
 * @returns Success state o errore
 */
export async function registerUser(input: unknown) {
  try {
    // Valida input con Zod
    const data = registerSchema.parse(input);

    // Verifica se utente esiste già
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (existingUser) {
      return {
        success: false,
        error: "Email già registrata",
      };
    }

    // Crea nuovo utente
    // NOTA: In produzione, usa bcrypt per hashare la password
    const [user] = await db
      .insert(users)
      .values({
        name: data.name,
        email: data.email,
        password: data.password, // TODO: hash con bcrypt
      })
      .returning();

    return {
      success: true,
      userId: user.id,
    };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: "Errore durante la registrazione",
    };
  }
}
