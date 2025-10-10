import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { hasRole } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";

/**
 * Mappa delle route protette e ruoli richiesti.
 * Le route sono controllate in ordine, quindi metti le più specifiche prima.
 */
const PROTECTED_ROUTES: Record<string, Role[]> = {
  "/dashboard/users": ["admin"],
  "/dashboard/settings": ["admin"],
  "/dashboard/blog": ["editor", "admin"],
  "/dashboard/newsletter": ["editor", "admin"],
  "/dashboard/contacts": ["editor", "admin"],
  "/dashboard": ["user", "editor", "admin"], // Base: tutti gli utenti autenticati
};

/**
 * Middleware RBAC (Role-Based Access Control).
 * Protegge le route in base al ruolo dell'utente.
 */
export default auth((req) => {
  const path = req.nextUrl.pathname;
  const user = req.auth?.user;

  // Verifica autenticazione e autorizzazione per route protette
  for (const [route, allowedRoles] of Object.entries(PROTECTED_ROUTES)) {
    if (path.startsWith(route)) {
      // Se non autenticato, redirect a login
      if (!user) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", path);
        return NextResponse.redirect(loginUrl);
      }

      // Verifica se l'utente ha uno dei ruoli richiesti
      const hasRequiredRole = allowedRoles.some((role) => hasRole(user.role, role));

      // Se non ha i permessi, redirect a dashboard base con errore
      if (!hasRequiredRole) {
        const dashboardUrl = new URL("/dashboard", req.url);
        dashboardUrl.searchParams.set("error", "unauthorized");
        return NextResponse.redirect(dashboardUrl);
      }

      // Ha i permessi, continua
      break;
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
