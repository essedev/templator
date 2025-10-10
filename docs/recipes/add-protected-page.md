# Recipe: Aggiungere una pagina protetta

Template step-by-step per creare pagine che richiedono autenticazione.

## Use Case

- Dashboard utente
- Settings/profilo
- Area admin
- Qualsiasi pagina che richiede login

## Step 1: Scegli il layout

Next.js App Router permette route groups per layout condivisi, ma in questo template usiamo route dirette per semplicità.

```
src/app/
  page.tsx              # Homepage (pubblica)
  pricing/              # Pricing (pubblica)
  blog/                 # Blog (pubblica)
  dashboard/            # Dashboard (protetta)
    page.tsx
  settings/             # Settings (protetta)
    page.tsx
  admin/                # Admin area (protetta)
    layout.tsx          # Layout condiviso con auth check
    blog/
      page.tsx
```

## Step 2: Crea la pagina protetta

### Esempio: Settings Page

**File:** `src/app/settings/page.tsx`

```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Pagina settings utente (protetta).
 * Redirect a login se non autenticato.
 */
export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="container py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Settings</h1>

      <section className="space-y-6">
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Profilo</h2>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm text-muted-foreground">Nome</dt>
              <dd className="font-medium">{session.user.name || "N/A"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Email</dt>
              <dd className="font-medium">{session.user.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">ID</dt>
              <dd className="font-mono text-sm">{session.user.id}</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
```

## Step 3: Layout condiviso per area privata (opzionale)

**File:** `src/app/admin/layout.tsx` (già implementato)

```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

/**
 * Layout condiviso per area admin.
 * Verifica auth una sola volta per tutte le pagine admin.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.name || session.user.email}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="md:col-span-1">
          <nav className="space-y-1">
            <Link
              href="/admin/blog"
              className="block px-3 py-2 rounded-md hover:bg-muted transition-colors"
            >
              Blog Posts
            </Link>
            <Link
              href="/dashboard"
              className="block px-3 py-2 rounded-md hover:bg-muted transition-colors"
            >
              Dashboard
            </Link>
          </nav>
        </aside>

        <Separator className="md:hidden" />

        {/* Main content */}
        <main className="md:col-span-3">{children}</main>
      </div>
    </div>
  );
}
```

**Vantaggio:** Tutte le pagine sotto `/admin/*` sono automaticamente protette dal layout.

**File:** `src/app/admin/analytics/page.tsx`

```typescript
// Questa pagina eredita la protezione dal layout padre
export default function AnalyticsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Analytics</h2>
      {/* Contenuto analytics */}
    </div>
  );
}
```

## Step 4: Middleware per protezione globale (opzionale)

Se vuoi proteggere **tutte** le route admin automaticamente, usa middleware NextAuth.

**File:** `src/middleware.ts` (già implementato)

```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Middleware per proteggere route admin.
 * Verifica autenticazione per tutte le route /admin/*.
 */
export default auth((req) => {
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");

  // Se è una route admin e l'utente non è autenticato, redirect a login
  if (isAdminRoute && !req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

**Vantaggio:** Non devi aggiungere `auth()` check in ogni pagina admin, il middleware lo fa globalmente.

## Step 5: Redirect dopo login

Quando utente fa login, redirect alla pagina protetta che voleva visitare.

**File:** `src/app/login/page.tsx` (già implementato)

```typescript
import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  // Se già loggato, redirect
  const session = await auth();
  if (session?.user) {
    redirect(searchParams.callbackUrl || "/dashboard");
  }

  return (
    <div className="container py-12 max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-8">Login</h1>
      <LoginForm callbackUrl={searchParams.callbackUrl} />
    </div>
  );
}
```

## Pattern comuni

### 1. Protezione con role-based access (RBAC)

Il template include un sistema RBAC completo con tre ruoli: `user`, `editor`, `admin`.

**Metodo 1: Check diretto nel page component**

```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminOnlyPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check role - admin only
  if (session.user.role !== "admin") {
    redirect("/dashboard"); // Forbidden
  }

  return <div>Admin Content</div>;
}
```

**Metodo 2: Usando RoleGate component (recommended)**

```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RoleGate } from "@/components/auth";

export default async function EditorPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div>
      <h1>Content Management</h1>

      {/* Editor and Admin can see */}
      <RoleGate allowedRoles={["editor", "admin"]}>
        <BlogEditor />
      </RoleGate>

      {/* Only admin can see */}
      <RoleGate
        allowedRoles={["admin"]}
        fallback={<p>Admin only feature</p>}
      >
        <UserManagement />
      </RoleGate>
    </div>
  );
}
```

**Metodo 3: Client component con RoleGateClient**

```typescript
"use client";

import { RoleGateClient } from "@/components/auth";

export function AdminMenu() {
  return (
    <nav>
      <MenuItem href="/dashboard">Dashboard</MenuItem>
      <MenuItem href="/dashboard/profile">Profile</MenuItem>

      {/* Only visible to editor/admin */}
      <RoleGateClient allowedRoles={["editor", "admin"]}>
        <MenuItem href="/dashboard/blog">Blog</MenuItem>
      </RoleGateClient>

      {/* Only visible to admin */}
      <RoleGateClient allowedRoles={["admin"]}>
        <MenuItem href="/dashboard/users">Users</MenuItem>
      </RoleGateClient>
    </nav>
  );
}
```

Per maggiori dettagli sul sistema RBAC, vedi `docs/RBAC.md`.

### 2. Loading state durante auth check

NextAuth gestisce automaticamente lo stato di caricamento. Se vuoi un loading custom:

```typescript
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProtectedPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ProtectedContent />
    </Suspense>
  );
}

async function ProtectedContent() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <div>Protected content</div>;
}

function LoadingSkeleton() {
  return (
    <div className="container py-12">
      <Skeleton className="h-12 w-64 mb-4" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
```

### 3. Protezione con Server Actions

Le Server Actions possono verificare auth prima di eseguire operazioni:

```typescript
"use server";

import { auth } from "@/lib/auth";

export async function deletePost(postId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verifica ownership
  const post = await db.select().from(posts).where(eq(posts.id, postId));
  if (post.authorId !== session.user.id) {
    throw new Error("Forbidden");
  }

  await db.delete(posts).where(eq(posts.id, postId));
}
```

## Checklist

- [ ] Pagina protetta creata con `auth()` check
- [ ] Redirect a `/login` se non autenticato
- [ ] `callbackUrl` nel redirect per tornare alla pagina desiderata
- [ ] Layout condiviso per area privata (opzionale)
- [ ] Middleware per protezione globale (opzionale)
- [ ] Role-based access implementato (se necessario)

## Troubleshooting

**Errore: "Cannot read properties of null (reading 'user')"**
→ Assicurati che `auth()` venga chiamato prima di accedere a `session.user`

**Redirect loop infinito**
→ Controlla che la route di login (`/login`) non sia protetta

**Session undefined in produzione**
→ Verifica che `NEXTAUTH_SECRET` sia configurato correttamente su Cloudflare

✅ Pagina protetta implementata!
