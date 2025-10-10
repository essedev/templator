import { z } from "zod";

/**
 * Schema validazione registrazione utente.
 * Condiviso tra client (form validation) e server (Server Action).
 */
export const registerSchema = z.object({
  name: z.string().min(1, "Nome richiesto"),
  email: z.string().email("Email non valida"),
  password: z.string().min(8, "Password deve essere almeno 8 caratteri"),
});

/**
 * Schema validazione login utente.
 */
export const loginSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(1, "Password richiesta"),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
