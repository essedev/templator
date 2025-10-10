import { z } from "zod";

/**
 * Schema validazione per creazione blog post.
 * Condiviso tra client (form) e server (Server Action).
 */
export const createPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(200, "Slug too long")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens"),
  excerpt: z.string().max(500, "Excerpt too long").optional(),
  content: z.string().min(10, "Content is required (min 10 characters)"),
  coverImage: z.string().url("Invalid URL").optional().or(z.literal("")),
  published: z.boolean().optional(),
});

/**
 * Schema validazione per update blog post.
 * Tutti i campi sono opzionali per permettere update parziali.
 */
export const updatePostSchema = createPostSchema.partial();

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
