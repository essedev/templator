# Templator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#contributing)

AI-first Next.js template for rapid development with authentication, database, and Cloudflare Workers deployment.

⭐ **Star this repo** if you find it useful!

## 📋 Table of Contents

- [Who Is This For?](#-who-is-this-for)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Email Configuration](#email-configuration)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Comparison](#-comparison)
- [Contributing](#-contributing)
- [License](#license)

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
- **NextAuth v5** - Authentication with Drizzle adapter

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

- ✅ Email/password with NextAuth v5
- ✅ Email verification & password reset
- ✅ Role-Based Access Control (user/editor/admin)
- ✅ Protected routes with middleware
- ✅ Session management with JWT

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

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="run: openssl rand -base64 32"

# Email (optional - mock by default)
ADMIN_EMAIL="admin@yourdomain.com"
# RESEND_API_KEY="re_xxxxx" # Uncomment to enable real emails
```

Generate NextAuth secret:
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
│ ├── api/auth/ # NextAuth handler
│ ├── layout.tsx # Root layout with providers
│ └── providers.tsx # Client providers (Theme, Session)
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
│ ├── auth.ts # NextAuth config
│ ├── permissions.ts # RBAC permission system
│ ├── utils.ts # Utility functions (cn, etc.)
│ └── email.ts # Email sending (mock by default)
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
- `NEXTAUTH_URL` - Your production URL (e.g., https://yourapp.workers.dev)
- `NEXTAUTH_SECRET` - Same as local (use `openssl rand -base64 32`)

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

- `RBAC.md` - Role-Based Access Control system (user/editor/admin)
- `STACK.md` - Technology choices and rationale (Drizzle, NextAuth, Cloudflare)
- `SETUP.md` - Detailed setup instructions from scratch
- `ARCHITECTURE.md` - Project structure and conventions
- `COMPONENTS.md` - Complete components reference (UI, layout, auth, dashboard)
- `EXAMPLES.md` - Complete code examples with Drizzle + NextAuth
- `SCRIPTS.md` - Available npm scripts and workflows
- `AI_WORKFLOW.md` - Working with AI assistants
- `recipes/` - Common feature patterns

## 📊 Comparison

How does Templator compare to other Next.js starters?

| Feature                | Templator                     | create-t3-app     | Next.js SaaS Starter |
| ---------------------- | ----------------------------- | ----------------- | -------------------- |
| **Auth System**        | ✅ NextAuth v5 + RBAC         | ✅ NextAuth       | ⚠️ Custom            |
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

**Why NextAuth v5?**

- Native Next.js 15 App Router support
- Official Drizzle adapter
- JWT + Database sessions
- Works on edge runtime

**Why Cloudflare Workers?**

- Global edge deployment
- Zero cold starts
- Generous free tier (100k req/day)
- Perfect with Neon PostgreSQL

## 🤝 Contributing

Contributions are welcome! This template is designed to be a starting point that grows with the community.

### How to Contribute

1. **Fork the repository**
2. **Create your feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** following the existing code style and conventions
4. **Test your changes** (`pnpm format && pnpm lint && pnpm typecheck && pnpm build`)
5. **Commit your changes** (`git commit -m 'Add amazing feature'`)
6. **Push to the branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Guidelines

- Follow the existing architecture and naming conventions
- Update documentation if you're adding new features
- Add examples in `docs/EXAMPLES.md` if relevant
- Keep features modular and self-contained
- Write clear commit messages

### Ideas for Contributions

- 📝 Additional feature modules (e.g., comments, analytics, payments)
- 🎨 New shadcn/ui component examples
- 📧 Additional email templates
- 📚 More recipes in `docs/recipes/`
- 🐛 Bug fixes and improvements
- 🌐 Internationalization support

## License

MIT

## Credits

Built with:

- [Next.js](https://nextjs.org)
- [Drizzle ORM](https://orm.drizzle.team)
- [NextAuth](https://next-auth.js.org)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Cloudflare Workers](https://workers.cloudflare.com)
