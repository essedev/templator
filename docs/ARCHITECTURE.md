# Architettura e convenzioni

## Perché le convenzioni rigide aiutano l'AI

L'AI lavora meglio con pattern prevedibili:

- **Naming consistente** → l'AI sa dove cercare e dove creare file
- **Struttura ripetibile** → può replicare feature senza improvvisare
- **Co-location** → tutto correlato nello stesso folder

## Struttura cartelle

```text
src/
  app/
    page.tsx               # Landing page (homepage)
    pricing/
      page.tsx             # Pricing page
    contact/
      page.tsx             # Contact page
    dashboard/
      page.tsx             # Protected dashboard
    login/
      page.tsx             # Login page
    register/
      page.tsx             # Register page
    api/
      auth/
        [...nextauth]/
          route.ts         # NextAuth handler
    layout.tsx             # Root layout
    globals.css            # Global styles
    providers.tsx          # Theme + Toast providers

  components/
    ui/                    # shadcn/ui (button, input, dialog, ...)
    layout/                # navbar, footer, container, theme-toggle
      Navbar.tsx
      Footer.tsx
      ThemeToggle.tsx
    auth/                  # RBAC components
      RoleGate.tsx         # Server component for role-based rendering
      RoleGateClient.tsx   # Client component for role-based rendering
      index.ts
    dashboard/             # Dashboard-specific components
      DashboardNav.tsx     # Dynamic navigation based on user role
    common/                # componenti riusabili custom
      Section.tsx          # Consistent page sections with variants
      PageHeader.tsx       # Page title component
      index.ts

  features/                # Feature-based organization (più importante!)
    auth/
      actions.ts           # Server Actions (sempre questo nome)
      schema.ts            # Zod schemas (sempre questo nome)
      README.md            # Spiega la feature (to be created)
    users/
      actions.ts           # Admin user management actions
    profile/
      actions.ts           # Profile update actions
      EditProfileForm.tsx  # Profile editing form
    blog/
      actions.ts           # Blog CRUD operations
      schema.ts            # Zod validation schemas
      PostForm.tsx         # Create/edit post form
      README.md            # Blog feature documentation
    contact/
      actions.ts
      schema.ts
      ContactForm.tsx
      README.md
    newsletter/
      actions.ts
      schema.ts
      NewsletterForm.tsx
      README.md

  lib/
    auth.ts                # NextAuth config
    permissions.ts         # RBAC permission system (hasPermission, can, etc.)
    utils.ts               # Utility generiche (cn, formatDate, ...)
    email.ts               # Email sending (mock by default)

  db/
    schema.ts              # Drizzle schema
    index.ts               # Database client

  hooks/                   # Custom hooks React
    (empty for now)

  types/                   # TypeScript types condivisi
    next-auth.d.ts         # NextAuth session/user extensions for RBAC

  middleware.ts            # Route protection (RBAC middleware)
```

## Convenzioni naming (rigide)

### File e folder

- **Componenti React**: `PascalCase.tsx` (es. `ContactForm.tsx`)
- **Utility/lib**: `kebab-case.ts` (es. `format-date.ts`)
- **Route folders**: `kebab-case` (es. `app/blog-post/[slug]/page.tsx`)
- **Feature folders**: `kebab-case` (es. `features/user-profile/`)

### Naming interno feature

Ogni feature segue **sempre** questa struttura:

```
features/[feature-name]/
  actions.ts        # Server Actions (export named functions)
  schema.ts         # Zod schemas (export const schemas)
  [Feature]Form.tsx # Componente principale (opzionale)
  README.md         # Documentazione feature
```

**Esempio `features/newsletter/`:**

```typescript
// actions.ts
"use server";
export async function subscribeToNewsletter(input: unknown) { ... }

// schema.ts
export const newsletterSchema = z.object({ email: z.string().email() });

// NewsletterForm.tsx
export function NewsletterForm() { ... }
```

### Import paths

- **Sempre import assoluti** con alias `@/`

  ```typescript
  // ✅ Corretto
  import { Button } from "@/components/ui/button";
  import { subscribeToNewsletter } from "@/features/newsletter/actions";
  import { newsletterSchema } from "@/features/newsletter/schema";

  // ❌ Sbagliato
  import { Button } from "../../components/ui/button";
  ```

## Pattern architetturali

### 1. Server Actions (preferiti)

Per operazioni CRUD semplici, usa Server Actions in `features/[name]/actions.ts`:

```typescript
"use server";

import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { newsletterSchema } from "./schema";

export async function subscribeToNewsletter(input: unknown) {
  const data = newsletterSchema.parse(input);
  await db.insert(newsletterSubscribers).values(data);
}
```

**Quando NON usare Server Actions:**

- Endpoint pubblici (API per mobile app, webhook)
- Rate limiting / middleware complessi
- Response non-JSON (file download, streaming)

### 2. API Routes (solo se necessario)

Per casi complessi, crea in `app/api/[name]/route.ts`:

```typescript
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  // logica complessa
}
```

### 3. Stato client

**Ordine di preferenza:**

1. **Server Components** (nessuno stato client)
2. **useState** (stato locale componente)
3. **Context** (stato condiviso parent-children)
4. **Zustand** (solo se serve stato globale persistente)

### 4. Data fetching

**Ordine di preferenza:**

1. **Server Components** (fetch diretto in async component)

   ```typescript
   import { db } from "@/db";
   import { contactMessages } from "@/db/schema";
   import { desc } from "drizzle-orm";

   async function MessageList() {
     const messages = await db
       .select()
       .from(contactMessages)
       .orderBy(desc(contactMessages.createdAt));
     return <div>{messages.map(...)}</div>;
   }
   ```

2. **Server Actions** (per form submission)

3. **TanStack Query** (solo se serve caching/polling/optimistic updates)

## README nei folder importanti

Ogni feature e sezione complessa ha un `README.md` che spiega:

- Cosa fa la feature
- Come estenderla
- Dipendenze e configurazione

**Esempio `features/auth/README.md`:**

```markdown
# Auth Feature

Gestisce autenticazione utenti con NextAuth v5 + Drizzle.

## Componenti

- `LoginForm.tsx` - Form di login con email/password
- `RegisterForm.tsx` - Registrazione nuovo utente

## Server Actions

- `signIn()` - Login (via NextAuth)
- `signOut()` - Logout (via NextAuth)

## Configurazione

Richiede env vars in `.env`:

- NEXTAUTH_SECRET
- NEXTAUTH_URL
- DATABASE_URL
- GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET (per OAuth, opzionale)

## Estendere

Per aggiungere un provider OAuth:

1. Aggiungi credentials in `.env`
2. Aggiungi provider in `lib/auth.ts` providers array
3. Provider disponibile automaticamente in UI
```

## Accessibilità (baseline)

- **Focus visibile**: `focus-visible:ring-2` su elementi interattivi
- **Aria attributes**: usa componenti shadcn (già accessibili)
- **Contrasto**: usa variabili Tailwind (`text-foreground`, `bg-background`)
- **Semantic HTML**: `<nav>`, `<main>`, `<article>`, `<button>` (non `<div onClick>`)

## Anti-pattern da evitare

❌ **Mega componenti** (500+ righe)
✅ Spezza in sottocomponenti

❌ **Logica business nei componenti**
✅ Sposta in Server Actions o helper functions

❌ **Import relativi** (`../../components`)
✅ Usa alias assoluti `@/components`

❌ **Props drilling 3+ livelli**
✅ Usa Context o Zustand

❌ **Stato globale per tutto**
✅ Preferisci Server Components e stato locale
