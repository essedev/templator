import { z } from "zod";

/**
 * Schema validazione per aggiornamento ruolo utente.
 * Condiviso tra client e server per garantire type safety.
 */
export const updateUserRoleSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
  role: z.enum(["user", "editor", "admin"], {
    message: "Role must be user, editor, or admin",
  }),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
