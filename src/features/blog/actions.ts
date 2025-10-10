"use server";

import { db } from "@/db";
import { posts } from "@/db/schema";
import { createPostSchema, updatePostSchema } from "./schema";
import { auth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Server Action: Crea un nuovo blog post.
 * Richiede autenticazione.
 *
 * @throws Error se utente non autenticato
 * @throws ZodError se validazione fallisce
 */
export async function createPost(input: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized: You must be logged in to create a post");
  }

  // Valida input
  const data = createPostSchema.parse(input);

  // Crea post
  const [post] = await db
    .insert(posts)
    .values({
      ...data,
      published: data.published ?? false,
      authorId: session.user.id,
      publishedAt: data.published ? new Date() : null,
    })
    .returning();

  // Revalidate cache
  revalidatePath("/blog");
  revalidatePath("/admin/blog");

  return { success: true, post };
}

/**
 * Server Action: Aggiorna un blog post esistente.
 * Richiede autenticazione e ownership del post.
 */
export async function updatePost(postId: string, input: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized: You must be logged in to update a post");
  }

  // Verifica ownership
  const [existingPost] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);

  if (!existingPost) {
    throw new Error("Post not found");
  }

  if (existingPost.authorId !== session.user.id) {
    throw new Error("Unauthorized: You can only update your own posts");
  }

  // Valida input
  const data = updatePostSchema.parse(input);

  // Update post
  const [updatedPost] = await db
    .update(posts)
    .set({
      ...data,
      publishedAt:
        data.published !== undefined
          ? data.published
            ? new Date()
            : null
          : existingPost.publishedAt,
    })
    .where(eq(posts.id, postId))
    .returning();

  // Revalidate cache
  revalidatePath("/blog");
  revalidatePath(`/blog/${updatedPost.slug}`);
  revalidatePath("/admin/blog");

  return { success: true, post: updatedPost };
}

/**
 * Server Action: Elimina un blog post.
 * Richiede autenticazione e ownership del post.
 */
export async function deletePost(postId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized: You must be logged in to delete a post");
  }

  // Verifica ownership
  const [existingPost] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);

  if (!existingPost) {
    throw new Error("Post not found");
  }

  if (existingPost.authorId !== session.user.id) {
    throw new Error("Unauthorized: You can only delete your own posts");
  }

  // Delete post
  await db.delete(posts).where(eq(posts.id, postId));

  // Revalidate cache
  revalidatePath("/blog");
  revalidatePath("/admin/blog");

  return { success: true };
}

/**
 * Server Action: Ottieni tutti i post (per admin).
 * Richiede autenticazione.
 */
export async function getPostsForAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const allPosts = await db
    .select()
    .from(posts)
    .where(eq(posts.authorId, session.user.id))
    .orderBy(desc(posts.createdAt));

  return allPosts;
}
