# Auth Feature

Complete authentication system using Better Auth with email/password and custom PBKDF2 hashing.

## Overview

This feature handles user authentication using Better Auth - a modern, edge-compatible authentication framework. Supports email/password credentials with email verification and password reset flows.

**Why Better Auth?**

- Edge-compatible (works on Cloudflare Workers)
- Built-in email verification and password reset
- Custom password hashing (PBKDF2 for edge compatibility)
- Database-backed rate limiting
- No SessionProvider needed
- Type-safe session handling

## Components

- **Login page** (`/login`) - Email/password sign in
- **Register page** (`/register`) - New user registration
- **Forgot password** (`/forgot-password`) - Request password reset
- **Reset password** (`/reset-password`) - Set new password
- **Email verification** (`/verify-email`) - Confirm email address

## Server Actions

### `signUp(credentials)`

Creates new user account via Better Auth API.

```typescript
// Better Auth handles this automatically
// Call via client SDK or form submission
await authClient.signUp.email({
  email: "user@example.com",
  password: "securepassword",
  name: "John Doe",
});
```

### `signIn(credentials)`

Authenticates user and creates session.

```typescript
await authClient.signIn.email({
  email: "user@example.com",
  password: "password",
});
```

### `signOut()`

Ends user session.

```typescript
import { signOut } from "@/lib/auth-client";

await signOut();
```

## Database Schema

Better Auth manages these tables automatically:

```typescript
// User table
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: userRoleEnum("role").default("user").notNull(), // Custom field for RBAC
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// Session table
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

// Account table (for OAuth providers)
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  password: text("password"), // Hashed password for email/password auth
  // ... OAuth tokens
});

// Verification table (email verification & password reset)
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});
```

## Configuration

### Environment Variables

Required in `.env`:

```bash
# Better Auth
BETTER_AUTH_SECRET="generate with: openssl rand -base64 32"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Database
DATABASE_URL="postgresql://..."

# Email (optional, defaults to mock)
EMAIL_PROVIDER="mock"  # or "resend" for production
RESEND_API_KEY="re_..."  # Only if EMAIL_PROVIDER="resend"
EMAIL_FROM="noreply@yourdomain.com"
```

### Better Auth Config

Main configuration in `src/lib/auth.ts`:

- **Adapter:** Drizzle adapter for PostgreSQL
- **Providers:** Email/password (OAuth ready to add)
- **Password hashing:** Custom PBKDF2 (edge-compatible)
- **Email verification:** Auto-enabled when `EMAIL_PROVIDER="resend"`
- **Rate limiting:** Database-backed (edge-compatible)
- **Custom fields:** `role` field for RBAC

## Usage Examples

### Check Authentication (Server Component)

```typescript
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  return <div>Welcome {session.user.email}</div>;
}
```

### Check Authentication with Role (Server Component)

```typescript
import { requireAuth } from "@/lib/rbac";

export default async function AdminPage() {
  const session = await requireAuth(["admin"]);

  return <div>Admin content for {session.user.email}</div>;
}
```

### Client-Side Session

```typescript
"use client";

import { useSession } from "@/lib/auth-client";

export function UserProfile() {
  const { data: session } = useSession();

  if (!session) return <div>Not logged in</div>;

  return <div>Hello {session.user.name}</div>;
}
```

### Sign Out

```typescript
"use client";

import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  return <button onClick={() => signOut()}>Sign Out</button>;
}
```

## Authentication Flows

### 1. Registration

1. User fills registration form
2. Better Auth creates user with `emailVerified: false`
3. If `EMAIL_PROVIDER="resend"`, verification email sent
4. User clicks link, email marked as verified
5. User can now log in

**Note:** Email verification is automatically enabled when `EMAIL_PROVIDER="resend"`.

### 2. Login

1. User enters email/password
2. Better Auth verifies credentials (PBKDF2)
3. Session created, cookie set (HttpOnly, Secure)
4. User redirected to dashboard

### 3. Password Reset

1. User requests reset at `/forgot-password`
2. Better Auth creates verification token
3. Reset email sent with token link
4. User clicks link, sets new password
5. Old password invalidated, user can log in

