# Profile Feature

User profile management - allows authenticated users to view and edit their own profile information.

## Overview

This feature enables all authenticated users to manage their profile data (name, email, etc.). Available to all users regardless of role.

## Access Control

- **Required:** Authenticated user (any role)
- **Page:** `/dashboard/profile`
- **Scope:** Users can only edit their own profile

## Server Actions

### `updateProfile(data)`

Updates current user's profile information.

```typescript
import { updateProfile } from "@/features/profile/actions";

await updateProfile({
  name: "John Doe",
});
```

**Validation:**

- Uses `profileSchema` from `schema.ts`
- Only updates provided fields
- Cannot change email (requires verification flow)
- Cannot change role (admin-only via users feature)

## Components

### EditProfileForm

Form component for updating user profile with React Hook Form.

**Location:** `EditProfileForm.tsx`

```typescript
import { EditProfileForm } from "@/features/profile/EditProfileForm";

<EditProfileForm user={currentUser} />
```

## Database Schema

Uses Better Auth `user` table:

```typescript
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
```

## Validation

Schema Zod in `schema.ts`:

```typescript
export const profileSchema = z.object({
  name: z.string().min(1, "Name required").max(100).optional(),
  image: z.string().url("Invalid image URL").optional(),
});
```

## Usage Example

### Profile Page

```typescript
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EditProfileForm } from "@/features/profile/EditProfileForm";

export default async function ProfilePage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="container py-12">
      <h1>My Profile</h1>
      <EditProfileForm user={session.user} />
    </div>
  );
}
```

### Update Profile Action

```typescript
"use server";

import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { profileSchema } from "./schema";

export async function updateProfile(input: unknown) {
  const session = await getSession();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const data = profileSchema.parse(input);

  await db
    .update(user)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(user.id, session.user.id));

  return { success: true };
}
```

## Editable Fields

Current implementation allows editing:

- **name** - Display name
- **image** - Avatar URL (optional)

Protected fields (not editable via this feature):

- **email** - Requires email verification flow (security)
- **role** - Admin-only via users feature (RBAC)
- **password** - Requires current password verification (security)

## Extending

### 1. Add Avatar Upload

Integrate with storage provider (Cloudflare R2, AWS S3, Uploadthing):

```typescript
// 1. Add upload endpoint
export async function uploadAvatar(formData: FormData) {
  const file = formData.get("avatar") as File;

  // Upload to storage
  const url = await uploadToR2(file);

  // Update user
  await db.update(user).set({ image: url }).where(eq(user.id, userId));

  return { url };
}

// 2. Update schema
export const profileSchema = z.object({
  name: z.string().optional(),
  avatar: z.instanceof(File).optional(), // File upload
});
```

### 2. Add Email Change with Verification

Secure email change flow:

```typescript
// 1. Request email change
export async function requestEmailChange(newEmail: string) {
  const session = await getSession();

  // Create verification token
  const token = crypto.randomUUID();

  await db.insert(verification).values({
    identifier: session.user.id,
    value: newEmail,
    expiresAt: new Date(Date.now() + 3600000), // 1 hour
  });

  // Send verification email to NEW email
  await sendEmail({
    to: newEmail,
    subject: "Verify your new email",
    react: <VerifyEmailChangeTemplate verificationUrl={`.../verify?token=${token}`} />,
  });
}

// 2. Confirm email change
export async function confirmEmailChange(token: string) {
  const [record] = await db
    .select()
    .from(verification)
    .where(eq(verification.value, token))
    .limit(1);

  if (!record || record.expiresAt < new Date()) {
    throw new Error("Invalid or expired token");
  }

  // Update email
  await db.update(user).set({ email: record.value }).where(eq(user.id, record.identifier));

  // Delete token
  await db.delete(verification).where(eq(verification.id, record.id));
}
```

### 3. Add Password Change

```typescript
export async function changePassword(data: { currentPassword: string; newPassword: string }) {
  const session = await getSession();

  // Get user's current password hash
  const [userAccount] = await db
    .select()
    .from(account)
    .where(eq(account.userId, session.user.id))
    .limit(1);

  // Verify current password
  const isValid = await verifyPassword(data.currentPassword, userAccount.password);

  if (!isValid) {
    throw new Error("Current password is incorrect");
  }

  // Hash new password
  const newPasswordHash = await hashPassword(data.newPassword);

  // Update password
  await db
    .update(account)
    .set({ password: newPasswordHash })
    .where(eq(account.userId, session.user.id));

  return { success: true };
}
```

### 4. Add Bio/Description Field

```typescript
// 1. Add column to schema
export const user = pgTable("user", {
  // ... existing fields
  bio: text("bio"),
});

// 2. Run migration
pnpm db:generate
pnpm db:push

// 3. Update validation schema
export const profileSchema = z.object({
  name: z.string().optional(),
  bio: z.string().max(500, "Bio too long").optional(),
});
```

## Security

- ✅ Users can only update their own profile
- ✅ Session validation on every action (`getSession()`)
- ✅ Server-side validation with Zod schemas
- ✅ Protected fields (email, role, password) not exposed
- ✅ SQL injection protection (Drizzle ORM)
- ✅ XSS protection (React escaping)

**Best practices:**

- Never allow changing sensitive fields (email, role) without verification
- Require current password for password changes
- Validate file uploads (size, type, content)
- Rate limit profile updates

## Performance

- Server Component for profile view (no client state)
- Optimistic updates possible with React 19 (`useOptimistic`)
- Database update only on changed fields

```typescript
// Only update changed fields
const updates: Partial<typeof user.$inferInsert> = {};

if (data.name !== currentUser.name) updates.name = data.name;
if (data.image !== currentUser.image) updates.image = data.image;

if (Object.keys(updates).length > 0) {
  await db.update(user).set(updates).where(eq(user.id, userId));
}
```

## TODO (optional enhancements)

- [ ] Add avatar upload with Cloudflare R2
- [ ] Implement email change with verification
- [ ] Add password change functionality
- [ ] Add bio/description field
- [ ] Add social media links
- [ ] Add timezone preference
- [ ] Add language preference
- [ ] Profile picture cropping
- [ ] Activity log (last login, etc.)
- [ ] Account deletion option

## See Also

- [`docs/AUTHENTICATION.md`](../../../docs/AUTHENTICATION.md) - Better Auth system
- [`features/auth`](../auth/README.md) - Authentication feature
- [`features/users`](../users/README.md) - Admin user management
