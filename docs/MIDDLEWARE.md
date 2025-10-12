# Middleware Documentation

Guide to the authentication middleware in Templator.

## Overview

This application uses a **lightweight middleware** for route protection that is fully compatible with Edge Runtime (Cloudflare Workers).

**Key principle:** Middleware only checks for session cookie presence - detailed RBAC validation happens in Server Components.

## Why This Approach?

### Traditional Approach (Not Used)

```typescript
// ❌ Heavy middleware (not edge-compatible)
export async function middleware(req: NextRequest) {
  const session = await getSession(); // DB query - slow on edge
  if (!session || session.user.role !== "admin") {
    return redirect("/login");
  }
}
```

**Problems:**

- Database queries in middleware → slow
- Edge Runtime has limited DB access patterns
- RBAC logic scattered across middleware and components

### Our Approach (Lightweight)

```typescript
// ✅ Lightweight middleware (edge-compatible)
export async function middleware(req: NextRequest) {
  const sessionToken = req.cookies.get("better-auth.session_token");
  if (!sessionToken) {
    return redirect("/login");
  }
  // RBAC happens in Server Components (requireAuth)
}
```

**Benefits:**

- ⚡ **Fast** - No database queries, only cookie check
- 🌍 **Edge-compatible** - Works on Cloudflare Workers, Vercel Edge
- 🔒 **Secure** - Full validation in Server Components with `requireAuth()`
- 🎯 **Simple** - Single responsibility (authentication check only)

## How It Works

### 1. Cookie Check

Middleware checks for Better Auth session cookie:

```typescript
const sessionToken = req.cookies.get("better-auth.session_token");
```

- **Cookie present** → Allow request to proceed
- **Cookie missing** → Redirect to `/login` with `callbackUrl`

### 2. Server Component Validation

Protected pages use `requireAuth()` for detailed checks:

```typescript
// src/app/dashboard/users/page.tsx
import { requireAuth } from "@/lib/rbac";

export default async function UsersPage() {
  // This performs full validation:
  // - Session exists
  // - Session is valid (not expired)
  // - User has required role
  const session = await requireAuth(["admin"]);

  return <div>Admin content...</div>;
}
```

**This is where:**

- Database queries happen (getSession)
- RBAC roles are checked
- User data is fetched

## Configuration

### Protected Routes

Define protected routes in `src/middleware.ts`:

```typescript
const PROTECTED_ROUTES = ["/dashboard"];
```

**How it works:**

- Uses `path.startsWith()` for matching
- Example: `/dashboard` protects `/dashboard/users`, `/dashboard/profile`, etc.

### Adding New Protected Routes

**1. Protect a new section:**

```typescript
const PROTECTED_ROUTES = [
  "/dashboard",
  "/admin", // Add new protected section
  "/settings", // Another protected section
];
```

**2. Add RBAC in Server Component:**

```typescript
// src/app/admin/page.tsx
export default async function AdminPage() {
  const session = await requireAuth(["admin"]);
  return <div>Admin dashboard</div>;
}
```

### Matcher Configuration

Controls which paths the middleware runs on:

```typescript
export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static (Next.js static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Images (svg, png, jpg, jpeg, gif, webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

**Why exclude these paths:**

- Static assets don't need authentication
- Improves performance (fewer middleware invocations)
- Required for proper Next.js functionality

## Better Auth Integration

### Session Cookie Name

Better Auth uses: `better-auth.session_token`

```typescript
const sessionToken = req.cookies.get("better-auth.session_token");
```

**Cookie properties:**

- **HttpOnly:** ✅ (prevents XSS attacks)
- **Secure:** ✅ in production (HTTPS only)
- **SameSite:** Lax (CSRF protection)
- **Max-Age:** Configurable in Better Auth config

### Redirect with Callback URL

When redirecting to login, middleware preserves the original destination:

```typescript
const loginUrl = new URL("/login", req.url);
loginUrl.searchParams.set("callbackUrl", path);
return NextResponse.redirect(loginUrl);
```

**Result:** `/login?callbackUrl=/dashboard/users`

The login page can read `callbackUrl` and redirect after successful authentication.

## Multi-Layer Security

This app implements defense-in-depth with 3 layers:

### Layer 1: Middleware (Cookie Check)

```typescript
// src/middleware.ts
// ✅ Fast cookie presence check
if (!sessionToken) redirect("/login");
```

### Layer 2: Server Components (Full Validation)

```typescript
// src/app/dashboard/users/page.tsx
// ✅ Database validation + RBAC
const session = await requireAuth(["admin"]);
```

### Layer 3: Server Actions (Permission Check)

```typescript
// src/features/users/actions.ts
"use server";
// ✅ Re-validate before mutation
export async function deleteUser(userId: string) {
  const session = await requireAuth(["admin"]);
  // ... perform action
}
```

**Why 3 layers:**

- Middleware → Fast fail for unauthenticated users
- Server Components → Proper RBAC before rendering sensitive UI
- Server Actions → Prevent API abuse even if UI is bypassed

## Edge Runtime Compatibility

### What Works

✅ Cookie reading/writing
✅ URL manipulation
✅ Redirects
✅ Request/response headers

### What Doesn't Work

❌ Database queries (use Server Components instead)
❌ File system access
❌ Node.js-specific APIs (fs, crypto with require)
❌ Heavy computations (timeout limits)

### Cloudflare Workers Specifics

This middleware runs perfectly on Cloudflare Workers because:

- No database queries
- No Node.js dependencies
- Pure Web APIs (cookies, URL, Response)
- Fast execution (< 1ms)

## Common Patterns

### 1. Public Routes

Routes **not** in `PROTECTED_ROUTES` are accessible without authentication:

```
/ → Landing page (public)
/pricing → Pricing page (public)
/blog → Blog listing (public)
/blog/[slug] → Blog post (public)
/login → Login page (public)
/register → Registration page (public)
```

### 2. Partially Protected Sections

To protect only specific sub-routes:

```typescript
const PROTECTED_ROUTES = [
  "/dashboard",
  "/api/admin", // Only /api/admin/* protected
];
```

```
/api/webhook → Public (not in PROTECTED_ROUTES)
/api/admin/users → Protected (matches /api/admin)
```

### 3. Different Roles for Different Routes

**Middleware:** Only checks authentication

**Server Components:** Handle role-specific access

```typescript
// /dashboard/* - All authenticated users
export default async function DashboardPage() {
  const session = await requireAuth(); // Any role OK
}

