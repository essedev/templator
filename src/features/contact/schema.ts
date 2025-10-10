import { z } from "zod";

/**
 * Schema validazione contact form.
 * Condiviso tra client (React Hook Form) e server (Server Action).
 */
export const contactSchema = z.object({
  name: z.string().min(1, "Nome richiesto"),
  email: z.string().email("Email non valida"),
  message: z.string().min(10, "Messaggio troppo corto (minimo 10 caratteri)"),
});

export type ContactFormData = z.infer<typeof contactSchema>;
