# Esempi pratici

## Drizzle client setup

**File: `src/db/index.ts`**

```typescript
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

/**
 * Drizzle client per Neon PostgreSQL.
 * Edge-ready e serverless-friendly.
 */
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
```

## Schema Drizzle (con commenti per AI)

**File: `src/db/schema.ts`**

```typescript
import { pgTable, text, timestamp, integer, primaryKey, boolean, pgEnum } from "drizzle-orm/pg-core";

// ============================================
// AUTH TABLES (richiesti da NextAuth)
// ============================================

/**
 * User roles enum for RBAC system
 */
export const userRoleEnum = pgEnum("user_role", ["user", "editor", "admin"]);

/**
 * Utente del sistema. Gestito da NextAuth.
 * Relazioni: sessions, accounts
 * RBAC: role field per permission system
 */
export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  password: text("password"),
  role: userRoleEnum("role").notNull().default("user"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/**
 * Account OAuth collegato a un utente.
 * Supporta multiple providers per user
 */
export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

/**
 * Sessione utente.
 * NextAuth gestisce automaticamente scadenza
 */
export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/**
 * Verification tokens per email verification
 */
export const verificationTokens = pgTable(
  "verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({
      columns: [vt.identifier, vt.token],
    }),
  })
);

// ============================================
// BUSINESS TABLES (esempi feature comuni)
// ============================================

/**
 * Messaggio di contatto dal form pubblico.
 * Feature: contact form (marketing site)
 */
export const contactMessages = pgTable("contact_message", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

/**
 * Newsletter subscription.
 * Feature: newsletter signup (footer/popup)
 */
export const newsletterSubscribers = pgTable("newsletter_subscriber", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  status: text("status").notNull().default("active"), // active, unsubscribed
  subscribedAt: timestamp("subscribedAt", { mode: "date" }).notNull().defaultNow(),
  unsubscribedAt: timestamp("unsubscribedAt", { mode: "date" }),
});

/**
 * Blog posts with draft/publish workflow.
 * Feature: blog system with RBAC (editor/admin only)
 */
export const posts = pgTable("post", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  coverImage: text("coverImage"),
  authorId: text("authorId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("publishedAt", { mode: "date" }),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
```

## NextAuth v5 setup

**File: `src/lib/auth.ts`**

```typescript
import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Config NextAuth v5.
 * Integrazione con Drizzle per persistenza session/user.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1);

        if (!user || !user.password) {
          return null;
        }

        // Simple password check (in production, use proper hashing like bcrypt)
        const passwordMatch = user.password === credentials.password;

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
    // Add OAuth providers here:
    // GitHub({
    //   clientId: process.env.GITHUB_CLIENT_ID,
    //   clientSecret: process.env.GITHUB_CLIENT_SECRET,
    // }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
```

**File: `src/app/api/auth/[...nextauth]/route.ts`**

```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

## Feature: Contact Form (pattern completo)

### Schema Zod (condiviso)

**File: `src/features/contact/schema.ts`**

```typescript
import { z } from "zod";

/**
 * Schema validazione contact form.
 * Condiviso tra client (React Hook Form) e server (Server Action).
 */
export const contactSchema = z.object({
  name: z.string().min(1, "Nome richiesto"),
  email: z.string().email("Email non valida"),
  message: z.string().min(10, "Messaggio troppo corto (min 10 caratteri)"),
});

export type ContactFormData = z.infer<typeof contactSchema>;
```

### Server Action

**File: `src/features/contact/actions.ts`**

```typescript
"use server";

import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { contactSchema } from "./schema";

/**
 * Server Action: salva messaggio di contatto su DB.
 * Validazione schema Zod lato server (sicurezza).
 *
 * @throws ZodError se validazione fallisce
 */
export async function sendContactMessage(input: unknown) {
  // Parse + validate input
  const data = contactSchema.parse(input);

  // Salva su DB con Drizzle
  await db.insert(contactMessages).values(data);

  // TODO: invia email notifica admin (opzionale)
  // await sendEmail({ to: "admin@example.com", ... });

  return { success: true };
}
```

### Form client

**File: `src/features/contact/ContactForm.tsx`**

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sendContactMessage } from "./actions";
import { contactSchema, type ContactFormData } from "./schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";

/**
 * Form di contatto con validazione client + server.
 * Pattern: React Hook Form + Zod + Server Action.
 */
export function ContactForm() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState, reset } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      setError(null);
      await sendContactMessage(data);
      setSuccess(true);
      reset();
    } catch (err) {
      setError("Errore invio messaggio. Riprova.");
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input
          placeholder="Nome"
          {...register("name")}
          aria-label="Nome"
        />
        {formState.errors.name && (
          <p className="text-sm text-red-600 mt-1">
            {formState.errors.name.message}
          </p>
        )}
      </div>

      <div>
        <Input
          type="email"
          placeholder="Email"
          {...register("email")}
          aria-label="Email"
        />
        {formState.errors.email && (
          <p className="text-sm text-red-600 mt-1">
            {formState.errors.email.message}
          </p>
        )}
      </div>

      <div>
        <Textarea
          placeholder="Messaggio"
          rows={5}
          {...register("message")}
          aria-label="Messaggio"
        />
        {formState.errors.message && (
          <p className="text-sm text-red-600 mt-1">
            {formState.errors.message.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={formState.isSubmitting}
        className="w-full"
      >
        {formState.isSubmitting ? "Invio..." : "Invia Messaggio"}
      </Button>

      {success && (
        <p className="text-sm text-green-600">
          ✓ Messaggio inviato con successo!
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600">
          ✗ {error}
        </p>
      )}
    </form>
  );
}
```

