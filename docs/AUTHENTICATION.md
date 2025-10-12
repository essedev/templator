# Authentication System

Complete guide to Better Auth authentication in Templator.

## Overview

This project uses **[Better Auth](https://better-auth.com)** - a modern, TypeScript-first authentication framework.

**Why Better Auth?**

- ✅ **Edge-compatible** - Native support for Cloudflare Workers
- ✅ **Framework-agnostic** - Works with any JavaScript framework
- ✅ **Type-safe** - Full TypeScript support with excellent type inference
- ✅ **Built-in features** - Email verification, password reset, rate limiting out-of-the-box
- ✅ **Actively maintained** - Modern alternative to Auth.js/NextAuth

**Note:** This project migrated from NextAuth to Better Auth for better edge compatibility and developer experience.

## Quick Start

### Required Environment Variables

```bash
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://..."

# Better Auth
BETTER_AUTH_SECRET="..."                     # Generate with: openssl rand -base64 32
BETTER_AUTH_URL="http://localhost:3000"      # Your app URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email Configuration (optional in development)
EMAIL_PROVIDER="mock"                        # "mock" (dev) or "resend" (production)
```

### Generate Auth Secret

```bash
openssl rand -base64 32
```

Add the output to your `.env` as `BETTER_AUTH_SECRET`.

## Files Structure

```
src/
├── app/
│   ├── api/auth/[...all]/
│   │   └── route.ts              # Better Auth API routes
│   ├── login/page.tsx            # Login page
│   ├── register/page.tsx         # Registration page
│   ├── forgot-password/page.tsx  # Request password reset
│   ├── reset-password/page.tsx   # Reset password with token
│   └── verify-email/page.tsx     # Email verification
├── lib/
│   ├── auth.ts                   # Server-side auth config
│   ├── auth-client.ts            # Client-side auth hooks
│   ├── rbac.ts                   # RBAC helper (requireAuth)
│   ├── password.ts               # PBKDF2 password hashing
│   └── emails/
│       └── auth-emails.ts        # Auth email senders
├── middleware.ts                 # Edge-compatible middleware
└── types/auth.d.ts               # Auth type definitions
```

## Server Configuration

**File:** `src/lib/auth.ts`

```typescript
export const auth = betterAuth({
  // PostgreSQL with Drizzle ORM
  database: drizzleAdapter(db, { provider: "pg" }),

  // Email/password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: EMAIL_PROVIDER === "resend",
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({ user, url });
    },
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({ user, url });
    },
  },

  // Custom PBKDF2 password hashing (Cloudflare Workers compatible)
  password: {
    hash: async (password) => await hashPassword(password),
    verify: async (password, hash) => await verifyPassword(password, hash),
  },

  // RBAC: Custom role field
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "user",
        input: false, // Can't be set on signup (security)
      },
    },
  },

  // Rate limiting (database-backed for edge compatibility)
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    storage: "database",
  },
});
```

## Core Features

### 1. Email/Password Authentication

#### Registration

```typescript
// Client-side (src/app/register/page.tsx)
import { signUp } from "@/lib/auth-client";

const result = await signUp.email({
  email: "user@example.com",
  password: "securepassword",
  name: "John Doe",
});
```

**Flow:**

1. User fills registration form
2. Server Action creates user with `role: "user"` (default)
3. Password is hashed with PBKDF2
4. User is auto-logged in
5. (Optional) Email verification sent if `EMAIL_PROVIDER="resend"`

#### Login

```typescript
// Client-side (src/app/login/page.tsx)
import { signIn } from "@/lib/auth-client";

const result = await signIn.email({
  email: "user@example.com",
  password: "password",
});
```

**Flow:**

1. User enters credentials
2. Better Auth validates password
3. Session cookie created (`better-auth.session_token`)
4. Redirected to dashboard

### 2. Session Management

#### Getting Session (Server)

```typescript
// Server Components or Server Actions
import { getSession } from "@/lib/auth";

export default async function MyPage() {
  const session = await getSession();

  if (!session) {
    // User not authenticated
  }

  const user = session.user; // { id, email, name, role, ... }
}
```

#### Getting Session (Client)

```typescript
"use client";

import { useSession } from "@/lib/auth-client";

export function UserProfile() {
  const { data: session, isPending } = useSession();

  if (isPending) return <div>Loading...</div>;
  if (!session) return <div>Not logged in</div>;

  return <div>Hello {session.user.name}</div>;
}
```

#### Sign Out

```typescript
"use client";

import { signOut } from "@/lib/auth-client";

async function handleSignOut() {
  await signOut();
  router.push("/login");
}
```

### 3. Role-Based Access Control (RBAC)

This project includes a complete RBAC system with three roles: `user`, `editor`, and `admin`.

**For detailed RBAC documentation, see [`RBAC.md`](./RBAC.md).**

Quick examples:

#### Server-Side Protection

```typescript
// app/dashboard/users/page.tsx
import { requireAuth } from "@/lib/rbac";

export default async function UsersPage() {
  const session = await requireAuth(["admin"]);
  // Only admin can access this page
  return <div>Admin content</div>;
}
```

#### Client-Side Conditional Rendering

```typescript
"use client";

import { RoleGateClient } from "@/components/auth";

export function DashboardMenu() {
  return (
    <nav>
      <MenuItem href="/dashboard">Home</MenuItem>

      <RoleGateClient allowedRoles={["editor", "admin"]}>
        <MenuItem href="/dashboard/blog">Blog</MenuItem>
      </RoleGateClient>

      <RoleGateClient allowedRoles={["admin"]}>
        <MenuItem href="/dashboard/users">Users</MenuItem>
      </RoleGateClient>
    </nav>
  );
}
```

## Database Schema

Better Auth automatically manages these tables:

```sql
-- Users
CREATE TABLE "user" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password TEXT, -- PBKDF2 hashed
  role TEXT DEFAULT 'user', -- Custom field (user/editor/admin)
  "emailVerified" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Sessions
CREATE TABLE "session" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  token TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Verification tokens (email verification & password reset)
CREATE TABLE "verification" (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);
```

## Basic Troubleshooting

### "Session not found" errors

**Cause:** Missing `BETTER_AUTH_SECRET`

**Fix:**

```bash
openssl rand -base64 32
# Add to .env as BETTER_AUTH_SECRET
```

### Login redirects to same page

**Cause:** Cookie not being set correctly

**Fix:**

1. Check `BETTER_AUTH_URL` matches your app URL
2. Clear browser cookies and try again
3. Verify `BETTER_AUTH_SECRET` is set

### TypeScript errors with session

**Cause:** Missing type definitions

**Fix:** Ensure `src/types/auth.d.ts` exists and extends Better Auth types:

```typescript
// src/types/auth.d.ts
import type { Session, User } from "better-auth/types";

declare module "better-auth/types" {
  interface Session {
    user: User & {
      role: "user" | "editor" | "admin";
    };
  }
}
```

## Testing Authentication

### Manual Testing

1. **Registration:**
   - Go to `/register`
   - Create account
   - Should auto-login and redirect to `/`

2. **Login:**
   - Go to `/login`
   - Enter credentials
   - Should redirect to `/`

3. **Protected Routes:**
   - Try accessing `/dashboard/users` without admin role
   - Should redirect to `/dashboard`

4. **Sign Out:**
   - Click "Sign Out" in navbar
   - Should redirect to `/login`

## API Reference

### Server-Side

```typescript
import { getSession } from "@/lib/auth";
import { requireAuth } from "@/lib/rbac";

// Get current session (Server Components/Actions)
const session = await getSession();
// Returns: { user: { id, email, name, role, ... }, ... } | null

// Require authentication (any role)
const session = await requireAuth();

// Require specific role(s)
const session = await requireAuth(["admin"]);
const session = await requireAuth(["editor", "admin"]);
```

### Client-Side

```typescript
import { useSession, signIn, signUp, signOut } from "@/lib/auth-client";

// Hooks
const { data: session, isPending } = useSession();

// Methods
await signIn.email({ email, password });
await signUp.email({ email, password, name });
await signOut();
```

## Related Documentation

- **Advanced auth flows:** [`AUTHENTICATION_ADVANCED.md`](./AUTHENTICATION_ADVANCED.md)
- **RBAC system:** [`RBAC.md`](./RBAC.md)
- **Middleware:** [`MIDDLEWARE.md`](./MIDDLEWARE.md)
- **Email system:** [`EMAIL_SYSTEM.md`](./EMAIL_SYSTEM.md)
- **Deployment:** [`DEPLOYMENT.md`](./DEPLOYMENT.md)

## Resources

- [Better Auth Documentation](https://better-auth.com/docs)
- [Better Auth GitHub](https://github.com/better-auth/better-auth)
- [Next.js 15 App Router](https://nextjs.org/docs)
- [Drizzle ORM](https://orm.drizzle.team)