// /dashboard/users - Admin only
export default async function UsersPage() {
  const session = await requireAuth(["admin"]); // Admin required
}

// /dashboard/blog - Editor or Admin
export default async function BlogPage() {
  const session = await requireAuth(["editor", "admin"]);
}
```

## Troubleshooting

### Middleware redirects even when logged in

**Cause:** Cookie not being set correctly

**Fix:**

1. Check Better Auth configuration in `src/lib/auth.ts`
2. Verify `BETTER_AUTH_SECRET` is set in `.env`
3. Clear browser cookies and log in again
4. Check cookie name matches: `better-auth.session_token`

### Redirect loop (login → dashboard → login)

**Cause:** Cookie set but middleware can't read it

**Fix:**

1. Verify cookie domain matches your app URL
2. Check `BETTER_AUTH_URL` in `.env` matches actual URL
3. Ensure HTTPS in production (cookies may not work on HTTP)

### RBAC not working (wrong users accessing pages)

**Cause:** Middleware only checks authentication, not roles

**Fix:**

- Add `requireAuth(["role"])` in Server Components
- Middleware **cannot** do RBAC (by design, for edge compatibility)
- See [`docs/RBAC.md`](./RBAC.md) for proper RBAC implementation

### Middleware not running on certain paths

**Cause:** Path excluded by matcher config

**Fix:**

- Check `config.matcher` in `src/middleware.ts`
- Add your path pattern if needed
- Test with `console.log(req.nextUrl.pathname)` to debug

## Performance Considerations

### Middleware Execution Time

Target: **< 5ms** per request

Our middleware typically runs in **1-2ms** because:

- No database queries
- No heavy computations
- Only cookie read + string comparison

### Caching

Better Auth implements cookie caching:

```typescript
// src/lib/auth.ts
session: {
  cookieCache: {
    enabled: true,
    maxAge: 60 * 5, // 5 minutes cache
  },
}
```

**Impact:**

- First request: Cookie validated (full check)
- Next 5 minutes: Cookie cached (faster)
- After 5 minutes: Re-validated

## Security Best Practices

### 1. Never Trust Client Data

```typescript
// ❌ BAD: Trusting cookies without validation
const role = req.cookies.get("user-role"); // Client can forge this!

// ✅ GOOD: Validate in Server Component
const session = await getSession(); // Fetches from database
```

### 2. Always Re-validate in Server Actions

```typescript
"use server";
export async function deleteUser(userId: string) {
  // Even if middleware passed, re-check here
  const session = await requireAuth(["admin"]);

  // Now safe to proceed
  await db.delete(users).where(eq(users.id, userId));
}
```

### 3. Use HTTPS in Production

```bash
# .env.production
BETTER_AUTH_URL="https://yourapp.com"  # Must be HTTPS
```

HTTP cookies can be intercepted → Always use HTTPS in production.

## Related Documentation

- **Authentication:** [`docs/AUTHENTICATION.md`](./AUTHENTICATION.md)
- **RBAC:** [`docs/RBAC.md`](./RBAC.md)
- **Server Components:** [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md)

## Working with AI

When asking AI to modify middleware:

### ✅ Good Prompts

- "Add `/settings` to protected routes in middleware"
- "Update middleware to redirect to `/auth/login` instead of `/login`"
- "Add logging to middleware for debugging (but keep it fast)"

### ❌ Avoid

- "Add role checking to middleware" → Use Server Components instead
- "Add database query in middleware" → Not edge-compatible
- "Make middleware check user permissions" → That's RBAC (Server Components)

**Remember:** Middleware = lightweight authentication only. RBAC = Server Components.