## Providers (ThemeProvider + React Query opzionale)

**File: `src/app/providers.tsx`**

```typescript
"use client";

import { ThemeProvider } from "next-themes";
// Decommentare se usi React Query:
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { useState } from "react";

/**
 * Client providers (ThemeProvider + opzionalmente React Query).
 * Wrappa l'app in layout.tsx.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // Decommentare se usi React Query:
  // const [queryClient] = useState(() => new QueryClient({
  //   defaultOptions: {
  //     queries: {
  //       staleTime: 60 * 1000, // 1min
  //       refetchOnWindowFocus: false,
  //     },
  //   },
  // }));

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {/* {React Query wrapper (opzionale)} */}
      {/* <QueryClientProvider client={queryClient}> */}
        {children}
      {/* </QueryClientProvider> */}
    </ThemeProvider>
  );
}
```

## Root Layout

**File: `src/app/layout.tsx`**

```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "My App",
  description: "Built with T3 Template",
};

/**
 * Root layout dell'app.
 * Include providers, navbar, footer globali.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
```

## Esempio Server Component con data fetching

**File: `src/app/contact/page.tsx`**

```typescript
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { desc } from "drizzle-orm";

/**
 * Server Component: fetch dati direttamente (no useState, no useEffect).
 * Next.js cache automaticamente (revalidate ogni 60s).
 */
export const revalidate = 60;

export default async function ContactMessagesPage() {
  // Fetch diretto in Server Component con Drizzle
  const messages = await db
    .select()
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt))
    .limit(10);

  return (
    <div className="container py-12">
      <h1 className="text-4xl font-bold mb-8">Contact Messages</h1>

      <div className="grid gap-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className="p-6 border rounded-lg hover:border-foreground transition"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold">{message.name}</h3>
                <p className="text-sm text-muted-foreground">{message.email}</p>
              </div>
              <time className="text-sm text-muted-foreground">
                {new Date(message.createdAt).toLocaleDateString("it-IT")}
              </time>
            </div>
            <p className="text-muted-foreground mt-4 whitespace-pre-wrap">
              {message.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## RBAC Examples (Role-Based Access Control)

### Server Component with RoleGate

**File: `src/app/dashboard/blog/page.tsx`**

```typescript
import { RoleGate } from "@/components/auth";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { desc } from "drizzle-orm";

export default async function BlogManagementPage() {
  const allPosts = await db.select().from(posts).orderBy(desc(posts.createdAt));

  return (
    <RoleGate allowedRoles={["editor", "admin"]}>
      <div className="container py-12">
        <h1 className="text-4xl font-bold mb-8">Blog Management</h1>
        <div className="grid gap-4">
          {allPosts.map((post) => (
            <div key={post.id} className="p-4 border rounded">
              <h2>{post.title}</h2>
              <p className="text-sm text-muted-foreground">
                {post.published ? "Published" : "Draft"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </RoleGate>
  );
}
```

### Server Action with Permission Check

**File: `src/features/blog/actions.ts`**

```typescript
"use server";

import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function deletePost(postId: string) {
  const session = await auth();

  // Check permission
  if (!can(session, "manage_blog")) {
    throw new Error("Unauthorized: manage_blog permission required");
  }

  await db.delete(posts).where(eq(posts.id, postId));

  return { success: true };
}
```

### Client Component with RoleGateClient

**File: `src/components/dashboard/DashboardNav.tsx`**

```typescript
"use client";

import { RoleGateClient } from "@/components/auth";
import Link from "next/link";

export function DashboardNav() {
  return (
    <nav className="space-y-2">
      {/* All authenticated users */}
      <Link href="/dashboard" className="block p-2 hover:bg-muted rounded">
        Overview
      </Link>
      <Link href="/dashboard/profile" className="block p-2 hover:bg-muted rounded">
        Profile
      </Link>

      {/* Editor and Admin only */}
      <RoleGateClient allowedRoles={["editor", "admin"]}>
        <Link href="/dashboard/blog" className="block p-2 hover:bg-muted rounded">
          Blog
        </Link>
        <Link href="/dashboard/newsletter" className="block p-2 hover:bg-muted rounded">
          Newsletter
        </Link>
      </RoleGateClient>

      {/* Admin only */}
      <RoleGateClient allowedRoles={["admin"]}>
        <Link href="/dashboard/users" className="block p-2 hover:bg-muted rounded">
          Users
        </Link>
      </RoleGateClient>
    </nav>
  );
}
```

## Blog System Example

### Create Post (Server Action)

**File: `src/features/blog/actions.ts`**

```typescript
"use server";

import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { postSchema } from "./schema";

export async function createPost(input: unknown) {
  const session = await auth();

  if (!can(session, "manage_blog")) {
    throw new Error("Unauthorized");
  }

  const data = postSchema.parse(input);
  const slug = data.title.toLowerCase().replace(/\s+/g, "-");

  const [newPost] = await db
    .insert(posts)
    .values({
      ...data,
      slug,
      authorId: session!.user!.id,
      publishedAt: data.published ? new Date() : null,
    })
    .returning();

  return newPost;
}
```

### Public Blog Page (Server Component)

**File: `src/app/blog/[slug]/page.tsx`**

```typescript
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const [post] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.slug, params.slug), eq(posts.published, true)))
    .limit(1);

  if (!post) {
    notFound();
  }

  return (
    <article className="container py-12 max-w-3xl">
      <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
      {post.excerpt && <p className="text-xl text-muted-foreground mb-8">{post.excerpt}</p>}
      <div className="prose dark:prose-invert max-w-none">{post.content}</div>
    </article>
  );
}
```
