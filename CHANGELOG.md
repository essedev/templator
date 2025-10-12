# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2025-10-12

### Changed

- **BREAKING**: Migrated authentication from NextAuth v5 to Better Auth v1
  - Better edge compatibility with Cloudflare Workers
  - Improved TypeScript support and developer experience
  - Built-in email verification and password reset flows
  - Custom PBKDF2 password hashing (100k iterations)
  - Edge-compatible rate limiting with database storage
- Updated all authentication-related pages and components to use Better Auth client
- Refactored database schema to use Better Auth naming conventions (snake_case)
- Enhanced RBAC system with Better Auth's custom fields
- Simplified authentication middleware with Better Auth session handling
- Updated all feature modules (auth, blog, contact, newsletter, profile, users) to work with Better Auth

### Added

- New authentication documentation:
  - `docs/AUTHENTICATION.md` - Complete Better Auth implementation guide
  - `docs/AUTHENTICATION_ADVANCED.md` - Advanced features and customization
  - `docs/MIDDLEWARE.md` - Middleware and protected routes guide
  - `docs/DEPLOYMENT.md` - Deployment configuration for Better Auth
- Better Auth client (`src/lib/auth-client.ts`) for client-side authentication
- Better Auth API route (`src/app/api/auth/[...all]/route.ts`)
- Custom email templates for Better Auth (`src/lib/emails/auth-emails.ts`)
- New RBAC helper (`src/lib/rbac.ts`) with Better Auth integration
- Improved auth verification and password reset flows (searchParams-based)
- Enhanced feature READMEs with Better Auth examples and best practices

### Removed

- NextAuth v5 and @auth/drizzle-adapter dependencies
- Legacy NextAuth route (`src/app/api/auth/[...nextauth]/route.ts`)
- Legacy NextAuth type definitions (`src/types/next-auth.d.ts`)
- Legacy email actions file (`src/features/auth/email-actions.ts`)
- Legacy token-based verification/reset routes (migrated to searchParams)
- `docs/EXAMPLES.md` (content redistributed to feature READMEs)

### Fixed

- Edge runtime compatibility issues with authentication flows
- Session handling in middleware for protected routes
- Type safety improvements across authentication system

## [0.1.2] - 2025-10-10

### Added

- Claude Code slash commands:
  - `/changelog` command to automatically update CHANGELOG.md with recent changes
  - `/release` command for streamlined version releases

### Changed

- Improved `/changelog` command with better formatting instructions and [Unreleased] section handling

### Fixed

- Fixed Next.js metadataBase warning by ensuring metadataBase is always set in metadata configuration
- Social Open Graph and Twitter Card images now properly resolve with absolute URLs

## [0.1.1] - 2025-10-10

### Added

- SEO essentials:
  - Dynamic `robots.txt` with search engine directives
  - Dynamic `sitemap.xml` with static and blog routes
  - Enhanced metadata utility with Open Graph and Twitter Cards support
  - Improved metadata across all pages (homepage, blog, pricing, contact)
- Security headers:
  - X-DNS-Prefetch-Control for DNS prefetching
  - Strict-Transport-Security (HSTS) for HTTPS enforcement
  - X-Frame-Options to prevent clickjacking
  - X-Content-Type-Options to prevent MIME sniffing
  - Referrer-Policy for referrer information control
  - Permissions-Policy to disable unused browser features

### Changed

- Migrated from `next lint` to ESLint CLI for future Next.js 16 compatibility
- Updated ESLint configuration to exclude build artifacts (.open-next, .wrangler, drizzle)

## [0.1.0] - 2025-10-10

### Added

- Initial release of Templator
- Next.js 15 with App Router and React 19
- TypeScript with strict mode
- Tailwind CSS 4 with shadcn/ui components
- Dark mode support with next-themes
- Authentication system:
  - NextAuth v5 with Drizzle adapter
  - Email/password authentication
  - Email verification flow
  - Password reset flow
  - Session management with JWT
- Role-Based Access Control (RBAC):
  - Three roles: user, editor, admin
  - Permission system with role gates
  - Protected routes with middleware
- Database:
  - Drizzle ORM with Neon PostgreSQL
  - Type-safe queries
  - Migrations with Drizzle Kit
  - Edge-compatible architecture
- Email system:
  - React Email templates
  - Mock mode for development
  - Resend integration for production
  - Email templates for auth, blog, contact, newsletter
- Feature modules:
  - Blog system with draft/publish workflow
  - Contact form with Server Actions
  - Newsletter with double opt-in
  - Profile management
  - User management (admin only)
- Pages:
  - Landing page with Hero, Features, CTA
  - Pricing page
  - Contact page
  - Blog listing and post pages
  - Dashboard with role-based sections
  - Authentication pages (login/register/forgot-password)
- Developer Experience:
  - Turbopack for fast development
  - ESLint + Prettier configured
  - Code quality scripts (lint, format, typecheck)
- Deployment:
  - Cloudflare Workers support with OpenNext
  - Wrangler configuration
  - Environment variables setup
- Documentation:
  - Comprehensive README
  - Architecture guide
  - RBAC system docs
  - Tech stack rationale
  - Setup instructions
  - Component reference
  - Code examples
  - AI workflow guide
  - Recipe patterns

[0.2.0]: https://github.com/yourusername/templator/releases/tag/v0.2.0
[0.1.2]: https://github.com/yourusername/templator/releases/tag/v0.1.2
[0.1.1]: https://github.com/yourusername/templator/releases/tag/v0.1.1
[0.1.0]: https://github.com/yourusername/templator/releases/tag/v0.1.0
