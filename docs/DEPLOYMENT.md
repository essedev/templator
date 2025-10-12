# Deployment Guide - Cloudflare Workers

Complete guide to deploying Templator on Cloudflare Workers with OpenNext.

## Overview

This template is optimized for **Cloudflare Workers** deployment with:

- ✅ **Edge-native architecture** - Better Auth + Neon PostgreSQL
- ✅ **Zero cold starts** - Global edge network
- ✅ **OpenNext adapter** - Next.js 15 compatibility
- ✅ **Free tier** - 100k requests/day
- ✅ **Automatic scaling** - No server management

## Why Cloudflare Workers?

### Benefits

- **Performance:** Global edge network with <50ms latency worldwide
- **Cost-effective:** Free tier covers most MVPs (100k requests/day)
- **Scalability:** Automatic scaling to millions of requests
- **Zero cold starts:** Unlike AWS Lambda or traditional serverless
- **DX:** Deploy in seconds with Wrangler CLI

### Perfect Match with This Stack

- **Better Auth:** Edge-compatible authentication (no Node.js dependencies)
- **Neon PostgreSQL:** Serverless Postgres over HTTP (WebSockets for edge)
- **Drizzle ORM:** Native edge support
- **Custom PBKDF2:** Uses Web Crypto API (available on Workers)
- **Resend emails:** HTTP API (works on edge)

## Prerequisites

1. **Cloudflare account** (free tier sufficient)
2. **Neon PostgreSQL database** (free tier: 0.5GB storage)
3. **Domain** (optional, Workers provides `*.workers.dev` subdomain)
4. **Wrangler CLI** (Cloudflare's deployment tool)

## Quick Start

### 1. Install Wrangler

```bash
npm install -g wrangler
# or
pnpm add -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

This opens a browser to authenticate with Cloudflare.

### 3. Configure Secrets

Set sensitive environment variables as secrets (not in `wrangler.jsonc`):

```bash
# Database
wrangler secret put DATABASE_URL
# Paste your Neon connection string when prompted

# Better Auth
wrangler secret put BETTER_AUTH_SECRET
# Generate with: openssl rand -base64 32

# Email (optional)
wrangler secret put RESEND_API_KEY
# Only if using EMAIL_PROVIDER="resend"
```

### 4. Update Environment Variables

Edit `wrangler.jsonc` for non-sensitive variables:

```jsonc
{
  "name": "your-app-name",
  "vars": {
    "BETTER_AUTH_URL": "https://your-app.workers.dev",
    "NEXT_PUBLIC_APP_URL": "https://your-app.workers.dev",
    "EMAIL_PROVIDER": "resend",
    "EMAIL_FROM": "noreply@yourdomain.com",
  },
}
```

### 5. Build & Deploy

```bash
# Build for production
pnpm build

# Deploy to Cloudflare Workers
pnpm deploy

# Or preview before deploying
pnpm preview
```

**Done!** Your app is live at `https://your-app.workers.dev`

## Configuration Files

### `wrangler.jsonc`

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/cloudflare/workers-sdk/main/packages/wrangler/config-schema.json",
  "name": "templator",
  "compatibility_date": "2024-01-01",

  // Public environment variables
  "vars": {
    "BETTER_AUTH_URL": "https://templator.workers.dev",
    "NEXT_PUBLIC_APP_URL": "https://templator.workers.dev",
    "EMAIL_PROVIDER": "resend",
    "EMAIL_FROM": "noreply@yourdomain.com",
    "ADMIN_EMAIL": "admin@yourdomain.com",
  },

  // Secrets are set via CLI (wrangler secret put)
  // - DATABASE_URL
  // - BETTER_AUTH_SECRET
  // - RESEND_API_KEY
}
```

**Important:**

- ❌ **Never** put secrets (`DATABASE_URL`, `BETTER_AUTH_SECRET`, API keys) in `wrangler.jsonc`
- ✅ **Always** use `wrangler secret put` for sensitive data
- ✅ Public URLs and non-sensitive config can go in `vars`

### `open-next.config.ts`

OpenNext adapter configuration for Next.js → Cloudflare Workers:

```typescript
import type { OpenNextConfig } from "open-next/types";

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: "cloudflare-node",
    },
  },
};

