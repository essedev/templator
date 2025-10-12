import type { AppSession, Role } from "@/types/auth.d";

/**
 * Definizione ruoli disponibili nel sistema
 * Imported from types/auth.d.ts
 */
export type { Role };

/**
 * Definizione permessi disponibili nel sistema
 */
export type Permission =
  | "view_dashboard"
  | "view_own_content"
  | "manage_blog"
  | "manage_newsletter"
  | "view_contacts"
  | "manage_users"
  | "system_settings";

/**
 * Mappa permessi per ruolo.
 * Ogni ruolo eredita i permessi dei ruoli inferiori.
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
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

/**
 * Gerarchia ruoli (dal più basso al più alto)
 */
export const ROLE_HIERARCHY: Role[] = ["user", "editor", "admin"];

/**
 * Verifica se un utente ha un permesso specifico
 */
export function hasPermission(userRole: Role | undefined | null, permission: Permission): boolean {
  if (!userRole) return false;
  return ROLE_PERMISSIONS[userRole].includes(permission);
}

/**
 * Verifica se un utente ha uno dei permessi specificati
 */
export function hasAnyPermission(
  userRole: Role | undefined | null,
  permissions: Permission[]
): boolean {
  if (!userRole) return false;
  return permissions.some((permission) => ROLE_PERMISSIONS[userRole].includes(permission));
}

/**
 * Verifica se un utente ha tutti i permessi specificati
 */
export function hasAllPermissions(
  userRole: Role | undefined | null,
  permissions: Permission[]
): boolean {
  if (!userRole) return false;
  return permissions.every((permission) => ROLE_PERMISSIONS[userRole].includes(permission));
}

/**
 * Verifica se un utente ha un ruolo specifico o superiore
 */
export function hasRole(userRole: Role | undefined | null, requiredRole: Role): boolean {
  if (!userRole) return false;
  const userRoleIndex = ROLE_HIERARCHY.indexOf(userRole);
  const requiredRoleIndex = ROLE_HIERARCHY.indexOf(requiredRole);
  return userRoleIndex >= requiredRoleIndex;
}

/**
 * Verifica se un utente è un admin
 */
export function isAdmin(userRole: Role | undefined | null): boolean {
  return userRole === "admin";
}

/**
 * Verifica se un utente è almeno un editor
 */
export function isEditor(userRole: Role | undefined | null): boolean {
  return hasRole(userRole, "editor");
}

/**
 * Helper per verificare permessi da una session
 */
export function can(session: AppSession | null, permission: Permission): boolean {
  return hasPermission(session?.user?.role, permission);
}

/**
 * Helper per verificare ruolo da una session
 */
export function checkRole(session: AppSession | null, requiredRole: Role): boolean {
  return hasRole(session?.user?.role, requiredRole);
}
