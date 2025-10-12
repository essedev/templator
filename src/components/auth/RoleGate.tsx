import { getSession } from "@/lib/auth";
import { hasRole, type Role } from "@/lib/permissions";

interface RoleGateProps {
  children: React.ReactNode;
  allowedRoles: Role[];
  fallback?: React.ReactNode;
}

/**
 * Server Component per controllare i ruoli dell'utente.
 * Mostra il contenuto solo se l'utente ha uno dei ruoli specificati.
 *
 * @example
 * ```tsx
 * <RoleGate allowedRoles={["admin"]}>
 *   <AdminPanel />
 * </RoleGate>
 * ```
 */
export async function RoleGate({ children, allowedRoles, fallback = null }: RoleGateProps) {
  const session = await getSession();
  const userRole = session?.user?.role;

  // Verifica se l'utente ha uno dei ruoli richiesti
  const hasRequiredRole = allowedRoles.some((role) => hasRole(userRole, role));

  if (!hasRequiredRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
