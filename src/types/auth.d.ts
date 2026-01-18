/**
 * Type definitions for Better Auth with custom role field.
 *
 * This file provides strict typing for the authentication system:
 * - Role: The allowed user roles in the system
 * - AppUser: User type with guaranteed role field typing
 * - AppSession: Session type returned by getSession()
 *
 * Better Auth infers the role field type from runtime config, which results
 * in a generic `string` type. These definitions ensure strict typing throughout
 * the application.
 *
 * @see src/lib/auth.ts - Auth configuration
 * @see src/lib/rbac.ts - Role-based access control
 * @see docs/RBAC.md - RBAC documentation
 */

/**
 * User roles in the application.
 *
 * - user: Default role for new registrations. Can access their own profile.
 * - editor: Content managers. Can manage blog, newsletter, and contacts.
 * - admin: Full access. Can manage users and all system settings.
 *
 * Role hierarchy: user < editor < admin
 */
export type Role = "user" | "editor" | "admin";

/**
 * Application User type with all fields from Better Auth.
 *
 * Better Auth infers role from runtime config, but we want strict typing.
 * We explicitly define all fields to ensure type safety.
 */
export interface AppUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
  role: Role;
}

/**
 * Application Session type returned by getSession().
 *
 * This is the type you get when calling:
 * ```typescript
 * const session = await getSession();
 * if (session) {
 *   session.user.role // "user" | "editor" | "admin" (type-safe!)
 * }
 * ```
 */
export interface AppSession {
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  user: AppUser;
}

/**
 * Module augmentation for Better Auth types.
 *
 * This ensures that Better Auth's internal types also recognize
 * our custom role field, improving type inference throughout.
 */
declare module "better-auth/types" {
  interface User {
    role: Role;
  }
}
