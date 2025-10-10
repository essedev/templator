"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { registerSchema } from "./schema";
import { hashPassword } from "@/lib/password";
import { sendVerificationEmail } from "./email-actions";

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

    // Hash password con PBKDF2 (Web Crypto API - compatible with Cloudflare Workers)
    const hashedPassword = await hashPassword(data.password);

    // Crea nuovo utente
    const [user] = await db
      .insert(users)
      .values({
        name: data.name,
        email: data.email,
        password: hashedPassword,
      })
      .returning();

    // Invia email di verifica
    await sendVerificationEmail(user.id);

    return {
      success: true,
      userId: user.id,
      message: "Registration successful! Please check your email to verify your account.",
    };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: "Errore durante la registrazione",
    };
  }
}
