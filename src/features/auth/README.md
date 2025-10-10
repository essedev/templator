# Auth Feature

Authentication system using NextAuth v5 with Drizzle adapter.

## Overview

This feature handles user authentication using email/password credentials. Built on NextAuth v5 (Auth.js) with full Next.js 15 App Router support.

## Components

- **Login page** (`/login`) - Email/password sign in
- **Register page** (`/register`) - New user registration
- **Session management** - JWT + database sessions via Drizzle

## Server Actions

### `registerUser(data)`

Creates new user account with email/password.

```typescript
import { registerUser } from "@/features/auth/actions";

const result = await registerUser({
  email: "user@example.com",
  password: "securepassword",
  name: "John Doe",
});
```

**Validation:** Uses `registerSchema` from `schema.ts`

## Configuration

Required environment variables in `.env`:

```bash
NEXTAUTH_SECRET="generate with: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
DATABASE_URL="postgresql://..."
```

## Auth Config

Main configuration in `src/lib/auth.ts`:

- **Adapter:** DrizzleAdapter for database persistence
- **Session strategy:** JWT (edge-compatible)
- **Providers:** Credentials (email/password)
- **Callbacks:** JWT + session with role extension

## Usage Examples

### Check authentication in Server Component

```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <div>Welcome {session.user.email}</div>;
}
```

### Sign out

```typescript
import { signOut } from "@/lib/auth";

<button onClick={() => signOut()}>Sign Out</button>
```

## Extending

### Add OAuth provider

1. Install provider package (if needed)
2. Add credentials to `.env`
3. Add provider in `lib/auth.ts`:

```typescript
import GitHub from "next-auth/providers/github";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // ... existing config
  providers: [
    Credentials({ ... }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
});
```

## Security Notes

**Current implementation uses plain-text password comparison for simplicity.**

For production, add proper password hashing:

```bash
pnpm add bcryptjs
pnpm add -D @types/bcryptjs
```

Update `registerUser` and `authorize` to use bcrypt.

## See Also

- [RBAC.md](../../../docs/RBAC.md) - Role-based access control
- [lib/auth.ts](../../lib/auth.ts) - Auth configuration
- [lib/permissions.ts](../../lib/permissions.ts) - Permission system
