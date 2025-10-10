# Setup del progetto

## Prerequisiti

- Node 20+
- pnpm (o npm, yarn, bun)

## 1. Bootstrap Next.js

```bash
pnpm create next-app my-app --typescript --tailwind --eslint
cd my-app
```

## 2. Installa dipendenze core

```bash
# Form e validazione
pnpm add zod react-hook-form @hookform/resolvers

# UI e styling
pnpm add lucide-react next-themes clsx tailwind-merge class-variance-authority sonner

# Database e auth
pnpm add drizzle-orm @neondatabase/serverless
pnpm add next-auth@beta @auth/drizzle-adapter

# Dev tools
pnpm add -D drizzle-kit @types/node \
  eslint prettier eslint-config-prettier

# Cloudflare deployment
pnpm add -D @opennextjs/cloudflare wrangler
```

## 3. Installa dipendenze opzionali (solo se necessarie)

```bash
# TanStack Query (se serve caching client complesso)
pnpm add @tanstack/react-query

# Zustand (se serve stato globale)
pnpm add zustand

# Framer Motion (se servono animazioni avanzate)
pnpm add framer-motion
```

## 4. Config ESLint

Crea/aggiorna `.eslintrc.json`:

```json
{
  "extends": ["next/core-web-vitals", "prettier"],
  "rules": {
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }
    ],
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

Crea `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

## 5. Drizzle init

Crea `drizzle.config.ts`:

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

Crea `src/db/schema.ts` (vedi EXAMPLES.md per schema completo).

Genera migrations:

```bash
pnpm db:generate
```

Applica al database:

```bash
pnpm db:push
```

Apri Drizzle Studio (opzionale):

```bash
pnpm db:studio
```

## 6. shadcn/ui

Inizializza:

```bash
pnpm dlx shadcn@latest init
```

Scegli:

- Style: **Default**
- Base color: **Slate** (o il tuo preferito)
- CSS variables: **Yes**

Aggiungi componenti base:

```bash
pnpm dlx shadcn@latest add button input label textarea \
  dialog dropdown-menu sheet card badge avatar tooltip
```

## 7. Struttura folders

Crea la struttura base (segui ARCHITECTURE.md):

```bash
mkdir -p src/{features,lib,hooks,types,styles}
mkdir -p src/components/{ui,layout,common}
mkdir -p src/app/{api/auth,'(marketing)','(dashboard)'}
```

## 8. Config files essenziali

### `tsconfig.json`

Assicurati di avere path aliases:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### `src/db/index.ts` (Drizzle client)

```typescript
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
```

### `src/lib/auth.ts` (vedi EXAMPLES.md)

Config NextAuth v5 con Drizzle adapter.

### `src/app/providers.tsx` (vedi EXAMPLES.md)

Provider per ThemeProvider (e opzionalmente React Query).

## 9. Script package.json

Aggiungi/aggiorna in `package.json`:

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit",
    "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
    "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
    "cf-typegen": "wrangler types --env-interface CloudflareEnv ./cloudflare-env.d.ts",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

## 10. Env setup

Crea `.env` con le variabili necessarie:

```bash
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="run: openssl rand -base64 32"

# Email (optional - mock by default)
ADMIN_EMAIL="admin@yourdomain.com"
# RESEND_API_KEY="re_xxxxx"  # Uncomment to enable real emails

# OAuth providers (opzionali)
# GITHUB_CLIENT_ID=""
# GITHUB_CLIENT_SECRET=""
# GOOGLE_CLIENT_ID=""
# GOOGLE_CLIENT_SECRET=""
```

Per generare `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

Per ottenere `DATABASE_URL`:

1. Crea database gratuito su [Neon](https://neon.tech)
2. Copia connection string dalla dashboard

## 11. Validation loop (verifica setup)

```bash
pnpm format      # Formatta tutto il codice
pnpm lint        # Controlla errori
pnpm typecheck   # Verifica TypeScript
pnpm build       # Build di produzione
```

Se tutti i comandi passano → setup completato ✅

## 12. Primo avvio

```bash
pnpm dev
```

Apri http://localhost:3000

## Prossimi step

1. Leggi [AI_WORKFLOW.md](AI_WORKFLOW.md) per capire come lavorare con AI
2. Esplora [ARCHITECTURE.md](ARCHITECTURE.md) per convenzioni
3. Usa [docs/recipes/](recipes/) come template per feature comuni
4. Personalizza theme Tailwind in `tailwind.config.ts`
