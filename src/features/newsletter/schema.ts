import { z } from "zod";

/**
 * Schema validazione newsletter signup.
 */
export const newsletterSchema = z.object({
  email: z.string().email("Email non valida"),
});

export type NewsletterFormData = z.infer<typeof newsletterSchema>;
