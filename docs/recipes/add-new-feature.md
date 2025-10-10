# Recipe: Aggiungere una nuova feature

Template step-by-step per aggiungere una feature completa al progetto.

## Prerequisiti

- Setup completato (vedi SETUP.md)
- Database funzionante

## Step 1: Definisci la feature

**Esempio:** Feature "Comments" (commenti su blog post)

**Requisiti:**

- Ogni commento ha: autore (FK User), post (FK Post), content, status (pending/approved)
- Form per submit commento
- Server Action per creare/moderare commenti

## Step 2: Aggiorna schema Drizzle

**File:** `src/db/schema.ts`

```typescript
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Commento su un blog post.
 * Feature: comments system
 */
export const comments = pgTable("comment", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  /** FK → User.id (autore commento) */
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  /** FK → Post.id (post commentato) */
  postId: text("postId")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),

  /** Contenuto commento */
  content: text("content").notNull(),

  /** Status moderazione: "pending" | "approved" | "rejected" */
  status: text("status").notNull().default("pending"),

  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
```

**Applica migration:**

```bash
pnpm db:generate  # Genera migration
pnpm db:push      # Applica al database
```

## Step 3: Crea struttura feature

```bash
mkdir -p src/features/comments
touch src/features/comments/{schema.ts,actions.ts,CommentForm.tsx,CommentList.tsx,README.md}
```

## Step 4: Schema Zod

**File:** `src/features/comments/schema.ts`

```typescript
import { z } from "zod";

/**
 * Schema validazione form commento.
 * Condiviso tra client e server.
 */
export const commentSchema = z.object({
  postId: z.string().uuid(),
  content: z
    .string()
    .min(3, "Commento troppo corto (min 3 caratteri)")
    .max(500, "Commento troppo lungo (max 500 caratteri)"),
});

export type CommentFormData = z.infer<typeof commentSchema>;

/**
 * Schema per moderazione admin.
 */
export const moderateCommentSchema = z.object({
  commentId: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
});

export type ModerateCommentData = z.infer<typeof moderateCommentSchema>;
```

## Step 5: Server Actions

**File:** `src/features/comments/actions.ts`

```typescript
"use server";

import { db } from "@/db";
import { comments } from "@/db/schema";
import { commentSchema, moderateCommentSchema } from "./schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Crea un nuovo commento (richiede auth).
 */
export async function createComment(input: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Devi essere autenticato per commentare");
  }

  const data = commentSchema.parse(input);

  const [comment] = await db
    .insert(comments)
    .values({
      ...data,
      userId: session.user.id,
      status: "pending", // Richiede moderazione
    })
    .returning();

  revalidatePath(`/blog/${data.postId}`);

  return { success: true, comment };
}

/**
 * Modera un commento (solo admin).
 */
export async function moderateComment(input: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // TODO: Verifica che user sia admin
  // if (!session.user.role === "admin") throw new Error("Forbidden");

  const data = moderateCommentSchema.parse(input);

  const [updated] = await db
    .update(comments)
    .set({ status: data.status })
    .where(eq(comments.id, data.commentId))
    .returning();

  revalidatePath("/admin/comments");

  return { success: true, comment: updated };
}

/**
 * Elimina un commento (owner o admin).
 */
export async function deleteComment(commentId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Fetch comment per verificare ownership
  const [comment] = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);

  if (!comment) {
    throw new Error("Comment not found");
  }

  // Solo owner può eliminare
  if (comment.userId !== session.user.id) {
    throw new Error("Forbidden");
  }

  await db.delete(comments).where(eq(comments.id, commentId));

  revalidatePath("/blog");

  return { success: true };
}
```

## Step 6: Form Component

**File:** `src/features/comments/CommentForm.tsx`

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { commentSchema, type CommentFormData } from "./schema";
import { createComment } from "./actions";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CommentFormProps {
  postId: string;
}

