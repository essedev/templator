import { z } from "zod";

/**
 * Schema validazione per aggiornamento profilo.
 * Condiviso tra client (React Hook Form) e server (Server Action).
 */
export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  email: z.string().email("Invalid email format").trim(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
