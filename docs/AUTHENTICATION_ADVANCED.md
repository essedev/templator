# Authentication System - Advanced

Advanced authentication flows, security, and edge compatibility.

## Overview

This document covers advanced Better Auth features:

- Email verification flows
- Password reset implementation
- Security best practices (PBKDF2, rate limiting)
- Cloudflare Workers edge compatibility
- Advanced troubleshooting

For basic authentication setup, see [`AUTHENTICATION.md`](./AUTHENTICATION.md).

## Email Verification

### Configuration

Email verification is **automatically enabled** when you set `EMAIL_PROVIDER="resend"`:

```bash
# .env
EMAIL_PROVIDER="resend"       # Enables verification
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@yourdomain.com"
```

**In development** (mock mode), verification is disabled for better developer experience.

### How It Works

**1. User registers:**

```typescript
await signUp.email({
  email: "user@example.com",
  password: "password",
  name: "John Doe",
});
```

**2. Better Auth sends verification email** (if `EMAIL_PROVIDER="resend"`):

- Token created in `verification` table
- Email sent with link: `https://yourapp.com/verify-email?token=...`

**3. User clicks link:**

- Redirected to `/verify-email` page
- Token validated by Better Auth

**4. Email verified:**

- `user.emailVerified` updated to `true`
- Token deleted (single-use)

### Manual Trigger

```typescript
import { authClient } from "@/lib/auth-client";

await authClient.sendVerificationEmail({
  email: "user@example.com",
});
```

### Token Expiration

- **Default:** Configurable in Better Auth
- **Recommended:** 24 hours for email verification
- **Storage:** `verification` table

## Password Reset

### Flow Overview

**1. User requests reset** at `/forgot-password`:

```typescript
import { forgetPassword } from "@/lib/auth-client";

await forgetPassword({
  email: "user@example.com",
  redirectTo: "/reset-password",
});
```

**2. Better Auth sends reset email:**

- Token created in `verification` table
- Email with link: `https://yourapp.com/reset-password?token=...`
- Token expires in **1 hour** (Better Auth default)

**3. User clicks link** → redirected to `/reset-password` page

**4. User enters new password:**

```typescript
import { resetPassword } from "@/lib/auth-client";

await resetPassword({
  newPassword: "newsecurepassword",
  token: searchParams.get("token"),
});
```

**5. Password updated:**

- Old password immediately invalidated
- Token deleted (single-use)
- User can login with new password

### Security Features

- ✅ Doesn't reveal if email exists (security best practice)
- ✅ One-time use tokens
- ✅ 1-hour expiration
- ✅ Old password immediately invalidated
- ✅ Automatic cleanup of expired tokens

## Security Best Practices

### 1. Password Hashing - PBKDF2

**Why PBKDF2 instead of bcrypt?**

This project uses **custom PBKDF2** implementation (`src/lib/password.ts`) because:

- ✅ **Edge-compatible** - Uses Web Crypto API (available in Cloudflare Workers)
- ✅ **Standard** - NIST-approved algorithm
- ✅ **Secure** - Properly salted with high iteration count
- ❌ **bcrypt** relies on Node.js native crypto (not available on edge)

**Technical Specifications:**

- **Algorithm:** PBKDF2-SHA-256
- **Iterations:** 100,000 (OWASP recommended as of 2024)
- **Salt:** 16 bytes (cryptographically random per password)
- **Output:** 32 bytes derived key
- **Storage format:** `iterations:salt:hash` (all hex-encoded)

#### Critical: Better Auth Configuration

> **⚠️ IMPORTANT:** Custom password hashing functions **MUST** be configured inside `emailAndPassword`, **NOT** at the root level of the Better Auth config.

```typescript
// ✅ CORRECT - Inside emailAndPassword
export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (password) => await hashPassword(password),
      verify: async ({ password, hash }) => await verifyPassword(password, hash),
    },
  },
});

// ❌ WRONG - At root level (will be IGNORED!)
export const auth = betterAuth({
  password: {
    // This is IGNORED! Better Auth will use default scrypt instead.
    hash: async (password) => await hashPassword(password),
    verify: async ({ password, hash }) => await verifyPassword(password, hash),
  },
});
```

**Why this matters:** If placed at the root level, Better Auth silently ignores the custom hashing and uses its default scrypt algorithm. This causes:

1. **Registration:** Passwords are hashed with scrypt (not PBKDF2)
2. **Login:** Verification with PBKDF2 fails because hash format doesn't match
3. **Result:** Users cannot log in after registering