### 4. Email Verification

1. Better Auth sends verification email (if enabled)
2. User clicks verification link
3. `emailVerified` set to `true`
4. Account fully activated

## Security Features

### Password Hashing

Custom PBKDF2 implementation using Web Crypto API:

```typescript
// src/lib/password.ts
Algorithm: PBKDF2-SHA-256
Iterations: 100,000
Salt: 16 bytes (random per password)
Output: 32 bytes
```

**Why PBKDF2?**

- bcrypt not available on Cloudflare Workers
- Web Crypto API available on all edge runtimes
- NIST-approved, secure with high iteration count

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

### Session Security

- HttpOnly cookies (XSS protection)
- Secure flag in production (HTTPS only)
- SameSite: Lax (CSRF protection)
- 5-minute cookie cache for performance
- IP address and user agent tracking

### Verification Tokens

- Cryptographically random
- Time-limited expiration (1h for password reset)
- Single-use (deleted after use)
- Stored in database (`verification` table)

## Extending

### Add OAuth Provider

Better Auth supports multiple OAuth providers:

```bash
pnpm add better-auth
```

Then in `src/lib/auth.ts`:

```typescript
import { github } from "better-auth/providers";

export const auth = betterAuth({
  // ... existing config
  providers: [
    // Email/password (already configured)
    emailAndPassword: { ... },

    // Add OAuth
    github({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
});
```

Supported providers:

- GitHub, Google, Discord, Twitter
- Apple, Facebook, Microsoft
- 50+ providers via custom OAuth

### Add Two-Factor Authentication

Better Auth has built-in 2FA support:

```typescript
import { twoFactor } from "better-auth/plugins";

export const auth = betterAuth({
  // ... existing config
  plugins: [
    twoFactor({
      issuer: "YourApp",
      // TOTP (Google Authenticator compatible)
    }),
  ],
});
```

### Add Magic Link Login

Passwordless authentication via email:

```typescript
import { magicLink } from "better-auth/plugins";

export const auth = betterAuth({
  // ... existing config
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        // Send email with magic link
      },
    }),
  ],
});
```

## Performance

- Session cookie caching (5 minutes)
- Database connection pooling (Neon)
- Edge-compatible (no cold starts)
- Middleware cookie-only check (< 1ms)
- Full validation in Server Components

## Troubleshooting

### Email verification not working

**Check:**

1. `EMAIL_PROVIDER="resend"` in `.env`
2. `RESEND_API_KEY` is set
3. `EMAIL_FROM` matches verified domain in Resend
4. Check Resend dashboard for delivery errors

**In development:**

- `EMAIL_PROVIDER="mock"` logs emails to console
- Email verification automatically disabled in mock mode

### Session not persisting

**Check:**

1. `BETTER_AUTH_SECRET` is set (same value across restarts)
2. `BETTER_AUTH_URL` matches your app URL
3. Browser cookies enabled
4. HTTPS in production (cookies may not work on HTTP)

### Password reset not working

**Check:**

1. Email system configured (see troubleshooting above)
2. Token hasn't expired (1 hour default)
3. Token hasn't been used (single-use)
4. Check `verification` table in database

## Migration from NextAuth

If migrating from NextAuth:

1. **Database:** Tables are similar but with different names/structure
2. **Sessions:** Better Auth uses different cookie names
3. **API:** `auth()` → `getSession()`, `signOut()` remains similar
4. **Providers:** OAuth config slightly different
5. **Callbacks:** Better Auth uses different callback structure

See `docs/AUTHENTICATION.md` for detailed migration guide.

## See Also

- [`docs/AUTHENTICATION.md`](../../../docs/AUTHENTICATION.md) - Complete auth documentation
- [`docs/RBAC.md`](../../../docs/RBAC.md) - Role-based access control
- [`docs/EMAIL_SYSTEM.md`](../../../docs/EMAIL_SYSTEM.md) - Email configuration
- [`docs/MIDDLEWARE.md`](../../../docs/MIDDLEWARE.md) - Route protection
