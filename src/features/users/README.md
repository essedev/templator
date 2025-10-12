# Users Feature

Admin-only user management system with role assignment and user operations.

## Overview

This feature provides administrative functionality for managing users and their roles. Only users with the `admin` role can access this feature.

## Access Control

- **Required role:** `admin`
- **Permission:** `manage_users`
- **Page:** `/dashboard/users`

Protected by:

1. Middleware (cookie check)
2. Server Component `requireAuth(["admin"])`
3. Server Actions permission validation

## Server Actions

### `updateUserRole(userId, newRole)`

Updates a user's role. Admin users cannot change their own role.

```typescript
import { updateUserRole } from "@/features/users/actions";

await updateUserRole("user-id-123", "editor");
```

**Permissions:**

- Caller must be admin
- Cannot change own role (security)
- Valid roles: `user`, `editor`, `admin`

**Workflow:**

1. Validate admin session
2. Check not changing own role
3. Validate new role value
4. Update database
5. Optional: Send email notification to user

### `deleteUser(userId)`

Deletes a user account (cascade deletes sessions, posts, etc.).

```typescript
import { deleteUser } from "@/features/users/actions";

await deleteUser("user-id-123");
```

**Permissions:**

- Caller must be admin
- Cannot delete self (security)
- Cascade deletes via foreign key constraints

**Production recommendation:** Use soft delete instead:

```typescript
// Add deleted_at column
export const user = pgTable("user", {
  // ... existing fields
  deletedAt: timestamp("deleted_at"),
});

// Soft delete action
export async function softDeleteUser(userId: string) {
  await db.update(user).set({ deletedAt: new Date() }).where(eq(user.id, userId));
}
```

## Components

### RoleSelector

Client component for changing user roles via dropdown.

**Location:** `RoleSelector.tsx` (in users dashboard)

```typescript
import { RoleSelector } from "@/features/users/RoleSelector";

<RoleSelector userId={user.id} currentRole={user.role} />
```

**Features:**