This is a common misconfiguration that's hard to debug because:

- No error is thrown
- Registration appears to work
- Login silently fails with "invalid credentials"

**Verification:** Check `src/lib/auth.ts` and ensure `password` config is inside `emailAndPassword`.

#### Implementation Details

```typescript
// src/lib/password.ts
const ITERATIONS = 100000; // OWASP recommended minimum
const HASH_LENGTH = 32; // 256 bits
const SALT_LENGTH = 16; // 128 bits

export async function hashPassword(password: string): Promise<string> {
  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  // Convert password to buffer
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import key for PBKDF2
  const key = await crypto.subtle.importKey("raw", passwordBuffer, { name: "PBKDF2" }, false, [
    "deriveBits",
  ]);

  // Derive hash
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    key,
    HASH_LENGTH * 8 // bits
  );

  // Format: iterations:salt:hash (all hex-encoded)
  const hashHex = bufferToHex(new Uint8Array(hashBuffer));
  const saltHex = bufferToHex(salt);
  return `${ITERATIONS}:${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // Parse stored hash
  const [iterationsStr, saltHex, hashHex] = storedHash.split(":");
  const iterations = parseInt(iterationsStr, 10);
  const salt = hexToBuffer(saltHex);

  // Derive hash with same parameters
  const key = await crypto.subtle.importKey(/* ... */);
  const computedHash = await crypto.subtle.deriveBits(/* ... */);

  // Timing-safe comparison (prevents timing attacks)
  return timingSafeEqual(computedHash, hashHex);
}
```

#### Timing-Safe Comparison

The `verifyPassword` function uses constant-time comparison to prevent timing attacks:

```typescript
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
```

**Why timing-safe?** Regular string comparison (`===`) returns early on first mismatch. An attacker can measure response time to guess characters one by one. Constant-time comparison always takes the same time regardless of where strings differ.

#### Migrating from bcrypt

If you have existing bcrypt passwords and need to migrate:

```typescript
// During login, check format and rehash if needed
export async function verifyAndMigrate(password: string, storedHash: string): Promise<boolean> {
  // Check if it's old bcrypt format (starts with $2)
  if (storedHash.startsWith("$2")) {
    // Verify with bcrypt (requires bcrypt package)
    const bcryptValid = await bcrypt.compare(password, storedHash);
    if (bcryptValid) {
      // Rehash with PBKDF2 and update database
      const newHash = await hashPassword(password);
      // await updateUserPassword(userId, newHash);
      return true;
    }
    return false;
  }

  // New PBKDF2 format
  return verifyPassword(password, storedHash);
}
```

### 2. Rate Limiting

**Database-backed** rate limiting for edge compatibility:

```typescript
// src/lib/auth.ts
rateLimit: {
  enabled: true,
  window: 60,     // 60 seconds
  max: 100,       // 100 requests per window
  storage: "database"  // Works in Cloudflare Workers
}
```

**Why database storage?**

- ✅ Edge-compatible (no in-memory state needed)
- ✅ Distributed rate limiting across multiple workers
- ✅ Persistent across deployments
- ✅ Prevents brute force attacks

### 3. Session Security

- **HttpOnly cookies** - Prevents XSS attacks
- **Secure flag** in production (HTTPS only)
- **SameSite=Lax** - CSRF protection
- **Cookie caching** (5 minutes) - Performance optimization

```typescript
// src/lib/auth.ts
session: {
  cookieCache: {
    enabled: true,
    maxAge: 60 * 5, // 5-minute cache
  },
}
```

### 4. CSRF Protection

Better Auth includes built-in CSRF protection - no additional configuration needed.

## Cloudflare Workers Compatibility

### Why It Works

Better Auth is **fully compatible** with Cloudflare Workers because:

1. **No Node.js dependencies**
2. **Web Crypto API** (not Node.js `crypto`)
3. **Database-backed** rate limiting (not in-memory)
4. **HTTP-based** session management
5. **Edge-native** architecture

### Architecture Components

**Middleware (< 1ms execution):**

```typescript
// middleware.ts
// Only checks cookie presence - no database queries
const sessionToken = req.cookies.get("better-auth.session_token");
```

**Server Components (Full validation):**

```typescript
// app/dashboard/users/page.tsx
const session = await requireAuth(["admin"]);
// Database query + RBAC happens here
```

**Password Hashing:**

```typescript
// lib/password.ts
// Uses crypto.subtle.deriveBits (Web Crypto API)
// Available on Cloudflare Workers
```

**Database:**

```typescript
// Neon PostgreSQL over HTTP
// WebSocket connections work on edge
```

### Performance on Edge

- **Middleware:** < 1ms (cookie check only)
- **Session validation:** ~10-30ms (database query)
- **Password hashing:** ~50-100ms (100k iterations)
- **Global edge network:** < 50ms latency worldwide

## Email Templates

Responsive React Email templates in `src/lib/emails/templates/auth/`:

- `verify-email.tsx` - Email verification
- `password-reset.tsx` - Password reset
- `password-changed.tsx` - Password change notification

### Mock Mode (Development)

By default, emails are logged to console:

```bash
📧 [MOCK EMAIL SENT]
  To: user@example.com
  Subject: Reset your password
  From: noreply@yourdomain.com
  Link: http://localhost:3000/reset-password?token=abc123
  ---
