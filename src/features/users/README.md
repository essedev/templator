# Users Feature

Admin-only user management system with role assignment.

## Overview

This feature provides administrative functionality for managing users and their roles. Only users with the `admin` role can access this feature.

## Access Control

- **Required role:** `admin`
- **Permission:** `manage_users`
- **Page:** `/dashboard/users`

## Server Actions

### `updateUserRole(userId, newRole)`

Updates a user's role. Admin users cannot change their own role.

```typescript
import { updateUserRole } from "@/features/users/actions";

await updateUserRole("user-id", "editor");
```

**Permissions:**

- Caller must be admin
- Cannot change own role
- Valid roles: `user`, `editor`, `admin`

### `deleteUser(userId)`

Deletes a user account (soft delete recommended for production).

```typescript
import { deleteUser } from "@/features/users/actions";

await deleteUser("user-id");
```

**Permissions:**

- Caller must be admin
- Cannot delete self

## Components

### RoleSelector

Client component for changing user roles with dropdown.

**Location:** `/dashboard/users/RoleSelector.tsx`

```typescript
<RoleSelector userId={user.id} currentRole={user.role} />
```

## Usage Example

### Admin Users Page

```typescript
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";

export default async function UsersPage() {
  const session = await auth();

  if (!isAdmin(session?.user?.role)) {
    redirect("/dashboard");
  }

  const allUsers = await db.select().from(users);

  return (
    <div>
      {allUsers.map((user) => (
        <div key={user.id}>
          {user.email} - {user.role}
          <RoleSelector userId={user.id} currentRole={user.role} />
        </div>
      ))}
    </div>
  );
}
```

## Security

Multiple layers of protection:

1. **Middleware:** Blocks non-admin access to `/dashboard/users`
2. **RoleGate:** Server component prevents rendering
3. **Server Actions:** Validate admin permission before execution
4. **Self-protection:** Prevents admins from demoting themselves

## Initial Admin Setup

To create the first admin user, update the database directly:

```sql
UPDATE "user" SET role = 'admin' WHERE email = 'your-email@example.com';
```

After first admin exists, use the UI to promote other users.

## Extending

### Add user deletion

Currently deletion is basic. For production, consider:

- Soft delete (mark as deleted, keep data)
- Cascade delete related data
- Audit log of deletions
- Confirmation workflow

### Add bulk operations

```typescript
export async function bulkUpdateRoles(updates: { userId: string; role: Role }[]) {
  // Validate permissions
  // Apply updates in transaction
}
```

## See Also

- [RBAC.md](../../../docs/RBAC.md) - Complete RBAC documentation
- [lib/permissions.ts](../../lib/permissions.ts) - Permission helpers
