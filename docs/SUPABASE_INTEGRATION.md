# Supabase Integration Guide

Complete guide to integrating Supabase with Templator to add real-time features, storage, and enhanced database capabilities while maintaining the existing architecture.

## Table of Contents

- [Overview](#overview)
- [What Supabase Adds](#what-supabase-adds)
- [Architecture Patterns](#architecture-patterns)
- [Getting Started](#getting-started)
- [Cost Comparison](#cost-comparison)
- [Decision Matrix](#decision-matrix)
- [Detailed Guides](#detailed-guides)
- [FAQ](#faq)

---

## Overview

### What is Supabase?

Supabase is an open-source Firebase alternative that provides:

- **PostgreSQL Database** (with extensions and full SQL access)
- **Real-time subscriptions** (WebSocket-based database changes)
- **Authentication** (multiple providers, JWT-based)
- **Storage** (S3-compatible file storage)
- **Edge Functions** (Deno-based serverless functions)
- **Auto-generated APIs** (REST and GraphQL)

### Why Consider Supabase?

Templator's current stack (Cloudflare Workers + Neon + Better Auth) is excellent for:

- ✅ Fast SSR/API responses (0ms cold starts)
- ✅ Global edge distribution (300+ cities)
- ✅ Simple CRUD applications
- ✅ Cost-effective deployment ($0-5/mo)

**Supabase fills these gaps:**

- ❌ **No real-time** → ✅ Supabase adds WebSocket subscriptions
- ❌ **No file storage** → ✅ Supabase adds S3-compatible storage
- ❌ **Limited background jobs** → ✅ Supabase adds database webhooks and cron
- ❌ **Manual database management** → ✅ Supabase adds GUI, backups, branching

### When to Use Supabase

**✅ Perfect for:**

- Real-time features (chat, notifications, live dashboards)
- File uploads/storage (avatars, documents, images)
- Database-heavy background tasks
- Complex database operations (reports, aggregations)
- Development velocity (GUI, migrations, logs)

**❌ Not needed for:**

- Simple CRUD apps (current stack is sufficient)
- Budget-constrained MVPs ($0 is hard to beat)
- Applications requiring maximum performance (Workers' 0ms cold starts)

---

## What Supabase Adds

### 1. Real-time Subscriptions ⭐ (Primary Benefit)

**Current limitation:** Polling (5-10s latency) or complex WebSocket setup

**With Supabase:**

```typescript
const channel = supabase
  .channel("messages")
  .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, (payload) =>
    updateUI(payload.new)
  )
  .subscribe();
```

**Use cases:** Chat, live notifications, collaborative editing, real-time dashboards

**➡️ [Complete Guide: Real-time Chat](./recipes/supabase/realtime-chat.md)**

---

### 2. File Storage (S3-Compatible)

**Current limitation:** No filesystem on Workers, must use external services

**With Supabase Storage:**

```typescript
// Upload file
const { data } = await supabase.storage.from("avatars").upload(`${userId}/avatar.jpg`, file);

// Get public URL with transformations
const url = supabase.storage.from("avatars").getPublicUrl(data.path, {
  transform: { width: 200, height: 200 },
});
```

**Features:** Public/private buckets, CDN, image transformations, RLS for files

**➡️ [Complete Guide: File Storage](./recipes/supabase/file-storage.md)**

---

### 3. Database Enhancements

**Beyond Neon, Supabase adds:**

- **Extensions**: pgvector (AI embeddings), pg_cron, PostGIS
- **Database webhooks**: Trigger HTTP requests on DB changes
- **GUI editor**: Table editor, SQL editor, logs viewer
- **Branching**: Git-like database branches
- **Point-in-time recovery**: Restore to any moment

**➡️ [Complete Guide: Database Enhancements](./recipes/supabase/database-enhancements.md)**

---

### 4. Edge Functions (Optional)

**When to use:** Database-heavy background tasks, webhooks, scheduled jobs

**When NOT to use:** User-facing requests (Workers is faster)

**Architecture:** Keep Workers for app, use Supabase EF only for specific background tasks

---

### 5. Authentication Alternative (Optional)

**Current:** Better Auth (recommended to keep)

**Supabase Auth benefits:** Built-in OAuth providers, magic links, phone auth

**Recommendation:** Keep Better Auth unless you specifically need OAuth providers

---

## Architecture Patterns

### Pattern 1: Hybrid Smart ⭐ (Recommended)

```
┌─────────────────────────────────────────────────┐
│                   CLIENT                        │
└────────┬───────────────────────────┬────────────┘
         │ HTTP                      │ WebSocket
         │ (CRUD, Auth)              │ (Real-time)
         ▼                           ▼
┌──────────────────┐         ┌─────────────────────┐
│ Cloudflare       │         │   Supabase          │
│ Workers          │  HTTP   ├─────────────────────┤
├──────────────────┤────────▶│ • PostgreSQL        │
│ • Next.js SSR    │         │ • Real-time         │
│ • Server Actions │         │ • Storage (optional)│
│ • Better Auth    │         │                     │
│ • Business Logic │         │ (NO Edge Functions) │
│ • Drizzle ORM    │         │                     │
└──────────────────┘         └─────────────────────┘
```

**What changes:**

- ✅ Database connection string: Neon → Supabase
- ✅ Add Supabase client for real-time (client-side only)
- ❌ Auth: Keep Better Auth (no changes)
- ❌ ORM: Keep Drizzle (no changes)
- ❌ Deployment: Keep Workers (no changes)

**Effort:** 1-2 days
**Cost:** +$0-25/mo depending on scale

**Result:**

- All benefits of current stack (performance, simplicity)
- - Real-time subscriptions
- - Optional storage
- - Better database GUI/management

---

### Pattern 2: Hybrid with Edge Functions

Use Supabase Edge Functions **only** for:

- Database webhooks (triggered by DB changes)
- Heavy database operations (reports, aggregations)
- Scheduled jobs (cleanup, notifications)

**Keep Workers for:** 95% of requests (user-facing)
**Use Supabase EF for:** 5% of requests (background tasks)

---

### Pattern 3: Full Supabase ❌ (Not Recommended)

**Why not:**

- Must rewrite all Server Actions (Node → Deno)
- Must rewrite auth (Better Auth → Supabase Auth)
- Must rewrite queries (Drizzle → Supabase client)
- Lose Workers performance (0ms cold starts → 50-200ms)
- Lose global network (300+ cities → 10 regions)

**Effort:** 3-4 weeks full rewrite

**When it makes sense:** Starting from scratch with Supabase as primary platform

---

## Getting Started

### Step 1: Create Supabase Project (5 min)

1. Visit [supabase.com/dashboard](https://supabase.com/dashboard)
2. Create new project
3. Note: connection string, anon key, URL

### Step 2: Update Database Connection (2 min)

```bash
# .env
DATABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"
```

### Step 3: Push Schema to Supabase (3 min)

```bash
pnpm db:push
# Drizzle pushes schema to Supabase PostgreSQL
```

### Step 4: Install Supabase Client (1 min)

```bash
pnpm add @supabase/supabase-js
```

### Step 5: Add Environment Variables (1 min)

```bash
# .env
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."
```

### Step 6: Create Supabase Client (5 min)

```typescript
// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### Step 7: Add Real-time to a Component (15 min)

```typescript
// Example: Live notifications
"use client";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

export function LiveNotifications() {
  useEffect(() => {
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          toast.success(payload.new.message);
        }
      )
      .subscribe();

    return () => channel.unsubscribe();
  }, []);

  return null;
}
```

**Total time:** ~1 hour

**What stayed the same:**

- All Server Actions
- All components
- Auth system
- Deployment
- Business logic

---

## Cost Comparison

### MVP Stage (0-10k users)

| Stack                           | Cost  |
| ------------------------------- | ----- |
| **Current** (Workers + Neon)    | $0/mo |
| **Hybrid** (Workers + Supabase) | $0/mo |

**Conclusion:** ✅ Same cost, add real-time + storage

---

### Growth Stage (10k-100k users)

| Stack       | Workers | Database        | Email  | Total      |
| ----------- | ------- | --------------- | ------ | ---------- |
| **Current** | $5/mo   | Neon $19/mo     | $20/mo | **$44/mo** |
| **Hybrid**  | $5/mo   | Supabase $25/mo | $20/mo | **$50/mo** |

**Difference:** +$6/mo (+14%)

**Supabase includes:**

- Real-time subscriptions
- 100GB file storage
- Better database tools
- Automatic backups

---

### Scale Stage (100k+ users)

| Stack       | Total Cost |
| ----------- | ---------- |
| **Current** | $174/mo    |
| **Hybrid**  | $195/mo    |

**Difference:** +$21/mo (+12%)

**Benefits:** Better tooling, real-time + storage included, easier to manage

---

## Decision Matrix

### Should You Use Supabase?

Answer these questions:

#### Real-time Features

- [ ] Do you need chat or messaging?
- [ ] Do you need live notifications (<5s latency)?
- [ ] Do you need collaborative editing?
- [ ] Do you need live dashboards?

**If 2+ YES → Consider Supabase**

---

#### File Storage

- [ ] Do you need user file uploads?
- [ ] Do you need to store images/documents?
- [ ] Do you need CDN for user content?

**If 2+ YES → Consider Supabase**

---

#### Database Features

- [ ] Do you need full-text search?
- [ ] Do you need AI embeddings (pgvector)?
- [ ] Do you need database webhooks?
- [ ] Do you need better database GUI?

**If 2+ YES → Consider Supabase**

---

#### Trade-offs

- [ ] Are you okay with slightly higher cost (+$0-20/mo)?
- [ ] Are you okay with one more platform to manage?
- [ ] Is real-time/storage worth the complexity?

**If ALL YES → Use Supabase**

---

### Quick Decision Guide

```
Need real-time?
├─ NO → Stay with current stack ✅
└─ YES
    ├─ Can you use polling (5-10s latency)?
    │  ├─ YES → Stay with current stack ✅
    │  └─ NO → Use Supabase Hybrid ⭐
    │
    └─ Need file storage too?
        ├─ YES → Definitely use Supabase ⭐⭐
        └─ NO → Supabase still best for realtime ⭐
```

---

## Detailed Guides

### Implementation Recipes

📚 **Step-by-step guides for common use cases:**

1. **[Real-time Chat](./recipes/supabase/realtime-chat.md)** ⭐
   - Complete chat implementation
   - Message history with Drizzle
   - Real-time updates with Supabase
   - Row Level Security
   - Time: 2-3 hours

2. **[File Storage](./recipes/supabase/file-storage.md)**
   - Avatar uploads
   - Document management
   - Image transformations
   - Presigned URLs
   - Time: 1-2 hours

3. **[Presence Detection](./recipes/supabase/presence-detection.md)**
   - Online/offline status
   - Typing indicators
   - Active users list
   - Time: 1 hour

4. **[Database Enhancements](./recipes/supabase/database-enhancements.md)**
   - Full-text search
   - AI embeddings (pgvector)
   - Database webhooks
   - Scheduled functions
   - Time: varies

---

## FAQ

### Can I use Supabase with Cloudflare Workers?

**Yes.** Supabase is just PostgreSQL + HTTP APIs. Workers can:

- Connect to Supabase PostgreSQL via HTTP (using Drizzle)
- Call Supabase Storage API
- Client-side can use Supabase real-time

**Recommended:** Hybrid approach (see [Pattern 1](#pattern-1-hybrid-smart--recommended))

---

### Do I need to rewrite my auth system?

**No.** You can:

- Keep Better Auth for authentication
- Use Supabase only for database + real-time + storage

**Only migrate auth if:**

- You want OAuth providers (Google, GitHub, etc.)
- You want magic links or phone auth

---

### Will I lose Workers' 0ms cold starts?

**No.** With Hybrid approach:

- Workers still handle all user requests (0ms cold starts)
- Supabase provides:
  - Database (via HTTP from Workers)
  - Real-time subscriptions (client-side WebSocket)
  - Storage (HTTP API from Workers)

**Workers performance unchanged.**

---

### What about type safety with Supabase client?

**Supabase can generate TypeScript types:**

```bash
supabase gen types typescript --project-id <id> > src/types/supabase.ts
```

**However:** Drizzle still better for type safety in Server Actions.

**Recommendation:**

- Use Drizzle for Server Actions (Workers)
- Use Supabase client only for real-time (client-side)

---

### Can I migrate back from Supabase?

**Yes.** With Hybrid approach:

- Your code uses Drizzle (not Supabase client)
- Auth is Better Auth (not Supabase Auth)
- Only real-time uses Supabase client

**To migrate back:**

1. Export database (PostgreSQL dump)
2. Import to Neon
3. Remove Supabase client from components
4. Remove real-time subscriptions (or implement with polling)

**Effort:** 1-2 days (vs weeks if using full Supabase)

---

### What's the performance impact?

**Hybrid approach:**

- Workers requests: No change (0ms cold starts)
- Database queries: Similar latency (both are serverless Postgres)
- Real-time: Much faster than polling (sub-second vs 5-10s)
- Storage: CDN-backed, fast globally

**Only downside:** One more network hop for DB queries (Workers → Supabase), but negligible (~5-10ms).

---

### Is Supabase production-ready?

**Yes.**

- Used by companies like Mozilla, 1Password, PwC
- SOC 2 Type 2 compliant
- 99.9% SLA on paid plans
- Open source (can self-host if needed)
- Active development and community

**More mature than:** Many serverless platforms (Supabase founded 2020, stable since 2021)

---

## Conclusion

### Summary

**Supabase fills critical gaps in Templator's stack:**

1. ✅ **Real-time** (primary benefit) - WebSocket subscriptions for live updates
2. ✅ **Storage** - S3-compatible file storage with CDN
3. ✅ **Database tooling** - Better GUI, backups, extensions
4. ⚠️ **Background tasks** - Edge Functions (optional, for specific use cases)
5. ⚠️ **Auth** - Only if you need OAuth/magic links

**Best approach: Hybrid Smart**

- Keep Cloudflare Workers for performance (0ms cold starts, 300+ cities)
- Keep Drizzle for type-safe queries
- Keep Better Auth for flexible authentication
- Add Supabase for database + real-time + storage

**Effort:** 1-2 days
**Cost:** +$0-25/mo depending on scale
**Benefit:** Real-time features + storage with minimal rewrite

---

### When to Use Supabase

✅ **Use if:**

- Need real-time (<1s latency)
- Need file storage
- Want better database tooling
- Budget allows +$0-25/mo

❌ **Don't use if:**

- Simple CRUD app (current stack sufficient)
- Polling (5-10s) is acceptable
- Budget is $0 strictly
- Want absolute simplicity (one platform only)

---

### Next Steps

**To integrate Supabase:**

1. **Follow [Getting Started](#getting-started)** (1 hour setup)
2. **Choose your use case:**
   - [Real-time Chat](./recipes/supabase/realtime-chat.md) (2-3 hours)
   - [File Storage](./recipes/supabase/file-storage.md) (1-2 hours)
   - [Presence Detection](./recipes/supabase/presence-detection.md) (1 hour)
   - [Database Enhancements](./recipes/supabase/database-enhancements.md) (varies)
3. **Test** in development
4. **Deploy** (no changes to Workers deployment)

**For questions:**

- Supabase docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Template issues: [GitHub Issues](https://github.com/yourusername/templator/issues)

---

**Remember:** Supabase is an **enhancement**, not a replacement. You keep all benefits of the current stack (performance, simplicity, AI-friendliness) and add real-time capabilities.