```

### Production (Resend)

```bash
# .env
EMAIL_PROVIDER="resend"
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@yourdomain.com"
```

Emails will be sent via [Resend](https://resend.com).

**Setup:**

1. Get API key from [Resend](https://resend.com)
2. Verify your domain in Resend dashboard
3. Add configuration to `.env`

See [`EMAIL_SYSTEM.md`](./EMAIL_SYSTEM.md) for detailed email configuration.

## Advanced Troubleshooting

### Email verification not working

**Cause:** Email provider not configured

**Fix:**

```bash
# .env
EMAIL_PROVIDER="resend"  # Must be "resend", not "mock"
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@yourdomain.com"
```

**Note:** Email verification is automatically enabled when `EMAIL_PROVIDER="resend"`. In development with `EMAIL_PROVIDER="mock"`, verification is intentionally disabled.

### Verification links not working

**Check:**

1. `BETTER_AUTH_URL` is set correctly (not `NEXTAUTH_URL`)
2. Token hasn't expired
3. Token hasn't been used already (deleted after use)
4. Check database `verification` table
5. Ensure `EMAIL_PROVIDER="resend"` if expecting real emails

### Password reset token expired

**Default expiration:** 1 hour

**Solution:** Request a new reset link

**Customize expiration** (if needed):

```typescript
// src/lib/auth.ts
// Better Auth allows token expiration configuration
// Check Better Auth docs for specific config options
```

### Middleware errors in production

**Cause:** Edge Runtime incompatibility

**Fix:** Middleware only checks cookies, not database. All validation is in Server Components.

**Verify:**

```typescript
// middleware.ts should NOT have:
❌ await db.query(...)
❌ await getSession()
❌ Complex computations

// middleware.ts should ONLY have:
✅ req.cookies.get(...)
✅ Simple redirects
✅ URL checks
```

### Role changes not taking effect

**Cause:** Cookie cache (5 minutes)

**Fix:**

1. Sign out and sign in again
2. Or wait for cache to expire (5 minutes)

**Why caching?**

- Performance optimization for edge
- Reduces database queries
- Trade-off: slight delay in role changes

## Migration from NextAuth

### Key Differences

**API routes:**

- NextAuth: `/api/auth/[...nextauth]`
- Better Auth: `/api/auth/[...all]`

**Session access:**

- NextAuth Server: `await auth()` wrapper
- Better Auth Server: `await getSession()` directly

- NextAuth Client: Requires `<SessionProvider>`
- Better Auth Client: No provider needed

**Password hashing:**

- NextAuth: bcrypt (Node.js only)
- Better Auth: PBKDF2 (edge-compatible)

**Cookie names:**

- NextAuth: `next-auth.session-token`
- Better Auth: `better-auth.session_token`

### Database Migration

Better Auth uses similar schema to NextAuth:

- Compatible table structure (user, session, account, verification)
- Additional fields for rate limiting
- snake_case column names (PostgreSQL best practice)

**Migration steps:**

1. Export data from NextAuth tables
2. Update table/column names to Better Auth schema
3. Import data to new schema
4. Update application code to Better Auth API

## Resources

- **Basic auth guide:** [`AUTHENTICATION.md`](./AUTHENTICATION.md)
- **RBAC system:** [`RBAC.md`](./RBAC.md)
- **Email system:** [`EMAIL_SYSTEM.md`](./EMAIL_SYSTEM.md)
- **Deployment:** [`DEPLOYMENT.md`](./DEPLOYMENT.md)
- [Better Auth Documentation](https://better-auth.com/docs)
- [Better Auth GitHub](https://github.com/better-auth/better-auth)
