import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { hasRole, type Role } from "@/lib/permissions";

/**
 * Server-side helper per verificare autenticazione e autorizzazione.
 * Usato nei server components e server actions.
 *
 * @param allowedRoles - Array di ruoli permessi. Se undefined, richiede solo autenticazione.
 * @param redirectTo - URL di redirect se l'utente non ha i permessi (default: /dashboard)
 * @returns La sessione dell'utente se autorizzato
 * @throws Redirect se non autenticato o non autorizzato
 *
 * @example
 * // Solo autenticazione
 * const session = await requireAuth();
 *
 * @example
 * // Richiede ruolo admin
 * const session = await requireAuth(["admin"]);
 *
 * @example
 * // Richiede editor o admin
 * const session = await requireAuth(["editor", "admin"]);
 */
export async function requireAuth(allowedRoles?: Role[], redirectTo: string = "/dashboard") {
  const session = await getSession();

  // Verifica autenticazione
  if (!session?.user) {
    redirect("/login");
  }

  // Se sono specificati ruoli, verifica autorizzazione
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = session.user.role;
    const hasRequiredRole = allowedRoles.some((role) => hasRole(userRole, role));

    if (!hasRequiredRole) {
      redirect(redirectTo);
    }
  }

  return session;
}
