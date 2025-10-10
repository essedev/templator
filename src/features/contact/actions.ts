"use server";

import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { contactSchema } from "./schema";
import { sendEmail, contactFormEmailTemplate } from "@/lib/email";

/**
 * Server Action: salva messaggio di contatto e notifica admin.
 *
 * Flow:
 * 1. Valida input con Zod
 * 2. Salva messaggio su database
 * 3. Invia email notifica all'admin (se configurata)
 *
 * @param input - Dati form validati con Zod
 * @returns Success state
 */
export async function sendContactMessage(input: unknown) {
  try {
    // 1. Valida input
    const data = contactSchema.parse(input);

    // 2. Salva su database
    await db.insert(contactMessages).values({
      name: data.name,
      email: data.email,
      message: data.message,
    });

    // 3. Notifica admin (mock by default, vedi src/lib/email.ts)
    try {
      const emailPayload = contactFormEmailTemplate(data);
      await sendEmail(emailPayload);
    } catch (emailError) {
      // Non bloccare se email fallisce
      console.error("Email notification failed:", emailError);
    }

    return {
      success: true,
      message: "Messaggio inviato con successo!",
    };
  } catch (error) {
    console.error("Contact form error:", error);
    return {
      success: false,
      error: "Errore durante l'invio. Riprova più tardi.",
    };
  }
}
