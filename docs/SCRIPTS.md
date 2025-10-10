# Script e automation

## Script package.json

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

## Validation Loop (IMPORTANTE per AI)

Dopo ogni feature implementata, esegui in sequenza:

```bash
pnpm format      # 1. Formattazione automatica
pnpm lint        # 2. Controllo qualità codice
pnpm typecheck   # 3. Verifica TypeScript
```

Prima di commit/deploy, aggiungi:

```bash
pnpm build       # 4. Build produzione (catch errori runtime)
```

**Perché questo loop è cruciale:**

- **format**: codice consistente, zero discussioni su stile
- **lint**: catch errori comuni (unused vars, hooks rules, import mancanti)
- **typecheck**: verifica type safety senza compilare
- **build**: simula ambiente produzione, catch lazy loading errors

L'AI può leggere gli errori e auto-correggersi → **guardrail automatico**.

## Script database (Drizzle)

```bash
# Genera migrations da schema
pnpm db:generate             # drizzle-kit generate

# Applica schema al database (senza migration files)
pnpm db:push                 # drizzle-kit push (utile per prototipi rapidi)

# Esplora DB con UI
pnpm db:studio               # drizzle-kit studio (Drizzle Studio su http://localhost:4983)
```

**Workflow tipico:**

1. Modifichi `src/db/schema.ts`
2. Dev rapido: `pnpm db:push` (sync diretto senza migrations)
3. Produzione: `pnpm db:generate` → crea migration files in `drizzle/`
4. Types TypeScript aggiornati automaticamente (Drizzle è TypeScript-first)

**Differenza push vs generate:**

- `db:push`: Sync immediato schema → DB (no migration files, ideale per dev)
- `db:generate`: Crea migration SQL files (da committare e deployare in prod)

## Script Cloudflare Workers

### cf-typegen

Genera TypeScript types per env vars Cloudflare:

```bash
pnpm cf-typegen
```

Crea/aggiorna `cloudflare-env.d.ts` con types per bindings Cloudflare.

**Quando usarlo:**

- Dopo aver aggiunto nuove env vars in `wrangler.jsonc`
- Dopo aver configurato bindings (KV, R2, D1, etc.)

### preview

Build locale e preview con Wrangler:

```bash
pnpm preview
```

Workflow:

1. Build con OpenNext adapter
2. Avvia preview locale su `http://localhost:8787`
3. Simula ambiente Cloudflare Workers

**Utile per:**

- Testare edge runtime prima del deploy
- Debug di problemi specifici Cloudflare
- Verificare compatibilità OpenNext

### deploy

Deploy su Cloudflare Workers:

```bash
pnpm deploy
```

Workflow:

1. Build produzione con OpenNext
2. Upload a Cloudflare Workers
3. Deploy live su `https://your-app.workers.dev`

**Prerequisiti:**

- `wrangler login` eseguito
- Secrets configurati (`wrangler secret put DATABASE_URL`, etc.)
- `wrangler.jsonc` configurato correttamente

## Development workflow

### Start development server

```bash
pnpm dev
```

Avvia Next.js con **Turbopack** (bundler veloce):

- Hot reload ultra-rapido
- TypeScript checking in tempo reale
- Server su `http://localhost:3000`

### Code quality check

```bash
# Check formattazione (no modifica)
pnpm format:check

# Fix formattazione
pnpm format

# Lint check
pnpm lint

# Type check (no build)
pnpm typecheck
```

### Production build

```bash
# Build per Node.js (Vercel, Railway, etc.)
pnpm build

# Start production server (dopo build)
pnpm start
```

## CI (GitHub Actions)

Esempio `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile

      - run: pnpm format:check
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm build

      - name: Check build output
        run: ls -la .next
```

**Note:**

- Template focalizzato su rapid prototyping
- TypeScript + ESLint + build catch molti errori
- Aggiungi test framework quando il progetto matura
- Esegui format/lint localmente prima di push

