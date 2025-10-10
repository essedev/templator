# Recipe: Aggiungere un API endpoint

Template step-by-step per creare route handlers (API endpoints) in Next.js.

## Quando usare API Routes vs Server Actions

### Usa **Server Actions** quando:

- Form submission
- Operazioni CRUD semplici
- Chiamate da componenti React

### Usa **API Routes** quando:

- Endpoint pubblici (mobile app, webhook, integrazione esterna)
- Response non-JSON (file download, streaming, immagini)
- Rate limiting / middleware complessi
- REST API per third-party

## Pattern 1: Endpoint pubblico (GET)

**Use case:** API per fetch dati da app mobile, integrazione esterna.

### Step 1: Crea route handler

**File:** `src/app/api/posts/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { posts, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/posts
 * Fetch lista post pubblici.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Fetch published posts con author info
    const publishedPosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        excerpt: posts.excerpt,
        slug: posts.slug,
        createdAt: posts.createdAt,
        author: {
          name: users.name,
          image: users.image,
        },
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.published, true))
      .orderBy(desc(posts.createdAt))
      .limit(Math.min(limit, 100)) // Max 100
      .offset(offset);

    // Count total
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(eq(posts.published, true));

    return NextResponse.json({
      data: publishedPosts,
      pagination: {
        limit,
        offset,
        total: count,
      },
    });
  } catch (error) {
    console.error("GET /api/posts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**Import necessari:**

```typescript
import { sql } from "drizzle-orm";
```

**Test:**

```bash
curl http://localhost:3000/api/posts?limit=5
```

## Pattern 2: Endpoint protetto (POST)

**Use case:** Crea risorsa, richiede autenticazione.

### Step 1: Schema Zod

**File:** `src/lib/validations/api.ts`

```typescript
import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(10),
  published: z.boolean().default(false),
});
```

### Step 2: Route handler con auth

**File:** `src/app/api/posts/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { createPostSchema } from "@/lib/validations/api";
import { z } from "zod";

// ... GET handler sopra

/**
 * POST /api/posts
 * Crea nuovo post (richiede auth).
 */
export async function POST(req: NextRequest) {
  try {
    // Check auth
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse e valida body
    const body = await req.json();
    const data = createPostSchema.parse(body);

    // Generate slug
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Create post
    const [post] = await db
      .insert(posts)
      .values({
        ...data,
        slug,
        authorId: session.user.id,
      })
      .returning();

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("POST /api/posts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**Test:**

```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -H "Cookie: [session-cookie]" \
  -d '{"title":"My Post","content":"Hello world","published":true}'
```

## Pattern 3: Dynamic route (GET by ID)

**File:** `src/app/api/posts/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { posts, users } from "@/db/schema";
import { eq } from "drizzle-orm";

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * GET /api/posts/:id
 * Fetch singolo post.
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id } = context.params;

    const [postData] = await db
      .select({
        post: posts,
        author: users,
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.id, id))
      .limit(1);

    if (!postData) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(postData);
  } catch (error) {
    console.error(`GET /api/posts/${context.params.id} error:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

## Pattern 4: Update endpoint (PUT/PATCH)

**File:** `src/app/api/posts/[id]/route.ts`

```typescript
/**
 * PATCH /api/posts/:id
 * Aggiorna post (solo owner).
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = context.params;

    // Verifica ownership
    const [existingPost] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (existingPost.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse body (partial update)
    const body = await req.json();
    const updateSchema = createPostSchema.partial();
    const data = updateSchema.parse(body);

    // Update post
    const [updatedPost] = await db.update(posts).set(data).where(eq(posts.id, id)).returning();

    return NextResponse.json(updatedPost);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error(`PATCH /api/posts/${context.params.id} error:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

## Pattern 5: Delete endpoint (DELETE)

```typescript
/**
 * DELETE /api/posts/:id
 * Elimina post (solo owner).
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = context.params;

    // Verifica ownership
    const [existingPost] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (existingPost.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete post
    await db.delete(posts).where(eq(posts.id, id));

    return NextResponse.json({ success: true, message: "Post deleted" }, { status: 200 });
  } catch (error) {
    console.error(`DELETE /api/posts/${context.params.id} error:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

## Pattern 6: Webhook endpoint (POST)

**Use case:** Ricevi notifiche da servizio esterno (Stripe, GitHub, ecc.).

**File:** `src/app/api/webhooks/stripe/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";

/**
 * POST /api/webhooks/stripe
 * Webhook handler per eventi Stripe.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Verifica signature (Stripe example)
    // const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    // Process event
    // switch (event.type) {
    //   case "payment_intent.succeeded":
    //     await handlePaymentSuccess(event.data.object);
    //     break;
    // }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 400 });
  }
}
```

## Best Practices

### 1. Error handling consistente

Crea un helper per risposte standardizzate:

**File:** `src/lib/api-response.ts`

```typescript
import { NextResponse } from "next/server";

export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
```

### 2. Rate limiting (opzionale)

Installa:

```bash
pnpm add @upstash/ratelimit @upstash/redis
```

**File:** `src/lib/rate-limit.ts`

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});
```

Usa nel route handler:

```typescript
const identifier = req.headers.get("x-forwarded-for") || "anonymous";
const { success } = await ratelimit.limit(identifier);

if (!success) {
  return NextResponse.json({ error: "Too many requests" }, { status: 429 });
}
```

### 3. CORS headers (se necessario)

```typescript
export async function GET(req: NextRequest) {
  // ... logica

  return NextResponse.json(data, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
```

### 4. Request logging

```typescript
export async function POST(req: NextRequest) {
  const start = Date.now();

  try {
    // ... logica
    return response;
  } finally {
    console.log(`${req.method} ${req.url} - ${Date.now() - start}ms`);
  }
}
```

## Checklist

- [ ] Route handler creato in `src/app/api/[path]/route.ts`
- [ ] Schema Zod per validation (se POST/PUT)
- [ ] Auth check (se endpoint protetto)
- [ ] Error handling con try/catch
- [ ] Status codes corretti (200, 201, 400, 401, 403, 404, 500)
- [ ] Logging errori
- [ ] Test con curl/Postman

## Troubleshooting

**Errore: "Headers already sent"**
→ Assicurati di fare return su tutti i NextResponse

**Auth non funziona**
→ Usa `await auth()` invece di `auth.api.getSession()` in NextAuth v5

**CORS error**
→ Aggiungi headers CORS nella response

✅ API endpoint implementato!
