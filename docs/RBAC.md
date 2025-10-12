# Role-Based Access Control (RBAC)

Complete guide to the role-based access control system in Templator.

## Overview

This application implements a comprehensive RBAC system using Better Auth's custom user fields. Access to features, routes, and data is controlled based on user roles with a hierarchical permission system.

## Roles

The system has three hierarchical roles:

### 1. **User** (Default)

- Basic authenticated user
- Can view their own content and profile
- Access to: Dashboard overview, profile management

### 2. **Editor**

- Content manager role
- All User permissions plus:
- Manage all blog posts
- View contact messages
- Manage newsletter subscribers
- Access to: Blog management, Newsletter, Contacts

### 3. **Admin**

- Full system access
- All Editor permissions plus:
- Manage users and their roles
- System-level settings
- View system statistics
- Access to: User management, System settings

## Architecture

### Database Schema

The user role is stored in the `user` table managed by Better Auth:

```typescript
// src/db/schema.ts

// Role enum (PostgreSQL)
export const userRoleEnum = pgEnum("user_role", ["user", "editor", "admin"]);

// User table with role field
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  // ... other Better Auth fields
  role: userRoleEnum("role").default("user").notNull(),
});
```

### Type System

Better Auth configuration extends the user model:

```typescript
// src/lib/auth.ts
export const auth = betterAuth({
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "user",
        input: false, // Security: can't be set on sign up
      },
    },
  },
});
```

Session type includes role automatically:

```typescript
// src/types/auth.d.ts
type Session = {
  user: {
    id: string;
    email: string;
    name: string;
    role: "user" | "editor" | "admin";
  };
};
```

## Permission System

### Available Permissions

```typescript
type Permission =
  | "view_dashboard"
  | "view_own_content"
  | "manage_blog"
  | "manage_newsletter"
  | "view_contacts"
  | "manage_users"
  | "system_settings";
```

### Permission Mapping

```typescript
const ROLE_PERMISSIONS = {
  user: ["view_dashboard", "view_own_content"],
  editor: [
    "view_dashboard",
    "view_own_content",
    "manage_blog",
    "manage_newsletter",
    "view_contacts",
  ],
  admin: [
    "view_dashboard",
    "view_own_content",
    "manage_blog",
    "manage_newsletter",
    "view_contacts",
    "manage_users",
    "system_settings",
  ],
};
```

## Usage

### 1. Server-Side Permission Checks

#### Using RoleGate Component

```tsx
import { RoleGate } from "@/components/auth";

export default async function Page() {
  return (
    <div>
      <RoleGate allowedRoles={["admin"]}>
        <AdminPanel />
      </RoleGate>

      <RoleGate allowedRoles={["editor", "admin"]}>
        <EditorTools />
      </RoleGate>
    </div>
  );
}
```

#### Direct Permission Checks

```tsx
import { getSession } from "@/lib/auth";
import { can } from "@/lib/permissions";

export default async function Page() {
  const session = await getSession();

  if (can(session, "manage_blog")) {
    // Show blog management UI
  }

  return <div>...</div>;
}
```

### 2. Client-Side Permission Checks

Per conditional rendering in client components:

```tsx
"use client";

import { RoleGateClient } from "@/components/auth";

export function DashboardMenu() {
  return (
    <nav>
      <MenuItem href="/dashboard">Home</MenuItem>
      <MenuItem href="/dashboard/profile">Profile</MenuItem>

      {/* Only visible to editor/admin */}
      <RoleGateClient allowedRoles={["editor", "admin"]}>
        <MenuItem href="/dashboard/blog">Blog</MenuItem>
      </RoleGateClient>

      {/* Only visible to admin */}
      <RoleGateClient
        allowedRoles={["admin"]}
        fallback={<span className="text-muted-foreground">Admin only</span>}
        loading={<Skeleton className="h-8 w-20" />}
      >
        <MenuItem href="/dashboard/users">Users</MenuItem>
      </RoleGateClient>
    </nav>
  );
}
```

### 3. Middleware Protection

Routes are automatically protected based on configuration:

```typescript
// src/middleware.ts
const PROTECTED_ROUTES = {
  "/dashboard/users": ["admin"],
  "/dashboard/settings": ["admin"],
  "/dashboard/blog": ["editor", "admin"],
  "/dashboard/newsletter": ["editor", "admin"],
  "/dashboard/contacts": ["editor", "admin"],
  "/dashboard": ["user", "editor", "admin"],
};
```

### 4. Server Actions

```typescript
"use server";

import { requireAuth } from "@/lib/rbac";

export async function adminAction() {
  // Automatically checks authentication and role
  const session = await requireAuth(["admin"]);

  // If we reach here, user is authenticated and has admin role
  // Perform admin action
}
```

**Alternative with manual check:**

```typescript
"use server";

import { getSession } from "@/lib/auth";

export async function adminAction() {
  const session = await getSession();

  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized: admin role required");
  }

  // Perform admin action
}
```