## Script utili extra

Aggiungi in `package.json` se necessario:

```json
{
  "scripts": {
    // Pulisci cache Next.js
    "clean": "rm -rf .next out node_modules/.cache",

    // Analizza bundle size
    "analyze": "ANALYZE=true next build",

    // Seed database con dati fake (da creare)
    "db:seed": "tsx scripts/seed.ts",

    // Wrangler logs (tail production)
    "logs": "wrangler tail --format pretty",

    // Wrangler dev (alternativa a pnpm preview)
    "wrangler:dev": "wrangler dev"
  }
}
```

### Analyze bundle (opzionale)

Installa:

```bash
pnpm add -D @next/bundle-analyzer
```

Config `next.config.ts`:

```typescript
import type { NextConfig } from "next";

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const config: NextConfig = {
  // ... your config
};

export default withBundleAnalyzer(config);
```

Run:

```bash
pnpm analyze
```

Apre browser con visualizzazione interattiva del bundle.

### Database seed (esempio)

Crea `scripts/seed.ts`:

```typescript
import { db } from "@/db";
import { users, posts } from "@/db/schema";

async function main() {
  console.log("Seeding database...");

  // Create test user
  const [user] = await db
    .insert(users)
    .values({
      email: "test@example.com",
      name: "Test User",
      password: "password123", // Use proper hashing in production
    })
    .returning();

  // Create test post
  await db.insert(posts).values({
    title: "Test Post",
    slug: "test-post",
    content: "This is a test post content",
    authorId: user.id,
    published: true,
    publishedAt: new Date(),
  });

  console.log("Seed completed!");
}

main()
  .catch(console.error)
  .finally(() => process.exit());
```

Run:

```bash
pnpm db:seed
```

## Wrangler CLI (Cloudflare)

Comandi utili Wrangler:

```bash
# Login Cloudflare
pnpm wrangler login

# Gestione secrets
pnpm wrangler secret put DATABASE_URL
pnpm wrangler secret put NEXTAUTH_SECRET
pnpm wrangler secret list

# Tail logs production
pnpm wrangler tail --format pretty

# Deploy (alternativa a pnpm deploy)
pnpm wrangler deploy

# Rollback deploy
pnpm wrangler rollback

# Lista deployments
pnpm wrangler deployments list
```

## Performance tips

**Build pesanti:**

```bash
NODE_OPTIONS="--max-old-space-size=4096" pnpm build
```

**Pulizia periodica:**

```bash
pnpm store prune    # Pulisce cache pnpm
pnpm clean          # Rimuove .next e cache (se hai lo script)
```

**Turbopack caching:**
Turbopack ha cache automatica. Per reset:

```bash
rm -rf .next
pnpm dev
```

## Deployment checklist

Antes di deploy production:

1. ✅ `pnpm format && pnpm lint && pnpm typecheck`
2. ✅ `pnpm build` (verifica build success)
3. ✅ Test manuale su `pnpm preview` (Cloudflare preview)
4. ✅ Verifica env vars production (`wrangler secret list`)
5. ✅ `pnpm deploy`
6. ✅ Smoke test post-deploy (login, form submissions, etc.)
7. ✅ Monitora logs: `pnpm wrangler tail`

## Troubleshooting

### Build fallisce

```bash
# Pulisci tutto e riparti
rm -rf .next node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

### Drizzle Studio non si connette

```bash
# Verifica DATABASE_URL in .env
cat .env | grep DATABASE_URL

# Riavvia studio
pnpm db:studio
```

### Cloudflare preview fallisce

```bash
# Rigenera types Cloudflare
pnpm cf-typegen

# Rebuild
rm -rf .next
pnpm preview
```

### Type errors dopo schema change

```bash
# Drizzle aggiorna types automaticamente, ma puoi forzare:
pnpm db:generate
pnpm typecheck
```