export function CommentForm({ postId }: CommentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState, reset } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: { postId },
  });

  const onSubmit = async (data: CommentFormData) => {
    setIsSubmitting(true);

    try {
      await createComment(data);
      toast.success("Commento inviato! Sarà visibile dopo moderazione.");
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore invio commento");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register("postId")} />

      <div>
        <Textarea
          {...register("content")}
          placeholder="Scrivi un commento..."
          rows={4}
        />
        {formState.errors.content && (
          <p className="text-sm text-red-600 mt-1">
            {formState.errors.content.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Invio..." : "Invia Commento"}
      </Button>
    </form>
  );
}
```

## Step 7: Lista Comments (Server Component)

**File:** `src/features/comments/CommentList.tsx`

```typescript
import { db } from "@/db";
import { comments, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

interface CommentListProps {
  postId: string;
}

export async function CommentList({ postId }: CommentListProps) {
  // Fetch approved comments con author info
  const approvedComments = await db
    .select({
      comment: comments,
      author: users,
    })
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .where(and(eq(comments.postId, postId), eq(comments.status, "approved")))
    .orderBy(desc(comments.createdAt));

  if (approvedComments.length === 0) {
    return <p className="text-muted-foreground">Nessun commento ancora.</p>;
  }

  return (
    <div className="space-y-6">
      {approvedComments.map(({ comment, author }) => (
        <div key={comment.id} className="border-l-2 pl-4">
          <div className="flex items-center gap-2 mb-2">
            <p className="font-semibold">{author?.name || "Anonimo"}</p>
            <span className="text-sm text-muted-foreground">
              {new Date(comment.createdAt).toLocaleDateString("it-IT")}
            </span>
          </div>
          <p className="text-foreground whitespace-pre-wrap">{comment.content}</p>
        </div>
      ))}
    </div>
  );
}
```

## Step 8: Integrazione nella pagina blog

**File:** `src/app/blog/[slug]/page.tsx`

Aggiungi alla fine del post:

```typescript
import { CommentList } from "@/features/comments/CommentList";
import { CommentForm } from "@/features/comments/CommentForm";
import { auth } from "@/lib/auth";

// ... resto del componente

// Dopo il content del post:
<section className="mt-12 border-t pt-8">
  <h2 className="text-2xl font-bold mb-6">Commenti</h2>

  {/* Lista commenti */}
  <CommentList postId={post.id} />

  {/* Form (solo se autenticato) */}
  {session ? (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Lascia un commento</h3>
      <CommentForm postId={post.id} />
    </div>
  ) : (
    <p className="mt-8 text-muted-foreground">
      <a href="/login" className="underline">Accedi</a> per lasciare un commento.
    </p>
  )}
</section>
```

## Step 9: README della feature

**File:** `src/features/comments/README.md`

```markdown
# Comments Feature

Sistema di commenti con moderazione per blog posts.

## Componenti

- `CommentForm.tsx` - Form per creare commento (richiede auth)
- `CommentList.tsx` - Lista commenti approvati (Server Component)

## Server Actions

- `createComment()` - Crea commento (status: pending)
- `moderateComment()` - Approva/rifiuta commento (admin only)
- `deleteComment()` - Elimina commento (owner only)

## Features

- Moderazione: commenti pending di default
- Ownership: solo autore può eliminare
- Auth required: serve login per commentare

## Estendere

- Aggiungere reactions (like/dislike)
- Aggiungere risposte (threading)
- Notifiche email su nuovo commento
```

## Step 10: Validation Loop

```bash
pnpm format      # Format code
pnpm lint        # Check errors
pnpm typecheck   # Check types
pnpm build       # Test build
```

## Checklist completamento

- [x] Schema Drizzle aggiunto e migration applicata
- [x] Zod schemas per validazione
- [x] Server Actions con auth check
- [x] Form component funzionante
- [x] Lista comments funzionante
- [x] Integrazione nella pagina blog
- [x] README della feature
- [x] Validation loop verde

✅ Feature completa!
