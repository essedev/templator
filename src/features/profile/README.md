# Profile Feature

User profile management - allows authenticated users to view and edit their own profile information.

## Overview

This feature enables all authenticated users to manage their profile data (name, email, etc.). Available to all users regardless of role.

## Access Control

- **Required:** Authenticated user
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
- Only updates fields provided
- Cannot change email (requires verification flow)
- Cannot change role (admin-only via users feature)

## Components

### EditProfileForm

Form component for updating user profile.

**Location:** `EditProfileForm.tsx`

```typescript
import { EditProfileForm } from "@/features/profile/EditProfileForm";

<EditProfileForm user={currentUser} />
```

## Usage Example

### Profile Page

```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EditProfileForm } from "@/features/profile/EditProfileForm";

export default async function ProfilePage() {
  const session = await auth();

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

## Editable Fields

Current implementation allows editing:

- **name** - Display name
- Additional fields can be added to schema

Protected fields (not editable via this feature):

- **email** - Requires email verification flow
- **role** - Admin-only via users feature
- **password** - Requires current password verification

## Security

- Users can only update their own profile
- Session validation on every action
- Server-side validation with Zod schemas
- No sensitive fields exposed

## Extending

### Add avatar upload

1. Add storage provider (e.g., Cloudflare R2)
2. Update schema with image field
3. Add file upload to form
4. Process and store image URL

```typescript
export const profileSchema = z.object({
  name: z.string().min(1).optional(),
  image: z.string().url().optional(), // Avatar URL
});
```

### Add email change with verification

1. Create email verification tokens table
2. Add `requestEmailChange` action
3. Send verification email
4. Verify token and update email

### Add password change

```typescript
export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  const session = await auth();
  // Verify current password
  // Hash and update new password
}
```

## See Also

- [features/auth](../auth/README.md) - Authentication system
- [features/users](../users/README.md) - Admin user management
