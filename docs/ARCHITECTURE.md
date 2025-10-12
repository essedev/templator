# Architecture

Comprehensive guide to Templator's project structure and conventions.

## Overview

Templator follows a **feature-based architecture** optimized for AI-assisted development. Every feature is self-contained with predictable structure and naming conventions.

## Project Structure

```
templator/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (routes)/          # Public routes
│   │   ├── dashboard/         # Protected dashboard
│   │   ├── api/auth/          # Better Auth API
│   │   ├── layout.tsx         # Root layout
│   │   └── providers.tsx      # Client providers
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── layout/            # Navbar, Footer, ThemeToggle
│   │   ├── auth/              # RBAC components
│   │   ├── dashboard/         # Dashboard components
│   │   └── common/            # Shared components
│   ├── features/              # Feature modules (see below)
│   ├── lib/                   # Core utilities
│   │   ├── auth.ts           # Better Auth config
│   │   ├── auth-client.ts    # Client auth hooks
│   │   ├── rbac.ts           # RBAC helpers
│   │   ├── permissions.ts    # Permission system
│   │   ├── password.ts       # PBKDF2 hashing
│   │   ├── emails/           # Email system
│   │   └── utils.ts          # Utility functions
│   ├── db/
│   │   ├── schema.ts         # Drizzle schema
│   │   └── index.ts          # Database client
│   ├── hooks/                # Custom React hooks
│   ├── types/                # TypeScript types
│   └── middleware.ts         # Auth middleware
├── docs/                     # Documentation
├── .claude/                  # Claude Code commands
└── public/                   # Static assets
```

## Feature-Based Architecture

### Standard Feature Structure

Every feature **must** follow this structure:

```
src/features/[feature-name]/
├── actions.ts       # Server Actions (named exports)
├── schema.ts        # Zod validation schemas
├── [Feature]*.tsx   # React components
└── README.md        # Feature documentation
```

**Example (contact feature):**

```
src/features/contact/
├── actions.ts           # sendContactMessage()
├── schema.ts            # contactSchema
├── ContactForm.tsx      # Form component
└── README.md            # Documentation
```

### Why Feature-Based?

1. **Predictable** - AI knows exactly where to find files
2. **Self-contained** - Each feature is independent
3. **Scalable** - Easy to add/remove features
4. **Maintainable** - Clear boundaries and responsibilities

## File Naming Conventions

### React Components

**Format:** `PascalCase.tsx`

```
✅ ContactForm.tsx
✅ UserProfile.tsx
✅ DashboardNav.tsx

❌ contactForm.tsx
❌ user-profile.tsx
```

### Utilities & Libraries

**Format:** `kebab-case.ts`

```
✅ auth-client.ts
✅ format-date.ts
✅ permissions.ts

❌ authClient.ts
❌ FormatDate.ts
```

### Route Folders

**Format:** `kebab-case/`

```
✅ app/blog-post/[slug]/page.tsx
✅ app/forgot-password/page.tsx

❌ app/blogPost/[slug]/page.tsx
❌ app/ForgotPassword/page.tsx
```

### Feature Folders

**Format:** `kebab-case/`

```
✅ features/user-profile/
✅ features/contact/

❌ features/userProfile/
❌ features/Contact/
```

## Import Conventions

### Always Use Absolute Imports

Use `@/` alias for all imports:

```typescript
// ✅ Correct
import { Button } from "@/components/ui/button";
import { subscribeNewsletter } from "@/features/newsletter/actions";
import { db } from "@/db";

// ❌ Wrong
import { Button } from "../../components/ui/button";
import { db } from "../db";
```

### Import Order

```typescript
// 1. External packages
import { z } from "zod";
import { eq } from "drizzle-orm";

// 2. Internal absolute imports (@/)
import { db } from "@/db";
import { user } from "@/db/schema";
import { Button } from "@/components/ui/button";

// 3. Relative imports (if necessary)
import { localHelper } from "./helpers";
```

## Component Patterns

### Server Component (Default)

```typescript
// app/blog/page.tsx
import { db } from "@/db";
import { post } from "@/db/schema";

export default async function BlogPage() {
  // Direct database query
  const posts = await db.select().from(post).where(eq(post.published, true));

  return <div>{/* Render posts */}</div>;
}
```

**When to use:**

- Default choice for all pages
- Data fetching from database
- SEO-sensitive content
- No client-side interactivity needed

### Client Component

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Counter() {
  const [count, setCount] = useState(0);

  return <Button onClick={() => setCount(count + 1)}>Count: {count}</Button>;
}
```

**When to use:**

- React hooks (useState, useEffect, etc.)
- Browser APIs (localStorage, window)
- Event handlers (onClick, onChange)
- Client-side routing (useRouter)

### Decision Tree

```
Need React hooks? → Client Component
Need browser APIs? → Client Component
Need event handlers? → Client Component
Otherwise → Server Component (default)
```

## Data Fetching Patterns

### 1. Server Components (Preferred)

```typescript
// app/dashboard/page.tsx
import { getSession } from "@/lib/auth";
import { db } from "@/db";

export default async function DashboardPage() {
  // Fetch directly in component
  const session = await getSession();
  const posts = await db.select().from(post);

  return <div>{/* Render */}</div>;
}
```

### 2. Server Actions (For Mutations)

```typescript
// features/blog/actions.ts
"use server";

