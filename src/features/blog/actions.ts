"use server";

import { db } from "@/db";
import { post, user } from "@/db/schema";
import { createPostSchema, updatePostSchema } from "./schema";
import { getSession } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/emails/send";
import { PostPublishedTemplate } from "@/lib/emails/templates/blog/post-published";

/**
 * Server Action: Crea un nuovo blog post.
 * Richiede autenticazione.
 *
 * @throws Error se utente non autenticato
 * @throws ZodError se validazione fallisce
 */
export async function createPost(input: unknown) {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized: You must be logged in to create a post");
  }

  // Valida input
  const data = createPostSchema.parse(input);

  // Crea post
  const [newPost] = await db
    .insert(post)
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

  return { success: true, post: newPost };
}

/**
 * Server Action: Aggiorna un blog post esistente.
 * Richiede autenticazione e ownership del post.
 */
export async function updatePost(postId: string, input: unknown) {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized: You must be logged in to update a post");
  }

  // Verifica ownership
  const [existingPost] = await db.select().from(post).where(eq(post.id, postId)).limit(1);

  if (!existingPost) {
    throw new Error("Post not found");
  }

  if (existingPost.authorId !== session.user.id) {
    throw new Error("Unauthorized: You can only update your own posts");
  }

  // Valida input
  const data = updatePostSchema.parse(input);

  // Check if post is being published for the first time
  const wasUnpublished = !existingPost.published;
  const isNowPublished = data.published === true;
  const justPublished = wasUnpublished && isNowPublished;

  // Update post
  const [updatedPost] = await db
    .update(post)
    .set({
      ...data,
      publishedAt:
        data.published !== undefined
          ? data.published
            ? new Date()
            : null
          : existingPost.publishedAt,
    })
    .where(eq(post.id, postId))
    .returning();

  // Send email notification if post was just published
  if (justPublished) {
    try {
      // Get author info
      const [author] = await db
        .select()
        .from(user)
        .where(eq(user.id, existingPost.authorId))
        .limit(1);

      if (author?.email) {
        const NEXTAUTH_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const postUrl = `${NEXTAUTH_URL}/blog/${updatedPost.slug}`;

        await sendEmail({
          to: author.email,
          subject: "Your blog post has been published!",
          react: PostPublishedTemplate({
            authorName: author.name || "User",
            postTitle: updatedPost.title,
            postUrl,
            publishedBy: session.user.name || session.user.email || "Admin",
            publishedAt: updatedPost.publishedAt || new Date(),
          }),
        });
      }
    } catch (emailError) {
      // Don't block post update if email fails
      console.error("Post published notification email failed:", emailError);
    }
  }

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
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized: You must be logged in to delete a post");
  }

  // Verifica ownership
  const [existingPost] = await db.select().from(post).where(eq(post.id, postId)).limit(1);

  if (!existingPost) {
    throw new Error("Post not found");
  }

  if (existingPost.authorId !== session.user.id) {
    throw new Error("Unauthorized: You can only delete your own posts");
  }

  // Delete post
  await db.delete(post).where(eq(post.id, postId));

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
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const allPosts = await db
    .select()
    .from(post)
    .where(eq(post.authorId, session.user.id))
    .orderBy(desc(post.createdAt));

  return allPosts;
}
