"use server";

import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { newsletterSchema } from "./schema";
import { eq } from "drizzle-orm";
import { sendEmail, newsletterWelcomeEmailTemplate } from "@/lib/email";
import { z } from "zod";

/**
 * Server Action: iscrizione alla newsletter.
 *
 * Flow:
 * 1. Valida email con Zod
 * 2. Verifica se già iscritto
 * 3. Salva subscriber su database
 * 4. Invia email di benvenuto (se configurata)
 *
 * @param input - Email da validare
 * @returns Success state
 */
export async function subscribeToNewsletter(input: unknown) {
  try {
    // 1. Valida input
    const data = newsletterSchema.parse(input);

    // 2. Verifica se già iscritto
    const [existing] = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, data.email))
      .limit(1);

    if (existing) {
      if (existing.status === "active") {
        return {
          success: false,
          error: "Sei già iscritto alla newsletter!",
        };
      }

      // Ri-attiva se era disiscritto
      await db
        .update(newsletterSubscribers)
        .set({
          status: "active",
          subscribedAt: new Date(),
          unsubscribedAt: null,
        })
        .where(eq(newsletterSubscribers.email, data.email));

      return {
        success: true,
        message: "Iscrizione riattivata con successo!",
      };
    }

    // 3. Crea nuovo subscriber
    await db.insert(newsletterSubscribers).values({
      email: data.email,
      status: "active",
    });

    // 4. Invia email di benvenuto (mock by default)
    try {
      const emailPayload = newsletterWelcomeEmailTemplate(data.email);
      await sendEmail(emailPayload);
    } catch (emailError) {
      // Non bloccare se email fallisce
      console.error("Welcome email failed:", emailError);
    }

    return {
      success: true,
      message: "Grazie per esserti iscritto!",
    };
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return {
      success: false,
      error: "Errore durante l'iscrizione. Riprova più tardi.",
    };
  }
}

/**
 * Server Action: disiscrizione dalla newsletter.
 *
 * @param email - Email da disiscrivere
 */
export async function unsubscribeFromNewsletter(email: string) {
  try {
    const emailSchema = z.string().email();
    const validatedEmail = emailSchema.parse(email);

    const [existing] = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, validatedEmail))
      .limit(1);

    if (!existing) {
      return {
        success: false,
        error: "Email non trovata.",
      };
    }

    await db
      .update(newsletterSubscribers)
      .set({
        status: "unsubscribed",
        unsubscribedAt: new Date(),
      })
      .where(eq(newsletterSubscribers.email, validatedEmail));

    return {
      success: true,
      message: "Disiscrizione completata.",
    };
  } catch (error) {
    console.error("Newsletter unsubscribe error:", error);
    return {
      success: false,
      error: "Errore durante la disiscrizione.",
    };
  }
}