import { db } from "@/db";
import { post } from "@/db/schema";

export async function createPost(data: CreatePostInput) {
  const newPost = await db.insert(post).values(data).returning();
  return newPost;
}
```

### 3. Client Hooks (When Necessary)

```typescript
"use client";

import { useSession } from "@/lib/auth-client";

export function UserProfile() {
  const { data: session, isPending } = useSession();

  if (isPending) return <div>Loading...</div>;
  return <div>{session?.user.name}</div>;
}
```

## State Management

### Priority Order

1. **Server Components** - No client state needed (preferred)
2. **useState** - Local component state
3. **Context** - Shared state (parent → children)
4. **Zustand** - Global persistent state (only if needed)

### Example Decision Tree

```
Data changes frequently? → useState
Shared between siblings? → Lift to parent + props
Shared across app? → Context
Needs persistence? → Zustand + localStorage
Server-side data? → Server Component (no state)
```

## Form Patterns

### Standard Form with Server Action

```typescript
// 1. Define schema (features/contact/schema.ts)
export const contactSchema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().email("Invalid email"),
  message: z.string().min(10, "Message too short"),
});

// 2. Create Server Action (features/contact/actions.ts)
"use server";

export async function sendContactMessage(input: unknown) {
  const data = contactSchema.parse(input);
  await db.insert(contactMessage).values(data);
}

// 3. Create Form Component (features/contact/ContactForm.tsx)
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export function ContactForm() {
  const form = useForm({
    resolver: zodResolver(contactSchema),
  });

  async function onSubmit(data: ContactFormData) {
    await sendContactMessage(data);
  }

  return <form onSubmit={form.handleSubmit(onSubmit)}>{/* Fields */}</form>;
}
```

## Route Protection

### Multi-Layer Security

**Layer 1: Middleware (Cookie Check)**

```typescript
// middleware.ts
// Only checks session cookie presence (< 1ms)
```

**Layer 2: Server Component (Full Validation)**

```typescript
// app/dashboard/users/page.tsx
import { requireAuth } from "@/lib/rbac";

export default async function UsersPage() {
  const session = await requireAuth(["admin"]);
  // Full RBAC validation happens here
}
```

**Layer 3: Server Action (Re-validation)**

```typescript
// features/users/actions.ts
"use server";

export async function deleteUser(userId: string) {
  const session = await requireAuth(["admin"]);
  // Always re-validate before mutation
}
```

## Database Conventions

### Schema Organization

```typescript
// src/db/schema.ts

// 1. Enums first
export const userRoleEnum = pgEnum("user_role", ["user", "editor", "admin"]);

// 2. Tables (auth tables, then business tables)
export const user = pgTable("user", {
  /* ... */
});
export const session = pgTable("session", {
  /* ... */
});
export const post = pgTable("post", {
  /* ... */
});
```

### Naming Convention

- **Tables:** `snake_case` (e.g., `contact_message`)
- **Columns:** `snake_case` (e.g., `created_at`)
- **Enums:** `snake_case` (e.g., `user_role`)

### Query Patterns

```typescript
// ✅ Good: Single query with joins
const posts = await db
  .select()
  .from(post)
  .leftJoin(user, eq(post.authorId, user.id))
  .where(eq(post.published, true));

// ❌ Bad: N+1 query problem
const posts = await db.select().from(post);
for (const post of posts) {
  post.author = await db.select().from(user).where(eq(user.id, post.authorId));
}
```

## TypeScript Best Practices

### Type Inference from Schemas

```typescript
// schema.ts
export const postSchema = z.object({
  title: z.string(),
  content: z.string(),
});

// Infer type automatically
export type Post = z.infer<typeof postSchema>;
```

### Type-Safe Database Queries

```typescript
// Drizzle provides full type inference
const posts = await db.select().from(post);
// posts: { id: string; title: string; ... }[]
```

### Avoid Type Assertions

```typescript
// ❌ Bad
const user = data as User;

// ✅ Good
const user = userSchema.parse(data);
```

## Performance Considerations

### Image Optimization

```typescript
import Image from "next/image";

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority // For above-fold images
/>;
```

### Dynamic Imports

```typescript
// For heavy client components
const HeavyChart = dynamic(() => import("@/components/HeavyChart"), {
  ssr: false,
  loading: () => <Skeleton />,
});
```

### Database Indexes

```typescript
// Add indexes for frequently queried columns
indexes: {
  publishedIdx: index("post_published_idx").on(post.published, post.publishedAt),
}
```

## Error Handling

### Server Actions

```typescript
"use server";

export async function createPost(input: unknown) {
  try {
    const data = postSchema.parse(input);
    const result = await db.insert(post).values(data).returning();
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Validation failed", issues: error.issues };
    }
    return { success: false, error: "Failed to create post" };
  }
}
```

### Client Components

```typescript
"use client";

export function ContactForm() {
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(data: ContactFormData) {
    try {
      await sendContactMessage(data);
      toast.success("Message sent!");
    } catch (err) {
      setError("Failed to send message");
    }
  }
}
```

## Related Documentation

- **Feature patterns:** `src/features/*/README.md`
- **Step-by-step guides:** `docs/recipes/`
- **Authentication:** `docs/AUTHENTICATION.md`
- **RBAC system:** `docs/RBAC.md`
- **AI workflow:** `docs/AI_WORKFLOW.md`
