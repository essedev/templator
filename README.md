# Templator

AI-first Next.js template for rapid development with authentication, database, and Cloudflare Workers deployment.

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

## Features

✅ **Authentication & RBAC**

- Email/password with NextAuth v5
- Role-Based Access Control (user/editor/admin)
- Protected routes with middleware
- Session management with JWT

✅ **Database**

- Drizzle ORM with Neon PostgreSQL
- Type-safe queries
- Migrations with Drizzle Kit

✅ **UI Components**

- shadcn/ui components library
- Dark mode support (next-themes)
- Responsive design
- Toast notifications (Sonner)

✅ **Feature Modules**

- Contact form with Server Actions
- Newsletter signup with unsubscribe management
- Blog system with draft/publish workflow
- Profile management (all users)
- User management (admin only - role assignment)
- Email notifications (mock by default)

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

\`\`\`bash
git clone <your-repo>
cd templator
pnpm install
\`\`\`

### 2. Environment Setup

Create \`.env\` file:

\`\`\`bash

# Database (Neon PostgreSQL)

DATABASE_URL="postgresql://..."

# NextAuth

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="run: openssl rand -base64 32"

# Email (optional - mock by default)

ADMIN_EMAIL="admin@yourdomain.com"

# RESEND_API_KEY="re_xxxxx" # Uncomment to enable real emails

\`\`\`

Generate NextAuth secret:
\`\`\`bash
openssl rand -base64 32
\`\`\`

### 3. Database Setup

\`\`\`bash

# Generate migration

pnpm db:generate

# Push to database

pnpm db:push

# Open Drizzle Studio (optional)

pnpm db:studio
\`\`\`

### 4. Run Development Server

\`\`\`bash
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

\`\`\`
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
\`\`\`

## Available Scripts

\`\`\`bash

# Development

pnpm dev # Start dev server with Turbopack
pnpm build # Production build
pnpm start # Start production server

# Code Quality

pnpm lint # Run ESLint
pnpm format # Format code with Prettier
pnpm format:check # Check code formatting
pnpm typecheck # TypeScript type checking

# Database

pnpm db:generate # Generate migrations
pnpm db:push # Push schema to database
pnpm db:studio # Open Drizzle Studio

# Cloudflare

pnpm deploy # Deploy to Cloudflare
pnpm preview # Preview Cloudflare build
pnpm cf-typegen # Generate Cloudflare types
\`\`\`

## Email Configuration

By default, emails are mocked (logged to console). To enable real emails:

1. Install Resend: \`pnpm add resend\`
2. Get API key from [Resend](https://resend.com)
3. Add to \`.env\`: \`RESEND_API_KEY=re_xxxxx\`
4. Uncomment code in \`src/lib/email.ts\`

See \`src/lib/email.ts\` for detailed instructions.

## Deployment

### Cloudflare Workers (Recommended)

**Why Cloudflare Workers?**

- Global edge network with zero cold starts
- Free tier: 100k requests/day
- Perfect match with Neon PostgreSQL
- OpenNext adapter maintains Next.js compatibility

**First-time setup:**

\`\`\`bash

# Login to Cloudflare

pnpm wrangler login

# Set secrets (don't use plain env vars for sensitive data)

pnpm wrangler secret put DATABASE_URL
pnpm wrangler secret put NEXTAUTH_SECRET
\`\`\`

**Deploy:**

\`\`\`bash

# Build and deploy to production

pnpm deploy

# Or preview before deploying

pnpm preview
\`\`\`

**Configuration:**

- Edit \`wrangler.jsonc\` for worker settings
- OpenNext config in \`open-next.config.ts\`

### Environment Variables

**Local development (\`.env\`):**
\`\`\`bash
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
ADMIN_EMAIL="admin@yourdomain.com"
\`\`\`

**Production (Cloudflare):**

Set secrets via Wrangler CLI (recommended):
\`\`\`bash
pnpm wrangler secret put DATABASE_URL
pnpm wrangler secret put NEXTAUTH_SECRET
pnpm wrangler secret put ADMIN_EMAIL
\`\`\`

Or set in Cloudflare dashboard → Workers → Settings → Variables and Secrets

**Required:**

- \`DATABASE_URL\` - Neon connection string
- \`NEXTAUTH_URL\` - Your production URL (e.g., https://yourapp.workers.dev)
- \`NEXTAUTH_SECRET\` - Same as local (use \`openssl rand -base64 32\`)

**Optional:**

- \`ADMIN_EMAIL\` - For contact form notifications
- \`RESEND_API_KEY\` - If using real email (instead of mock)

## Development Workflow

1. **Add new feature**:
   \`\`\`bash
   mkdir -p src/features/my-feature

   # Create: schema.ts, actions.ts, MyFeatureForm.tsx, README.md

   \`\`\`

2. **Add database table**:
   - Edit \`src/db/schema.ts\`
   - Run \`pnpm db:generate\`
   - Run \`pnpm db:push\`

3. **Add new page**:
   - Create in \`src/app/my-page/page.tsx\`
   - Add link to \`Navbar.tsx\`

4. **Validation loop** (before commit):
   \`\`\`bash
   pnpm format # Format code
   pnpm lint # Check linting
   pnpm typecheck # Check types
   pnpm build # Test build
   \`\`\`

## Documentation

See \`docs/\` folder for detailed guides:

- \`RBAC.md\` - Role-Based Access Control system (user/editor/admin)
- \`STACK.md\` - Technology choices and rationale (Drizzle, NextAuth, Cloudflare)
- \`SETUP.md\` - Detailed setup instructions from scratch
- \`ARCHITECTURE.md\` - Project structure and conventions
- \`EXAMPLES.md\` - Complete code examples with Drizzle + NextAuth
- \`SCRIPTS.md\` - Available npm scripts and workflows
- \`AI_WORKFLOW.md\` - Working with AI assistants
- \`recipes/\` - Common feature patterns

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