## Dashboard Structure

The unified dashboard shows different sections based on user role:

```
/dashboard
  ├── / (Overview) - All users
  ├── /profile - All users
  ├── /blog - Editor, Admin
  ├── /newsletter - Editor, Admin
  ├── /contacts - Editor, Admin
  ├── /users - Admin only
  └── /settings - Admin only
```

## Managing Users

### Changing User Roles (Admin Only)

1. Navigate to `/dashboard/users`
2. Find the user in the list
3. Click on their current role dropdown
4. Select the new role

The change is immediate and affects:

- Session permissions on next request
- Access to protected routes
- Visibility of UI elements

### Restrictions

- Admins cannot change their own role
- Admins cannot delete themselves
- Role changes are logged in the database

## API Reference

### Permission Helper Functions

```typescript
// Check if user has a specific permission
hasPermission(role: Role, permission: Permission): boolean

// Check if user has any of the specified permissions
hasAnyPermission(role: Role, permissions: Permission[]): boolean

// Check if user has all specified permissions
hasAllPermissions(role: Role, permissions: Permission[]): boolean

// Check if user has a specific role or higher
hasRole(userRole: Role, requiredRole: Role): boolean

// Check if user is admin
isAdmin(role: Role): boolean

// Check if user is at least editor
isEditor(role: Role): boolean

// Helper to check permission from session
can(session: Session, permission: Permission): boolean
```

## Security Best Practices

### Defense in Depth

The RBAC system implements multiple layers of security:

1. **Middleware**: Blocks unauthorized route access
2. **Server Components**: Hide content from unauthorized users
3. **Server Actions**: Validate permissions before operations
4. **Client Components**: Prevent UI confusion

### Example Multi-Layer Protection

```tsx
// 1. Middleware blocks route access (cookie check)

// 2. Page component checks permission
export default async function AdminPage() {
  const session = await requireAuth(["admin"]);

  // 3. RoleGate provides additional UI protection
  return (
    <RoleGate allowedRoles={["admin"]}>
      <AdminContent />
    </RoleGate>
  );
}

// 4. Server action validates before execution
async function adminAction() {
  "use server";
  const session = await requireAuth(["admin"]);

  // Perform action
}
```

## Migration Guide

### For Existing Users

Existing users in the database will automatically get the default `user` role when the migration is applied. To promote users:

1. Login as an admin user
2. Go to `/dashboard/users`
3. Change roles as needed

### Initial Admin Setup

To create the first admin user, manually update the database:

```sql
UPDATE "user" SET role = 'admin' WHERE email = 'your-email@example.com';
```

## Troubleshooting

### User Can't Access Expected Routes

1. Check the user's role in `/dashboard/users` (as admin)
2. Verify middleware configuration in `src/middleware.ts`
3. Check session is being refreshed (logout/login)

### Permission Checks Not Working

1. Ensure `getSession()` is being called in server components
2. Verify role is included in session (check Better Auth `user.additionalFields` in `src/lib/auth.ts`)
3. Check TypeScript types are properly extended (`src/types/auth.d.ts`)

### Middleware Redirects Incorrectly

1. Check route order in `PROTECTED_ROUTES` (more specific routes first)
2. Verify `hasRole()` function logic in `src/lib/permissions.ts`
3. Test with different user roles

## File Structure

```
src/
├── app/
│   └── dashboard/
│       ├── layout.tsx          # Dashboard layout with nav
│       ├── page.tsx             # Overview page
│       ├── profile/             # Profile management (all users)
│       ├── blog/                # Blog management
│       ├── newsletter/          # Newsletter subscribers
│       ├── contacts/            # Contact messages
│       └── users/               # User management (admin)
├── components/
│   ├── auth/
│   │   ├── RoleGate.tsx         # Server component
│   │   ├── RoleGateClient.tsx   # Client component
│   │   └── index.ts
│   └── dashboard/
│       └── DashboardNav.tsx     # Dynamic navigation
├── features/
│   └── users/
│       └── actions.ts           # User management actions
├── lib/
│   ├── auth.ts                  # Better Auth configuration
│   ├── rbac.ts                  # requireAuth helper
│   └── permissions.ts           # Permission utilities
├── types/
│   └── auth.d.ts               # Better Auth type extensions
├── db/
│   └── schema.ts               # Database schema with roles
└── middleware.ts               # Route protection
```

## Future Enhancements

Potential improvements to the RBAC system:

1. **Fine-grained permissions**: Add more specific permissions (e.g., `edit_own_posts`, `delete_any_post`)
2. **Role groups**: Create custom role combinations
3. **Temporary permissions**: Time-limited access grants
4. **Audit log**: Track all role changes and permission checks
5. **API keys**: Role-based API access
6. **Multi-tenancy**: Organization-level roles

## Support

For questions or issues with the RBAC system:

1. Check this documentation
2. Review the code examples in `src/components/auth`
3. Test with different user roles
4. Check browser console for permission errors
