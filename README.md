# Templator

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)

AI-first Next.js template for rapid development with authentication, database, and Cloudflare Workers deployment.

⭐ **Star this repo** if you find it useful!

## 📋 Table of Contents

- [Who Is This For?](#-who-is-this-for)
- [Conscious Trade-offs & Known Limitations](#️-conscious-trade-offs--known-limitations)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Email Configuration](#email-configuration)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Comparison](#-comparison)

## 🎯 Who Is This For?

**Perfect for:**

- 🚀 **Startup founders** building MVPs rapidly with AI assistance
- 💼 **Indie hackers** needing auth + RBAC + email flows out-of-the-box
- 🤖 **AI-first developers** using Cursor, Claude Code, GitHub Copilot
- 🎓 **Learners** exploring modern Next.js App Router + Drizzle architecture

**Not ideal for:**

- Teams requiring extensive testing infrastructure from day 1
- Projects with highly custom authentication requirements
- Applications needing complex multi-tenancy from the start
- Real-time applications (WebSocket, live collaboration)
- Heavy computation workloads (video processing, ML inference)

## ⚠️ Conscious Trade-offs & Known Limitations

This template prioritizes **speed and simplicity** for MVP development. Here's what you should know before choosing Templator:

### What's NOT Included (By Design)

**Testing Infrastructure**

- No Vitest/Jest, Testing Library, or E2E tests
- **Why**: 90% of MVPs don't need tests day 1. TypeScript + ESLint catch most bugs.
- **When to add**: Before first paying customers or when team grows beyond 3 developers
- See [docs/LIMITATIONS.md](docs/LIMITATIONS.md#testing-infrastructure) for migration guide

**Error Monitoring & Analytics**

- No Sentry, Axiom, or analytics integration
- **Why**: Adds complexity and cost for early prototypes
- **When to add**: Week 1 of production traffic
- See [docs/LIMITATIONS.md](docs/LIMITATIONS.md#error-monitoring) for setup guide

**Advanced Features**

- ❌ WebSocket/real-time (Cloudflare Workers limitation)
- ❌ File uploads (needs R2 bucket configuration)
- ❌ Payment processing (Stripe integration needed)
- ❌ Multi-tenancy (single-organization RBAC only)
- ❌ Internationalization (English-only by default)
- **Why**: Keep template focused, add these when business validated

### Cloudflare Workers Constraints

**Free Tier Limits** (100,000 requests/day):

- 10ms CPU time per request
- 128MB memory
- 1MB response size
- Good for: Content sites, forms, auth flows

**Paid Tier** ($5/mo for 10M requests):

- 30s CPU time (Workers Standard) or 15min (Workers Unbound)
- Still 128MB memory
- 25MB+ response size
- Good for: API-heavy apps, complex queries

**What Doesn't Work**: WebSocket, filesystem access, long-running background jobs

See [docs/LIMITATIONS.md](docs/LIMITATIONS.md#cloudflare-workers-constraints) for workarounds and alternatives.

### When NOT to Use Templator

❌ **Enterprise with strict compliance** (SOC2, HIPAA day 1) → Use custom build or commercial starter
❌ **Complex B2B SaaS** (multi-tenancy, teams, 10+ permission levels) → Fork and extend RBAC
❌ **Real-time apps** (chat, multiplayer, live collaboration) → Consider [Supabase integration](docs/SUPABASE_INTEGRATION.md) or traditional server
❌ **Heavy computation** (video encoding, ML inference) → Use serverless functions or dedicated servers

✅ **Perfect for**: Content sites, SaaS MVPs, internal tools, API-first apps, landing pages with auth

For detailed limitations and migration paths, see [docs/LIMITATIONS.md](docs/LIMITATIONS.md).
For adding real-time features, see [docs/SUPABASE_INTEGRATION.md](docs/SUPABASE_INTEGRATION.md).

## Tech Stack

### Core

- **Next.js 15** - App Router, Server Components, Server Actions
- **React 19** - Latest React with Suspense and Transitions
- **TypeScript** - Strict mode with full type safety
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible components

### Database & Auth

- **Drizzle ORM** - TypeScript-first ORM with edge support
- **Neon PostgreSQL** - Serverless Postgres with branching
- **Better Auth** - Modern authentication with built-in security

### Deployment

- **Cloudflare Workers** - Edge deployment with zero cold starts
- **OpenNext** - Next.js adapter for Cloudflare

### Developer Experience

- **Turbopack** - Ultra-fast bundler for development (built into Next.js 15)
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **React Hook Form + Zod** - Type-safe form validation

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔐 Authentication & RBAC

- ✅ Email/password with Better Auth
- ✅ Email verification & password reset (built-in)
- ✅ Role-Based Access Control (user/editor/admin)
- ✅ Protected routes with middleware
- ✅ Rate limiting for security
- ✅ Custom PBKDF2 hashing (Cloudflare Workers compatible)

</td>
<td width="50%">

### 📧 Email System

- ✅ React Email templates
- ✅ Mock mode for development
- ✅ Resend integration for production
- ✅ Transactional email flows
- ✅ Password reset & verification

</td>
</tr>
<tr>
<td>

### 🗄️ Database

- ✅ Drizzle ORM with Neon PostgreSQL
- ✅ Type-safe queries with TypeScript
- ✅ Migrations with Drizzle Kit
- ✅ Edge-compatible architecture

</td>
<td>

### 🎨 UI Components

- ✅ shadcn/ui components library
- ✅ Dark mode support (next-themes)
- ✅ Responsive design
- ✅ Toast notifications (Sonner)

</td>
</tr>
<tr>
<td>

### 📝 Feature Modules

- ✅ Contact form with Server Actions
- ✅ Newsletter with double opt-in
- ✅ Blog system (draft/publish workflow)
- ✅ Profile management
- ✅ User management (admin only)

</td>
<td>

### 🚀 Developer Experience

- ✅ AI-optimized architecture
- ✅ Type-safe end-to-end
- ✅ Hot reload with Turbopack
- ✅ ESLint + Prettier configured
- ✅ Comprehensive documentation

</td>
</tr>
<tr>
<td colspan="2">

### 🔒 Security & SEO

- ✅ Security headers configured (HSTS, X-Frame-Options, CSP, etc.)
- ✅ Dynamic sitemap.xml with blog posts
- ✅ robots.txt with search engine directives
- ✅ Open Graph & Twitter Cards metadata
- ✅ Structured logging for debugging

</td>
</tr>
</table>

✅ **Pages**

- Landing page with Hero, Features, CTA
- Pricing page
- Contact page
- Blog listing and individual post pages
- Authentication pages (login/register)
- Dashboard with role-based sections
  - Dashboard overview (all users)
  - Profile management (all users)
  - Blog management (editor/admin)
    - List all posts (draft + published)
    - Create new post
    - Edit existing post
    - Delete post
  - Newsletter subscribers (editor/admin)
  - Contact messages (editor/admin)
  - User management (admin only)

## Quick Start

### 1. Clone & Install

```bash
# Using this template on GitHub (recommended)
# Click "Use this template" button at the top of this repo

# Or clone directly
git clone https://github.com/yourusername/templator.git
cd templator
pnpm install
```

### 2. Environment Setup

Create `.env` file:

```bash
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://..."

# Better Auth
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="run: openssl rand -base64 32"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email (optional - mock by default)
ADMIN_EMAIL="admin@yourdomain.com"
# RESEND_API_KEY="re_xxxxx" # Uncomment to enable real emails
```

Generate Better Auth secret:

```bash
openssl rand -base64 32
```

### 3. Database Setup

```bash
# Generate migration
pnpm db:generate

# Push to database
pnpm db:push

# Open Drizzle Studio (optional)
pnpm db:studio
```

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│ ├── (routes)/ # Page routes
│ ├── dashboard/ # Protected dashboard with RBAC
│ ├── api/auth/ # Better Auth handler
│ ├── layout.tsx # Root layout with providers
│ └── providers.tsx # Client providers (Theme)
├── components/
│ ├── ui/ # shadcn/ui components
│ ├── layout/ # Navbar, Footer, ThemeToggle
│ ├── auth/ # RBAC components (RoleGate, RoleGateClient)
│ ├── dashboard/ # Dashboard components (DashboardNav)
│ └── common/ # Shared components (PageHeader, Section)
├── features/
│ ├── auth/ # Authentication (schema, actions)
│ ├── users/ # User management (admin actions)
│ ├── profile/ # Profile editing (actions, form)
│ ├── blog/ # Blog posts (schema, actions, PostForm)
│ ├── contact/ # Contact form feature
│ └── newsletter/ # Newsletter feature
├── lib/
│ ├── auth.ts # Better Auth config
│ ├── auth-client.ts # Client-side hooks
│ ├── permissions.ts # RBAC permission system
│ ├── password.ts # PBKDF2 hashing (Cloudflare Workers compatible)
│ └── utils.ts # Utility functions (cn, etc.)
├── db/
│ ├── schema.ts # Drizzle schema (users with roles)
│ └── index.ts # Database client
├── hooks/ # Custom React hooks
└── types/ # TypeScript types (NextAuth extensions)
```

## Available Scripts

```bash
# Development
pnpm dev              # Start dev server with Turbopack
pnpm build            # Production build
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint
pnpm format           # Format code with Prettier
pnpm format:check     # Check code formatting
pnpm typecheck        # TypeScript type checking

# Database
pnpm db:generate      # Generate migrations
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Drizzle Studio

# Cloudflare
pnpm deploy           # Deploy to Cloudflare
pnpm preview          # Preview Cloudflare build
pnpm cf-typegen       # Generate Cloudflare types
```

## 📧 Email Configuration

By default, emails are mocked (logged to console). To enable real emails with Resend:

> **Note:** Resend is already installed in this template.

1. Get API key from [Resend](https://resend.com)
2. Add to `.env`:
   ```bash
   RESEND_API_KEY="re_xxxxx"
   EMAIL_FROM="noreply@yourdomain.com"
   EMAIL_PROVIDER="resend"
   ```
3. Verify your domain in Resend dashboard (required for production)

See [`docs/EMAIL_SYSTEM.md`](docs/EMAIL_SYSTEM.md) for detailed configuration and templates guide.

## Deployment

### Cloudflare Workers (Recommended)

**Why Cloudflare Workers?**

- Global edge network with zero cold starts
- Free tier: 100k requests/day
- Perfect match with Neon PostgreSQL
- OpenNext adapter maintains Next.js compatibility

**First-time setup:**

```bash
# Login to Cloudflare
pnpm wrangler login

# Set secrets (don't use plain env vars for sensitive data)
pnpm wrangler secret put DATABASE_URL
pnpm wrangler secret put NEXTAUTH_SECRET
```

**Deploy:**

```bash
# Build and deploy to production
pnpm deploy

# Or preview before deploying
pnpm preview
```

**Configuration:**

- Edit `wrangler.jsonc` for worker settings
- OpenNext config in `open-next.config.ts`

### Environment Variables

**Local development (`.env`):**

```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
ADMIN_EMAIL="admin@yourdomain.com"
```

**Production (Cloudflare):**

Set secrets via Wrangler CLI (recommended):

```bash
pnpm wrangler secret put DATABASE_URL
pnpm wrangler secret put NEXTAUTH_SECRET
pnpm wrangler secret put ADMIN_EMAIL
```

Or set in Cloudflare dashboard → Workers → Settings → Variables and Secrets

**Required:**

- `DATABASE_URL` - Neon connection string
- `BETTER_AUTH_URL` - Your production URL (e.g., https://yourapp.workers.dev)
- `BETTER_AUTH_SECRET` - Same as local (use `openssl rand -base64 32`)
- `NEXT_PUBLIC_APP_URL` - Same as BETTER_AUTH_URL

**Optional:**

- `ADMIN_EMAIL` - For contact form notifications
- `RESEND_API_KEY` - If using real email (instead of mock)

## Development Workflow

1. **Add new feature**:

   ```bash
   mkdir -p src/features/my-feature
   # Create: schema.ts, actions.ts, MyFeatureForm.tsx, README.md
   ```

2. **Add database table**:
   - Edit `src/db/schema.ts`
   - Run `pnpm db:generate`
   - Run `pnpm db:push`

3. **Add new page**:
   - Create in `src/app/my-page/page.tsx`
   - Add link to `Navbar.tsx`

4. **Validation loop** (before commit):
   ```bash
   pnpm format      # Format code
   pnpm lint        # Check linting
   pnpm typecheck   # Check types
   pnpm build       # Test build
   ```

## Documentation

See `docs/` folder for detailed guides:

- **`LIMITATIONS.md`** - Known limitations, platform constraints, and migration paths
- **`SUPABASE_INTEGRATION.md`** - Adding real-time, storage, and enhanced database features with Supabase
- **`AUTHENTICATION.md`** - Complete Better Auth guide (email/password, verification, password reset)
- **`AUTHENTICATION_ADVANCED.md`** - Advanced auth flows (security, edge compatibility)
- **`RBAC.md`** - Role-Based Access Control system (user/editor/admin)
- **`ARCHITECTURE.md`** - Project structure and conventions
- **`AI_WORKFLOW.md`** - Working with AI assistants (includes `/changelog` and `/release` commands)
- `STACK.md` - Technology choices and rationale (Drizzle, Better Auth, Cloudflare)
- `DEPLOYMENT.md` - Cloudflare Workers deployment guide
- `MIDDLEWARE.md` - Authentication middleware (edge-compatible)
- `EMAIL_SYSTEM.md` - Email configuration and templates
- `recipes/` - Step-by-step guides for common tasks

## 📊 Comparison

How does Templator compare to other Next.js starters?

| Feature                | Templator                     | create-t3-app     | Next.js SaaS Starter |
| ---------------------- | ----------------------------- | ----------------- | -------------------- |
| **Auth System**        | ✅ Better Auth + RBAC         | ✅ NextAuth       | ⚠️ Custom            |
| **Email Verification** | ✅ Built-in                   | ❌ Manual setup   | ❌ Manual setup      |
| **Password Reset**     | ✅ Built-in                   | ❌ Manual setup   | ❌ Manual setup      |
| **Role-Based Access**  | ✅ 3-tier RBAC                | ❌ DIY            | ❌ DIY               |
| **Email Templates**    | ✅ React Email                | ❌                | ❌                   |
| **Edge Deployment**    | ✅ Cloudflare Workers         | ⚠️ Vercel-focused | ⚠️ Vercel-focused    |
| **AI-Optimized**       | ✅ Feature-based architecture | ❌                | ❌                   |
| **Documentation**      | ✅ Comprehensive docs/        | ⚠️ Basic          | ⚠️ Basic             |
| **Database ORM**       | Drizzle                       | Drizzle/Prisma    | Prisma               |
| **Blog System**        | ✅ Built-in                   | ❌                | ❌                   |

## Tech Stack Details

**Why Drizzle over Prisma?**

- TypeScript-first with native type inference
- Better performance for serverless/edge
- Smaller bundle size
- Perfect Cloudflare Workers compatibility

**Why Better Auth?**

- Modern, actively maintained (Auth.js/NextAuth is now maintained by Better Auth team)
- Built-in rate limiting, email verification, password reset
- TypeScript-first with excellent type inference
- Cloudflare Workers compatible (custom PBKDF2 hashing)
- No SessionProvider wrapper needed

**Why Cloudflare Workers?**

- Global edge deployment
- Zero cold starts
- Generous free tier (100k req/day)
- Perfect with Neon PostgreSQL

## Credits

Built with:

- [Next.js](https://nextjs.org)
- [Drizzle ORM](https://orm.drizzle.team)
- [Better Auth](https://better-auth.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Cloudflare Workers](https://workers.cloudflare.com)
