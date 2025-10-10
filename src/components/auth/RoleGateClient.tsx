"use client";

import { useSession } from "next-auth/react";
import { hasRole, type Role } from "@/lib/permissions";

interface RoleGateClientProps {
  children: React.ReactNode;
  allowedRoles: Role[];
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
}

/**
 * Client component per conditional rendering basato su ruoli utente.
 * Usa useSession() per accedere alla session lato client.
 *
 * @example
 * ```tsx
 * "use client";
 *
 * <RoleGateClient
 *   allowedRoles={["admin"]}
 *   fallback={<p>Admin only</p>}
 * >
 *   <AdminButton />
 * </RoleGateClient>
 * ```
 */
export function RoleGateClient({
  children,
  allowedRoles,
  fallback = null,
  loading = null,
}: RoleGateClientProps) {
  const { data: session, status } = useSession();

  // Loading state
  if (status === "loading") {
    return <>{loading}</>;
  }

  // Check if user has required role
  const userRole = session?.user?.role;
  const hasRequiredRole = allowedRoles.some((role) => hasRole(userRole, role));

  if (!hasRequiredRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