- Real-time role update (optimistic UI)
- Disabled for own user (can't change own role)
- Loading state during update
- Error handling with toast notifications

## Database Schema

Uses Better Auth `user` table with custom `role` field:

```typescript
export const userRoleEnum = pgEnum("user_role", ["user", "editor", "admin"]);

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

## Usage Example

### Admin Users Page

```typescript
import { requireAuth } from "@/lib/rbac";
import { db } from "@/db";
import { user } from "@/db/schema";
import { RoleSelector } from "@/features/users/RoleSelector";

export default async function UsersPage() {
  // Require admin role - redirects if unauthorized
  const session = await requireAuth(["admin"]);

  // Fetch all users
  const allUsers = await db.select().from(user).orderBy(user.createdAt);

  return (
    <div className="container py-12">
      <h1>User Management</h1>

      <table className="w-full">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {allUsers.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>
                <RoleSelector
                  userId={user.id}
                  currentRole={user.role}
                  disabled={user.id === session.user.id}
                />
              </td>
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              <td>
                {/* Actions: view, delete, etc. */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Update Role Action

```typescript
"use server";

import { requireAuth } from "@/lib/rbac";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { type Role } from "@/lib/permissions";

export async function updateUserRole(userId: string, newRole: Role) {
  // Validate admin permission
  const session = await requireAuth(["admin"]);

  // Prevent self-role-change
  if (userId === session.user.id) {
    throw new Error("Cannot change your own role");
  }

  // Validate role
  const validRoles: Role[] = ["user", "editor", "admin"];
  if (!validRoles.includes(newRole)) {
    throw new Error("Invalid role");
  }

  // Update role
  await db.update(user).set({ role: newRole, updatedAt: new Date() }).where(eq(user.id, userId));

  // Optional: Send notification email
  // await sendRoleChangeEmail(userId, newRole);

  return { success: true };
}
```

## Security

Multi-layer protection:

1. **Middleware:** Blocks non-admin access to `/dashboard/users` route
2. **Server Component:** `requireAuth(["admin"])` before rendering
3. **Server Actions:** Validate admin permission before every mutation
4. **Self-protection:** Prevents admins from changing/deleting own account
5. **Database constraints:** Role enum ensures valid values only

**Security checklist:**

- ✅ Authentication required (middleware)
- ✅ Admin role required (Server Components + Actions)
- ✅ Cannot change own role (prevents privilege escalation)
- ✅ Cannot delete self (prevents lockout)
- ✅ Input validation (Zod schemas)
- ✅ SQL injection protection (Drizzle ORM)

## Initial Admin Setup

To create the first admin user, update the database directly:

### Option 1: Via Drizzle Studio

```bash
pnpm db:studio
```

Navigate to `user` table and update the `role` field for your user.

### Option 2: Via SQL

```sql
UPDATE "user" SET role = 'admin' WHERE email = 'your-email@example.com';
```

### Option 3: Via Seed Script

```typescript
// src/db/seed.ts
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

async function seed() {
  await db.update(user).set({ role: "admin" }).where(eq(user.email, "admin@example.com"));
}

seed();
```

After first admin exists, use the UI to promote other users.

## Extending

### 1. Add User Search/Filter

```typescript
export async function searchUsers(query: string) {
  const session = await requireAuth(["admin"]);

  return await db
    .select()
    .from(user)
    .where(or(like(user.name, `%${query}%`), like(user.email, `%${query}%`)));
}
```

### 2. Add Bulk Operations

```typescript
export async function bulkUpdateRoles(updates: { userId: string; role: Role }[]) {
  const session = await requireAuth(["admin"]);

  // Validate: don't update own role
  updates.forEach((update) => {
    if (update.userId === session.user.id) {
      throw new Error("Cannot bulk update own role");
    }
  });

  // Apply updates in transaction
  await db.transaction(async (tx) => {
    for (const { userId, role } of updates) {
      await tx.update(user).set({ role }).where(eq(user.id, userId));
    }
  });
}
```

### 3. Add Activity Log

Track admin actions for audit:

```typescript
export const adminLog = pgTable("admin_log", {
  id: text("id").primaryKey(),
  adminId: text("admin_id").references(() => user.id),
  action: text("action").notNull(), // "role_change", "user_delete"
  targetUserId: text("target_user_id").references(() => user.id),
  details: jsonb("details"), // { oldRole, newRole }
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Log in updateUserRole
await db.insert(adminLog).values({
  adminId: session.user.id,
  action: "role_change",
  targetUserId: userId,
  details: { oldRole, newRole },
});
```

### 4. Add User Statistics

```typescript
export async function getUserStats() {
  const session = await requireAuth(["admin"]);

  const [stats] = await db
    .select({
      total: count(),
      admins: sum(sql`CASE WHEN role = 'admin' THEN 1 ELSE 0 END`),
      editors: sum(sql`CASE WHEN role = 'editor' THEN 1 ELSE 0 END`),
      users: sum(sql`CASE WHEN role = 'user' THEN 1 ELSE 0 END`),
    })
    .from(user);

  return stats;
}
```

## Performance

- Index on `role` for filtering
- Index on `email` for searching
- Pagination for large user lists (>100 users)

```sql
CREATE INDEX idx_user_role ON "user"(role);
CREATE INDEX idx_user_email ON "user"(email);
```

### Pagination Example

```typescript
export async function getUsers(page: number = 1, pageSize: number = 50) {
  const session = await requireAuth(["admin"]);

  const offset = (page - 1) * pageSize;

  const users = await db.select().from(user).orderBy(user.createdAt).limit(pageSize).offset(offset);

  const [{ total }] = await db.select({ total: count() }).from(user);

  return {
    users,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
```

## TODO (optional enhancements)

- [ ] Add user search and filtering
- [ ] Implement pagination (for > 100 users)
- [ ] Add bulk operations (role changes, deletions)
- [ ] Add activity/audit log
- [ ] User statistics dashboard
- [ ] Export users to CSV
- [ ] Import users from CSV
- [ ] User impersonation (for support)
- [ ] Email notifications on role change
- [ ] User suspension (temporary ban)
- [ ] Soft delete instead of hard delete
- [ ] User detail page with full profile
- [ ] Last login tracking

## See Also

- [`docs/RBAC.md`](../../../docs/RBAC.md) - Complete RBAC documentation
- [`docs/AUTHENTICATION.md`](../../../docs/AUTHENTICATION.md) - Better Auth system
- [`lib/permissions.ts`](../../lib/permissions.ts) - Permission helpers
- [`lib/rbac.ts`](../../lib/rbac.ts) - requireAuth helper
