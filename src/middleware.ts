import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route protette che richiedono autenticazione.
 * La verifica RBAC dettagliata è gestita dai layout server components.
 */
const PROTECTED_ROUTES = ["/dashboard"];

/**
 * Middleware minimale per autenticazione.
 * Edge Runtime compatible - verifica solo la presenza del cookie di sessione Better Auth.
 *
 * RBAC (Role-Based Access Control) è gestito nei layout server components,
 * dove possiamo usare getSession() senza problemi di Edge Runtime.
 */
export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Verifica se la route richiede autenticazione
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => path.startsWith(route));

  if (isProtectedRoute) {
    // Better Auth usa il cookie "better-auth.session_token"
    const sessionToken = req.cookies.get("better-auth.session_token");

    // Se non c'è il cookie di sessione, redirect a login
    if (!sessionToken) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

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