export default config;
```

**What it does:**

- Transforms Next.js build output for Cloudflare Workers
- Uses Node.js compatibility layer for edge runtime
- Handles routing, middleware, and Server Actions

## Environment Variables

### Required Secrets (via Wrangler CLI)

```bash
# Database connection
wrangler secret put DATABASE_URL
# Example: postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname

# Better Auth secret (generate with: openssl rand -base64 32)
wrangler secret put BETTER_AUTH_SECRET
```

### Optional Secrets

```bash
# Resend API key (only if EMAIL_PROVIDER="resend")
wrangler secret put RESEND_API_KEY
```

### Public Variables (in wrangler.jsonc)

```jsonc
{
  "vars": {
    "BETTER_AUTH_URL": "https://yourapp.workers.dev",
    "NEXT_PUBLIC_APP_URL": "https://yourapp.workers.dev",
    "EMAIL_PROVIDER": "mock", // or "resend" for production
    "EMAIL_FROM": "noreply@yourdomain.com",
    "ADMIN_EMAIL": "admin@yourdomain.com",
  },
}
```

## Database Setup (Neon PostgreSQL)

### Why Neon?

- **Serverless** - Pay only for storage and compute you use
- **Edge-compatible** - HTTP/WebSocket connections work from Workers
- **Branching** - Git-like database branches for dev/staging
- **Free tier** - 0.5GB storage, sufficient for MVPs

### Setup Steps

1. **Create Neon project** at [neon.tech](https://neon.tech)
2. **Create database** (default is fine)
3. **Get connection string** from dashboard
4. **Set as secret:**
   ```bash
   wrangler secret put DATABASE_URL
   # Paste: postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname
   ```

### Run Migrations

```bash
# From local machine (not on Workers)
pnpm db:generate  # Generate migrations from schema
pnpm db:push      # Apply to database
```

**Important:** Migrations run from your local machine, not from Workers. The Workers app only queries the database.

### Connection Pooling

Neon handles connection pooling automatically. No additional configuration needed for Cloudflare Workers.

## Custom Domain (Optional)

### Using Cloudflare DNS

If your domain is on Cloudflare:

1. **Add route in Wrangler:**

   ```jsonc
   {
     "routes": [
       {
         "pattern": "yourdomain.com/*",
         "zone_name": "yourdomain.com",
       },
     ],
   }
   ```

2. **Deploy:**

   ```bash
   pnpm deploy
   ```

3. **Update env vars:**
   ```jsonc
   {
     "vars": {
       "BETTER_AUTH_URL": "https://yourdomain.com",
       "NEXT_PUBLIC_APP_URL": "https://yourdomain.com",
     },
   }
   ```

### Using External DNS

If domain is not on Cloudflare:

1. **Create CNAME record:**

   ```
   CNAME @ your-app.workers.dev
   ```

2. **Wait for DNS propagation** (up to 48h, usually <1h)

3. **Add route in Cloudflare dashboard:**
   - Workers → your-app → Settings → Triggers → Add Route
   - Pattern: `yourdomain.com/*`

## Deployment Workflow

### Development

```bash
# Local development with Turbopack
pnpm dev

# Test against production database (optional)
DATABASE_URL="postgresql://..." pnpm dev
```

### Staging (Preview Deployments)

```bash
# Preview build locally
pnpm build
pnpm preview

# Or deploy to preview URL
wrangler deploy --env staging
```

### Production

```bash
# Full production deployment
pnpm build
pnpm deploy

# Verify deployment
curl https://your-app.workers.dev
```

### Rollback

```bash
# List recent deployments
wrangler deployments list

# Rollback to previous version
wrangler rollback [deployment-id]
```

## Better Auth on Edge

### Why It Works

Better Auth is edge-compatible because:

- ✅ No Node.js-specific dependencies
- ✅ Uses Web Crypto API (available on Workers)
- ✅ Database-backed rate limiting (not in-memory)
- ✅ HTTP-based session management

### Session Management

Sessions are stored in PostgreSQL:

```typescript
// Better Auth config (src/lib/auth.ts)
session: {
  cookieCache: {
    enabled: true,
    maxAge: 60 * 5, // 5-minute cache for performance
  },
}
```

**How it works:**

1. First request: Session fetched from database
2. Next 5 minutes: Session cached in cookie
3. After 5 minutes: Re-validated from database

This reduces database queries while maintaining security.

### PBKDF2 Password Hashing

Custom implementation using Web Crypto API:

```typescript
// src/lib/password.ts
// Uses crypto.subtle.deriveBits (available on Workers)
// Algorithm: PBKDF2-SHA-256, 100k iterations
```

**Why not bcrypt?** bcrypt requires Node.js native modules (not available on Workers).

## Performance Optimization

### Edge Caching

Cloudflare automatically caches:

- Static assets (`/_next/static/*`)
- Images (`/_next/image/*`)
- Public folder (`/favicon.ico`, etc.)

**No configuration needed** - works out of the box.

### Database Queries

Optimize for edge:

```typescript
// ✅ Good: Single query with joins
const posts = await db.select().from(posts).leftJoin(users, eq(posts.authorId, users.id)).limit(10);

// ❌ Bad: Multiple round trips
const posts = await db.select().from(posts);
for (const post of posts) {
  post.author = await db.select().from(users).where(eq(users.id, post.authorId));
}
```

### Middleware Performance

Middleware is **extremely fast** (< 1ms):

- Only checks cookie presence
- No database queries
- No heavy computations

Full RBAC validation happens in Server Components (where it's appropriate).

## Monitoring & Logs

### View Logs

```bash
# Stream live logs
wrangler tail

# Filter by status
wrangler tail --status error

# Filter by method
wrangler tail --method POST
```

### Cloudflare Dashboard

Monitor in dashboard:

- **Analytics** → Request volume, error rates, latency
- **Logs** → Real-time and historical logs
- **Workers** → CPU time, memory usage

### Errors

Errors are automatically logged to Cloudflare:

```typescript
// Errors thrown in your code appear in dashboard
throw new Error("Something went wrong");
```

## Costs & Limits

### Cloudflare Workers Free Tier

- **Requests:** 100,000 per day
- **CPU time:** 10ms per request
- **Memory:** 128MB per Worker
- **KV reads:** 100,000 per day (if using KV)

**Enough for:** ~3 million requests/month = most MVPs

### Paid Plan ($5/month)

- **Requests:** 10 million included, then $0.50/million
- **CPU time:** 50ms per request
- **No daily limits**

### Neon PostgreSQL Free Tier

- **Storage:** 0.5GB
- **Compute:** 191.9 hours/month active time
- **Branches:** 10 (dev/staging/prod)

**Enough for:** ~10k users with typical usage

### Resend Free Tier

- **Emails:** 3,000 per month
- **API calls:** Unlimited

**Enough for:** ~1,000 new users/month (verification + welcome emails)

## Troubleshooting

### Build Errors

**Error:** `Module not found`

**Fix:** Ensure all dependencies are in `dependencies` (not `devDependencies`):

```bash
pnpm add package-name  # Not pnpm add -D
```

**Error:** `Cannot find module 'fs'`

**Fix:** You're using Node.js-specific modules. Replace with Web APIs or move logic to build time.

### Runtime Errors

**Error:** `Database connection failed`

**Fix:**

1. Verify `DATABASE_URL` secret is set: `wrangler secret list`
2. Check Neon database is running
3. Verify connection string format: `postgresql://user:pass@host/db`

**Error:** `CPU time limit exceeded`

**Fix:** Optimize heavy computations:

- Move to build time if possible
- Cache results in database
- Split into background tasks (Cloudflare Queues)

### Authentication Issues

**Error:** `Session not found`

**Fix:**

1. Check `BETTER_AUTH_SECRET` is set
2. Verify `BETTER_AUTH_URL` matches deployed URL
3. Clear browser cookies and try again

**Error:** `CORS error`

**Fix:** Better Auth handles CORS automatically, but if you have custom API routes:

```typescript
// app/api/custom/route.ts
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    },
  });
}
```

### Email Issues

**Error:** `Email not sending`

**Fix:**

1. Verify `EMAIL_PROVIDER="resend"` in `wrangler.jsonc`
2. Check `RESEND_API_KEY` secret is set
3. Verify `EMAIL_FROM` matches verified domain in Resend
4. Check Resend dashboard for delivery errors

## Security Best Practices

### Secrets Management

```bash
# ✅ Good: Use secrets for sensitive data
wrangler secret put DATABASE_URL

# ❌ Bad: Never commit secrets to git
DATABASE_URL=postgresql://... # Don't put in wrangler.jsonc
```

### HTTPS Only

Cloudflare Workers enforce HTTPS automatically. HTTP requests are auto-redirected.

### Rate Limiting

Better Auth includes database-backed rate limiting:

```typescript
// src/lib/auth.ts
rateLimit: {
  enabled: true,
  window: 60,  // 60 seconds
  max: 100,    // 100 requests per window
  storage: "database"  // Edge-compatible
}
```

### Content Security Policy

Add CSP headers in `middleware.ts` for additional security:

```typescript
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'"
  );
  return response;
}
```

## Advanced: Multiple Environments

### Create Environment Configs

```jsonc
// wrangler.jsonc
{
  "env": {
    "staging": {
      "name": "templator-staging",
      "vars": {
        "BETTER_AUTH_URL": "https://staging.templator.dev",
      },
    },
    "production": {
      "name": "templator",
      "vars": {
        "BETTER_AUTH_URL": "https://templator.com",
      },
    },
  },
}
```

### Deploy to Environments

```bash
# Deploy to staging
wrangler deploy --env staging

# Deploy to production
wrangler deploy --env production
```

### Separate Secrets

```bash
# Staging secrets
wrangler secret put DATABASE_URL --env staging

# Production secrets
wrangler secret put DATABASE_URL --env production
```

## CI/CD Setup

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: "pnpm"

      - run: pnpm install
      - run: pnpm build

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: deploy
```

### Setup Secrets

1. Create Cloudflare API token: Dashboard → Profile → API Tokens
2. Add to GitHub: Settings → Secrets → `CLOUDFLARE_API_TOKEN`

## Migration from Other Platforms

### From Vercel

1. **Export environment variables** from Vercel dashboard
2. **Set in Wrangler:**
   ```bash
   wrangler secret put DATABASE_URL
   wrangler secret put BETTER_AUTH_SECRET
   ```
3. **Update URLs** in `wrangler.jsonc`
4. **Deploy:** `pnpm deploy`

**Changes needed:**

- Vercel Edge Functions → Already compatible (same runtime)
- Vercel Postgres → Migrate to Neon (export/import data)
- `NEXTAUTH_URL` → `BETTER_AUTH_URL`

### From Railway/Render

1. **Keep PostgreSQL database** (or migrate to Neon)
2. **Set connection string:** `wrangler secret put DATABASE_URL`
3. **Deploy:** `pnpm deploy`

**Benefits:**

- Faster (edge network vs single region)
- Cheaper (free tier is more generous)
- Zero cold starts

## Resources

- **Cloudflare Workers:** [workers.cloudflare.com](https://workers.cloudflare.com)
- **Wrangler docs:** [developers.cloudflare.com/workers/wrangler](https://developers.cloudflare.com/workers/wrangler)
- **OpenNext:** [open-next.js.org](https://open-next.js.org)
- **Neon PostgreSQL:** [neon.tech](https://neon.tech)

## Support

### Common Questions

**Q: Can I use Cloudflare Pages instead?**
A: Yes, but Workers is recommended for this stack (better control over Server Actions).

**Q: Do I need Cloudflare Pro plan?**
A: No, free tier is sufficient for most apps.

**Q: Can I use MySQL/MongoDB instead of PostgreSQL?**
A: Drizzle supports MySQL, but Neon PostgreSQL is recommended for edge compatibility.

**Q: How do I add background jobs?**
A: Use Cloudflare Queues or Cloudflare Durable Objects.

### Getting Help

1. Check [Cloudflare Workers Discord](https://discord.gg/cloudflaredev)
2. Review [Better Auth docs](https://better-auth.com/docs)
3. Create issue in project GitHub repo
