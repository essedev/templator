# Known Limitations & Design Constraints

Complete guide to Templator's conscious trade-offs, technical limitations, and migration paths.

## Table of Contents

- [Philosophy](#philosophy)
- [Technical Limitations](#technical-limitations)
- [Cloudflare Workers Constraints](#cloudflare-workers-constraints)
- [Feature Gaps (Intentional)](#feature-gaps-intentional)
- [Scaling Considerations](#scaling-considerations)
- [Decision Matrix](#decision-matrix)
- [Migration Paths](#migration-paths)

## Philosophy

Templator optimizes for:

1. **Time to first deploy** (< 1 hour from clone to production)
2. **AI-assisted development** (predictable patterns, type-safe)
3. **Edge deployment** (Cloudflare Workers constraints)
4. **MVP focus** (defer complexity until business validated)

This means conscious trade-offs between **completeness** and **simplicity**.

## Technical Limitations

### Testing Infrastructure

**Current State**: No testing framework, no test files.

**What's Missing**:

- Unit tests (Vitest, Jest)
- Integration tests (Testing Library)
- E2E tests (Playwright, Cypress)
- Code coverage tools

**Rationale**:

- TypeScript strict mode + ESLint catch ~70% of bugs at compile time
- 90% of MVPs ship without tests initially
- Testing infrastructure adds ~20% overhead to development time
- Can be added incrementally when product-market fit validated

**When to Add**:

- ✅ Before first paying customers
- ✅ When team grows beyond 3 developers
- ✅ When refactoring critical business logic
- ✅ Before Series A fundraising (investors check this)

**Migration Path**:

```bash
# 1. Install testing dependencies
pnpm add -D vitest @testing-library/react @testing-library/jest-dom happy-dom

# 2. Create vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

# 3. Start with critical features
# Test auth, RBAC, payment logic first
# Test Server Actions, not UI components initially
```

**Recommended Testing Strategy**:

1. **Week 1**: Server Actions (auth, CRUD operations)
2. **Week 2**: RBAC permission checks
3. **Week 3**: Form validation logic
4. **Week 4**: UI components (if needed)

**Cost-Benefit Analysis**:

- MVP without tests: Ship in 1 week, 30% chance of critical bug
- MVP with full tests: Ship in 2 weeks, 5% chance of critical bug
- **Decision**: Ship fast, fix bugs, add tests when revenue > $1k/mo

### Error Monitoring

**Current State**: No error tracking, console.log only.

**What's Missing**:

- Error tracking (Sentry, Axiom, Rollbar)
- Performance monitoring (Web Vitals)
- User session replays
- Alert notifications

**Rationale**:

- Adds monthly cost ($10-50/mo)
- Requires setup and configuration
- Most critical errors discovered during manual testing
- Edge workers have built-in logging (Cloudflare dashboard)

**When to Add**:

- ✅ Week 1 of production traffic
- ✅ When you can't reproduce bugs locally
- ✅ When users report errors you can't see
- ✅ When traffic > 1,000 requests/day

**Migration Path**:

**Option A: Axiom (Best for Cloudflare)**

```bash
# 1. Install Axiom
pnpm add @axiom-js/js

# 2. Add to server actions (src/lib/logger.ts)
import { AxiomWithoutBatching } from '@axiom-js/js';

export const axiom = new AxiomWithoutBatching({
  token: process.env.AXIOM_TOKEN!,
  dataset: process.env.AXIOM_DATASET || 'templator',
});

export async function logError(error: Error, context?: Record<string, unknown>) {
  axiom.ingest('errors', [{
    message: error.message,
    stack: error.stack,
    ...context,
    timestamp: new Date().toISOString(),
  }]);
  await axiom.flush();
}

# 3. Use in Server Actions
try {
  await db.insert(user).values(data);
} catch (error) {
  await logError(error as Error, { action: 'createUser', userId });
  throw error;
}
```

**Option B: Sentry**

```bash
pnpm add @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
# Follow wizard prompts
```

**Cost Comparison**:

- Axiom: $25/mo (100GB logs) - best for Cloudflare
- Sentry: $26/mo (5k errors) - better error grouping
- Cloudflare Logs: Free (limited retention) - basic debugging

### Database Migration Strategy

**Current State**: Using `drizzle-kit push` (direct schema sync).

**Limitation**:

- No migration history
- Risky rollbacks in production
- No team collaboration on schema changes
- Can't preview SQL before applying

**Rationale**:

- Faster iteration during MVP development
- No migration files to manage
- Schema changes take seconds, not minutes
- Good enough for single-developer teams

**When to Switch**:

- ✅ Before production launch with real users
- ✅ When team has multiple developers
- ✅ When you need to review SQL before applying
- ✅ When you need rollback capability

**Migration Path**:

```bash
# 1. Generate initial migration from current schema
pnpm db:generate
# Creates: drizzle/0000_initial_schema.sql

# 2. Review the SQL file
cat drizzle/0000_initial_schema.sql

# 3. Apply to production (replaces db:push)
pnpm db:migrate

# 4. Update package.json scripts
{
  "db:migrate": "drizzle-kit migrate",
  "db:migrate:generate": "drizzle-kit generate",
  // Remove db:push for production
}

# 5. Future changes workflow
# - Edit src/db/schema.ts
# - pnpm db:migrate:generate (generates SQL file)
# - Review SQL file in drizzle/
# - pnpm db:migrate (applies to database)
```

**Migration Best Practices**:

- Always review generated SQL before applying
- Test migrations on staging database first
- Keep migration files in version control
- Never edit applied migrations (create new ones)

### Rate Limiting Scope

**Current State**: Global rate limit (100 requests per 60 seconds).

**Limitation**:

- Not per-endpoint (same limit for login and homepage)
- Not per-user-tier (free users same as paid)
- No different limits for authenticated vs anonymous
- Database storage (adds latency ~5-10ms per request)

**Rationale**:

- Simple implementation (one rate limit rule)
- Better Auth handles it automatically
- Database storage works on edge (no in-memory state)
- Good enough to prevent brute force attacks

**When to Extend**:

- ✅ When you have paid tiers (premium users need higher limits)
- ✅ When specific endpoints are abused (e.g., search, AI endpoints)
- ✅ When legitimate users hit limits (increase globally or per-user)

**Migration Path**:

```typescript
// src/lib/rate-limit.ts
import { db } from "@/db";
import { rateLimit } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";

export async function checkRateLimit(key: string, limits: { window: number; max: number }) {
  const now = Date.now();
  const windowStart = now - limits.window * 1000;

  // Get or create rate limit record
  const [record] = await db
    .select()
    .from(rateLimit)
    .where(and(eq(rateLimit.key, key), gt(rateLimit.lastRequest, windowStart)));

  if (record && record.count >= limits.max) {
    return { allowed: false, remaining: 0 };
  }

  // Update count
  const newCount = (record?.count || 0) + 1;
  await db
    .insert(rateLimit)
    .values({ key, count: newCount, lastRequest: now })
    .onConflictDoUpdate({ target: rateLimit.key, set: { count: newCount } });

  return { allowed: true, remaining: limits.max - newCount };
}

// Use per-endpoint
export async function rateLimitByEndpoint(userId: string, endpoint: string) {
  const limits = {
    "/api/ai/generate": { window: 60, max: 10 },
    "/api/search": { window: 60, max: 100 },
    default: { window: 60, max: 1000 },
  };

  return checkRateLimit(`${userId}:${endpoint}`, limits[endpoint] || limits.default);
}
```

### SEO & Metadata

**Current State**: Basic metadata, sitemap, robots.txt.

**What's Missing**:

- JSON-LD structured data (Schema.org)
- Advanced Open Graph (video, article metadata)
- XML sitemap with priority/changefreq
- Breadcrumb navigation
- Canonical URLs management

**Rationale**:

- Basic SEO covers 80% of use cases
- Google doesn't require structured data for ranking
- Can be added when SEO becomes priority
- Focus on content quality over technical SEO

**When to Add**:

- ✅ When organic traffic is primary acquisition channel
- ✅ When competing for competitive keywords
- ✅ When you have rich content (recipes, products, events)

**Migration Path**: See `docs/recipes/add-structured-data.md` (TODO)

## Cloudflare Workers Constraints

### Free Tier Limits

**Daily Limits** (reset at midnight UTC):

- 100,000 requests per day
- **CPU Time**: 10ms per request (strict)
- **Memory**: 128MB per worker
- **Response Size**: 1MB
- **Request Body**: 100MB
- **Workers**: 100 scripts (more than enough)

**What This Means**:

- ✅ **Works great**: Static pages, forms, auth, CRUD operations
- ✅ **Works fine**: Simple database queries (< 5ms), image optimization (< 10ms)
- ⚠️ **Risky**: Multiple joins, large result sets, complex calculations
- ❌ **Doesn't work**: WebSocket, file generation, heavy computation

**Real-World Capacity** (free tier):

- Small blog: 1,000 daily visitors = ~5,000 requests (5% of limit)
- SaaS MVP: 100 users × 20 actions/day = 2,000 requests (2% of limit)
- Landing page: 10,000 visitors = ~30,000 requests (30% of limit)

### Paid Tier: Workers Standard ($5/mo + usage)

**Pricing**: $5/mo + $0.50 per million requests

**Limits**:

- 10 million requests included ($5/mo)
- **CPU Time**: 30 seconds per request (3,000x more than free!)
- **Memory**: Still 128MB
- **Response Size**: 25MB+
- Everything else same as free tier

**What This Unlocks**:

- ✅ Complex database queries (joins, aggregations)
- ✅ External API calls (payment processors, email services)
- ✅ PDF generation (small documents)
- ✅ Image processing (resize, crop, compress)
- ✅ Complex business logic

**When to Upgrade**:

- ✅ When you hit CPU time limits (errors in logs)
- ✅ When traffic > 100k requests/day consistently
- ✅ When you need complex API integrations
- ✅ When response times > 1 second

**Cost Example**:

- 500k requests/mo: $5/mo (included in base)
- 5M requests/mo: $5/mo base + $2.50 = $7.50/mo
- 50M requests/mo: $5/mo base + $25 = $30/mo

**Compare**: Vercel Hobby ($0) has 100GB bandwidth, Pro ($20/mo) unlimited.

### Workers Unbound ($5/mo + usage)

**For Heavy Computation**:

- **CPU Time**: 15 minutes (!) - for background jobs
- **Pricing**: $0.125 per million requests + $12.50 per million GB-seconds
- Use cases: Video transcoding, ML inference, data processing

**When to Use**: Only if you need long-running tasks. Most apps don't need this.

### Platform Limitations (All Tiers)

#### ❌ What Doesn't Work on Workers

**1. WebSocket**

- Workers don't support persistent WebSocket connections
- **Workaround**: Use Cloudflare Durable Objects (extra setup)
- **Alternative**: Deploy WebSocket server separately (Vercel, Railway)
- **Use cases**: Chat apps, live collaboration, multiplayer games

**2. Filesystem Access**

- No `fs` module, no file writes
- **Workaround**: Use Cloudflare R2 (S3-compatible storage)
- **Alternative**: Upload directly to R2 with presigned URLs
- **Use cases**: User uploads, generated PDFs, backups

**3. Long-Running Background Jobs**

- Even with Unbound, 15min max
- **Workaround**: Use Cloudflare Queues + separate Workers
- **Alternative**: Use Cloudflare Cron Triggers (scheduled tasks)
- **Use cases**: Batch processing, data imports, email campaigns

**4. Native Node.js Modules**

- Many npm packages don't work (bcrypt, canvas, sharp)
- **Workaround**: Use Web API equivalents or edge-compatible packages
- **Example**: Use `@node-rs/bcrypt` (WASM) instead of `bcrypt`
- **Compatibility**: Check [workers.cloudflare.com/compat](https://workers.cloudflare.com/built-with/compatibility/)

**5. Stateful In-Memory Storage**

- Workers are stateless (each request isolated)
- **Workaround**: Use Cloudflare KV (key-value) or Durable Objects (stateful)
- **Alternative**: Store state in database (Neon, Turso)
- **Use cases**: Session caching, rate limiting, feature flags

#### ✅ What Works Great

**1. Server-Side Rendering (SSR)**

- Next.js pages render in ~50ms at edge
- Instant TTFB (time to first byte)
- Global CDN (300+ cities)

**2. API Routes with Database**

- Neon PostgreSQL queries in ~10-30ms
- WebSocket connection pooling works
- Perfect for CRUD operations

**3. Authentication Flows**

- Better Auth works flawlessly
- Session management
- Email sending (Resend)

**4. Static Assets**

- CSS, JS, images served from CDN
- Automatic compression
- Cache headers respected

**5. Server Actions**

- Form submissions
- Data mutations
- File processing (small files)

### Workarounds for Common Use Cases

#### File Uploads

**Problem**: Can't write to filesystem

**Solution A: Direct Upload to R2**

```typescript
// 1. Generate presigned URL (Server Action)
export async function getUploadUrl(filename: string) {
  const r2 = new R2Bucket(process.env.R2_BUCKET!);
  const url = await r2.createPresignedUrl({
    key: `uploads/${crypto.randomUUID()}-${filename}`,
    expiresIn: 300, // 5 minutes
  });
  return url;
}

// 2. Upload from client
const url = await getUploadUrl(file.name);
await fetch(url, { method: "PUT", body: file });
```

**Solution B: Cloudflare Images** ($5/mo)

- Automatic resizing, optimization
- CDN delivery
- 100k images included

**Cost**: R2 storage $0.015/GB/mo + $0.36/million reads

**Solution C: Supabase Storage** (Alternative)

- S3-compatible with built-in CDN
- Image transformations included
- Row Level Security policies
- See [`docs/SUPABASE_INTEGRATION.md`](./SUPABASE_INTEGRATION.md#2-file-storage-s3-compatible) for setup

#### Real-Time Features (Chat, Notifications)

**Problem**: No WebSocket support

**Solution A: Polling** (simple, works for MVP)

```typescript
// Client polls every 5 seconds
useEffect(() => {
  const interval = setInterval(async () => {
    const messages = await fetch("/api/messages/new");
    setMessages(await messages.json());
  }, 5000);
  return () => clearInterval(interval);
}, []);
```

**Solution B: Server-Sent Events** (better, one-way)

```typescript
// Works on Workers, client receives updates
export async function GET(request: Request) {
  const stream = new ReadableStream({
    start(controller) {
      // Send updates to client
      const send = (data: any) => {
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
      };
      // Poll database and send updates
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
}
```

**Solution C: Durable Objects** (complex, full WebSocket)

- Requires separate Durable Object setup
- More expensive ($0.15/million requests)
- See [Cloudflare Docs](https://developers.cloudflare.com/durable-objects/)

**Solution D: Separate WebSocket Server**

- Deploy to Vercel, Railway, Render
- Workers handle HTTP, separate server handles WebSocket
- Example: [Pusher](https://pusher.com), [Ably](https://ably.com)

**Solution E: Supabase Real-time** (Recommended) ⭐

- PostgreSQL-based WebSocket subscriptions
- Hybrid approach: Keep Workers + add Supabase for database + real-time
- Native integration with minimal code changes
- See [`docs/SUPABASE_INTEGRATION.md`](./SUPABASE_INTEGRATION.md) for complete guide

#### Payment Processing (Stripe)

**Problem**: Webhook signature verification needs raw body

**Solution**: Works fine! Stripe webhooks compatible with Workers.

```typescript
// app/api/webhooks/stripe/route.ts
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const body = await request.text(); // Raw body
  const signature = request.headers.get("stripe-signature")!;

  const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);

  // Handle event
  if (event.type === "checkout.session.completed") {
    // Upgrade user to paid
  }

  return new Response("OK");
}
```

#### PDF Generation

**Problem**: CPU-intensive, might exceed 10ms (free tier)

**Solution A**: Upgrade to Standard ($5/mo) - 30s CPU time

**Solution B**: Use external service

- [PDFShift](https://pdfshift.io) - $19/mo for 1,000 PDFs
- [DocRaptor](https://docraptor.com) - $15/mo for 1,250 PDFs
- Generate HTML, convert off-worker

**Solution C**: Generate in background with Queue

```typescript
// 1. Queue PDF generation (instant response)
await env.PDF_QUEUE.send({
  userId: user.id,
  invoiceId: invoice.id,
});

// 2. Worker processes queue (separate worker)
export default {
  async queue(batch: MessageBatch) {
    for (const message of batch.messages) {
      const pdf = await generatePDF(message.body);
      await uploadToR2(pdf);
    }
  },
};
```

### Monitoring Workers Performance

**Built-in Analytics** (Cloudflare Dashboard):

- Request count
- Error rate
- CPU time usage (p50, p99)
- Response time

**When to Optimize**:

- CPU time > 5ms average (free tier - close to limit)
- CPU time > 1s average (paid tier - room for improvement)
- Error rate > 1%

**Common Bottlenecks**:

1. Database N+1 queries → Use joins
2. External API calls → Cache responses
3. Heavy JSON parsing → Use streaming
4. Complex calculations → Cache or move to background

## Feature Gaps (Intentional)

### Payment Processing

**Not Included**: Stripe, PayPal, or payment flow integration.

**Reason**:

- Every business has different pricing model (subscription, one-time, usage-based)
- Requires legal setup (terms, refunds, tax handling)
- Stripe setup varies by country
- Testing requires Stripe test mode setup

**When to Add**: After validating people want to pay for your product.

**How to Add**:

```bash
# See recipe (coming soon)
docs/recipes/add-stripe-payments.md

# Quick start
pnpm add stripe @stripe/stripe-js
# Create webhook endpoint: app/api/webhooks/stripe/route.ts
# Add subscription check to middleware
```

**Estimated Time**: 2-4 hours for basic subscription flow.

### File Storage & Uploads

**Not Included**: Image uploads, file management, CDN integration.

**Reason**:

- Requires Cloudflare R2 bucket setup ($0.015/GB)
- Different apps need different storage (images vs PDFs vs videos)
- Upload UX varies (drag-drop, paste, camera)

**When to Add**: When your app needs user-uploaded content.

**How to Add**:

```bash
# Option A: Cloudflare R2 (S3-compatible)
# - Create R2 bucket in Cloudflare dashboard
# - Add R2 binding to wrangler.jsonc
# - Use presigned URLs for uploads

# Option B: Cloudflare Images ($5/mo)
# - Automatic optimization
# - Instant resizing
# - 100k images included

# See setup guide
docs/R2_SETUP.md
```

**Estimated Time**: 30-60 minutes for basic upload flow.

### Email Marketing & Campaigns

**Included**: Transactional emails (auth, notifications)

**Not Included**: Bulk emails, campaigns, analytics, A/B testing.

**Reason**:

- Resend is for transactional emails, not marketing
- Marketing tools have complex UIs (campaign builder, segments)
- Newsletter apps like Mailchimp, ConvertKit are specialized

**When to Add**: When you have 1,000+ newsletter subscribers.

**Alternatives**:

- Export subscribers from dashboard → import to Mailchimp
- Use ConvertKit forms instead of built-in newsletter
- Keep using Resend for transactional, add marketing tool for campaigns

### Internationalization (i18n)

**Not Included**: Multi-language support, translations, locale detection.

**Reason**:

- 80% of MVPs launch in one language
- i18n adds ~30% complexity to every component
- Translation costs money and time
- URL structure decisions (domain vs subdomain vs path)

**When to Add**: When expanding to new market with validated product.

**How to Add**:

```bash
# Option A: next-intl (recommended)
pnpm add next-intl

# Option B: next-i18next
pnpm add next-i18next react-i18next

# See recipe
docs/recipes/add-internationalization.md
```

**Estimated Time**: 1-2 weeks to translate and test all pages.

### Advanced RBAC & Multi-Tenancy

**Included**: Single-organization RBAC (user/editor/admin).

**Not Included**: Multi-tenant architecture, teams, invitations, organization switching.

**Reason**:

- Complex database schema (tenant isolation)
- Many architectural decisions (row-level security, schema per tenant)
- Different apps have different tenant models
- Most MVPs are single-organization

**When to Add**: When you have B2B customers who need teams.

**How to Add**:

```typescript
// 1. Add organization table
export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  plan: text("plan").notNull(),
});

// 2. Add user-organization junction
export const organizationMember = pgTable("organization_member", {
  userId: text("user_id").references(() => user.id),
  organizationId: text("organization_id").references(() => organization.id),
  role: text("role").notNull(), // owner, admin, member
});

// 3. Filter all queries by organization
const posts = await db
  .select()
  .from(post)
  .where(eq(post.organizationId, session.user.organizationId));

// See recipe
docs / recipes / add - multi - tenancy.md;
```

**Estimated Time**: 1-2 weeks for full implementation.

### Advanced Search

**Not Included**: Full-text search, filters, facets, autocomplete.

**Reason**:

- Database full-text search is limited (PostgreSQL tsvector works but not great)
- Specialized search engines (Algolia, Meilisearch) cost money
- Search UX requires design work
- Most MVPs don't need advanced search

**When to Add**: When you have 1,000+ pieces of content and users complain.

**Options**:

- PostgreSQL full-text search (free, good for < 10k records)
- Meilisearch self-hosted (free, requires separate server)
- Algolia ($0 for 10k records, then $1/1k records)
- Typesense (open-source alternative to Algolia)

**Estimated Time**: 2-3 days for basic search implementation.

## Scaling Considerations

### When to Optimize (Don't Prematurely!)

**Traffic Thresholds**:

- < 10k requests/day: Don't optimize, ship features
- 10k-100k/day: Add caching (KV), optimize queries
- 100k-1M/day: Add CDN (Cloudflare already does this), database read replicas
- > 1M/day: Consider microservices, dedicated caching layer

**User Thresholds**:

- < 100 users: No optimization needed
- 100-1,000: Add monitoring (Axiom), basic caching
- 1,000-10,000: Optimize database indexes, add Redis/KV
- > 10,000: Consider horizontal scaling, load testing

### Database Scaling

**Neon PostgreSQL** scales well:

- **Free tier**: 0.5GB storage, 10 branches (dev/staging/prod)
- **Launch** ($19/mo): 10GB storage, autoscaling compute
- **Scale** ($69/mo): 50GB storage, read replicas
- **Business** ($700/mo): 500GB, dedicated resources

**When to Upgrade**:

- ✅ Storage > 400MB (free tier almost full)
- ✅ Query times > 100ms average (need more compute)
- ✅ Connection errors (need connection pooling)

**Optimization Checklist**:

```typescript
// 1. Add indexes for frequently queried columns
export const post = pgTable(
  "post",
  {
    // ...
  },
  (table) => ({
    publishedIdx: index("post_published_idx").on(table.published, table.publishedAt),
    authorIdx: index("post_author_idx").on(table.authorId),
  })
);

// 2. Use select() instead of select all
const posts = await db
  .select({ id: post.id, title: post.title }) // Only needed fields
  .from(post);

// 3. Use joins instead of N+1 queries
const postsWithAuthors = await db.select().from(post).leftJoin(user, eq(post.authorId, user.id)); // One query

// 4. Add pagination
const posts = await db
  .select()
  .from(post)
  .limit(20)
  .offset(page * 20);
```

### Caching Strategy

**When to Add Caching**:

- ✅ Same data fetched multiple times per request
- ✅ Data doesn't change often (< 1 change per minute)
- ✅ Database queries > 50ms

**Option A: Next.js Cache** (built-in, automatic)

```typescript
// Caches for 1 hour
export const revalidate = 3600;

export default async function BlogPage() {
  const posts = await db.select().from(post);
  return <div>...</div>;
}
```

**Option B: Cloudflare KV** (persistent, global)

```typescript
// Read from KV first, fallback to database
const cached = await env.KV.get(`posts:${slug}`);
if (cached) return JSON.parse(cached);

const post = await db.select().from(post).where(eq(post.slug, slug));
await env.KV.put(`posts:${slug}`, JSON.stringify(post), {
  expirationTtl: 3600, // 1 hour
});
return post;
```

**Cost**: KV free tier (100k reads/day), paid $0.50/million reads.

### When to Migrate Away from Templator

**Signals You've Outgrown**:

- ❌ Team > 20 developers (need monorepo, micro-frontends)
- ❌ Traffic > 100M requests/month (need dedicated infrastructure)
- ❌ Complex features hitting Workers limits (need traditional server)
- ❌ Compliance requirements (need on-premise, audit logs)

**Migration Paths**:

1. **Vercel**: Similar DX, better for complex apps, more expensive
2. **Self-hosted Next.js**: Docker + Nginx, full control, more ops work
3. **Microservices**: Break apart features, higher complexity

**When to Extend (Not Migrate)**:

- ✅ Add testing, monitoring, analytics
- ✅ Add features (payments, search, i18n)
- ✅ Add team members (architecture supports it)
- ✅ Optimize performance (caching, indexes)

## Decision Matrix

Use this template if you answer **YES** to most of these:

### Project Type

- [ ] Building MVP or prototype (not final product)
- [ ] Content-focused (blog, marketing, SaaS landing pages)
- [ ] CRUD-heavy (dashboards, internal tools, admin panels)
- [ ] API-first (Next.js as backend + API layer)

### Team

- [ ] Solo developer or team < 5 people
- [ ] Using AI assistants (Cursor, Claude Code, Copilot)
- [ ] Value speed over completeness
- [ ] Can add features incrementally

### Technical

- [ ] TypeScript / React / Next.js is primary stack
- [ ] Comfortable with Cloudflare ecosystem
- [ ] Don't need WebSocket or real-time features
- [ ] Don't need heavy computation or long-running jobs

### Business

- [ ] Pre-product-market fit (experimenting)
- [ ] Budget < $100/mo for hosting
- [ ] Want to deploy in < 1 week
- [ ] Will add testing/monitoring later

**Score**:

- 12-15 YES: Perfect fit, use Templator
- 8-11 YES: Good fit, consider trade-offs
- 4-7 YES: Maybe, evaluate limitations carefully
- 0-3 YES: Not recommended, use different stack

## Migration Paths

### From MVP to Production

**Week 1: Monitoring**

```bash
# Add error tracking
pnpm add @axiom-js/js
# Configure Axiom, add to Server Actions

# Add analytics
pnpm add @vercel/analytics
# Add to layout.tsx
```

**Week 2: Testing Critical Paths**

```bash
# Add Vitest
pnpm add -D vitest @testing-library/react

# Write tests for:
# - Authentication (login, signup, password reset)
# - RBAC (permission checks)
# - Payment flows (if added)
# - Data integrity (CRUD operations)
```

**Week 3: Performance Optimization**

```bash
# Add database indexes
# Add caching (KV or Next.js cache)
# Optimize images (Cloudflare Images)
# Add loading states and Suspense
```

**Week 4: Security Hardening**

```bash
# Add rate limiting per endpoint
# Add CSRF protection (if not using Server Actions)
# Add input sanitization (XSS prevention)
# Add audit logs for admin actions
```

### From Templator to Custom Solution

**When**: You've validated product-market fit and need more control.

**Path A: Stay on Cloudflare, Extend**

- Add Durable Objects for WebSocket
- Add Queue Workers for background jobs
- Add R2 for file storage
- Add D1 for additional databases (analytics)

**Path B: Hybrid Architecture**

- Keep Templator for marketing site
- Move app to Vercel/self-hosted
- Share authentication via JWT

**Path C: Full Migration**

- Export database (Neon has export tools)
- Migrate to self-hosted Next.js + PostgreSQL
- Keep using Drizzle, Better Auth (portable)
- Add infrastructure (Redis, S3, Docker)

**Estimated Time**: 2-4 weeks for full migration.

## Conclusion

Templator is **intentionally incomplete** to optimize for:

1. **Speed**: Ship MVP in days, not months
2. **Simplicity**: Fewer decisions, less maintenance
3. **Focus**: Build features, not infrastructure

**The trade-off**: You'll need to add testing, monitoring, and advanced features later.

**The payoff**: You'll validate your idea faster than teams with "complete" setups.

**Philosophy**: It's better to ship a working MVP without tests than a perfect app that never launches.

For questions or suggestions, open an issue on GitHub or see [docs/](.) for detailed guides.
