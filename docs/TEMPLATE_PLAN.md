# Piano di creazione del template

Fase 0 — Requisiti:

- Node 20+ e pnpm
- Repo Git inizializzata
- Account DB (Neon/Supabase) opzionale per prod

Fase 1 — Bootstrap base:

- Create Next App con TypeScript e Tailwind
- Configura ESLint + Prettier
- Aggiungi path aliases e tsconfig base

Fase 2 — Token di design e stile:

- Configura Tailwind (container, colori, radius, spacing)
- Installa shadcn/ui e genera i primi componenti base (Button, Input, ecc.)
- Setup dark mode con next-themes

Fase 3 — Architettura:

- Struttura cartelle "features", "components", "lib", "app"
- Convenzioni naming rigide

Fase 4 — Dati:

- Drizzle init (Neon PostgreSQL)
- Schema iniziale (User, Account, Session, ContactMessage, Newsletter)
- Setup client Drizzle
- Migrazioni con Drizzle Kit e Drizzle Studio

Fase 5 — Auth:

- NextAuth v5 setup
- Drizzle adapter, JWT + Database sessions
- Credentials provider base
- Social providers opzionali (GitHub, Google)

Fase 6 — Componenti e pagine base:

- Layout, Navbar, Footer, ThemeToggle
- Home con Hero, Features, CTA
- Pricing page
- Blog (listing + detail + admin CRUD)
- Contact form (Server Action + email/DB)
- Newsletter signup form
- Admin area protetta (/admin/blog)

Fase 7 — DX e CI:

- ESLint + Prettier config bilanciata (non restrittiva)
- Validation loop: format, lint, typecheck
- GitHub Actions per lint, typecheck, build
- Note: No test framework (focalizzato su rapid prototyping)

Fase 8 — Documentazione:

- Questo set di file markdown
- Commenti inline e README aggiornato

Criteri di completamento:

- pnpm install && pnpm dev funziona
- Validation loop verde (format, lint, typecheck, build)
- Registrazione utente e login base funzionanti
- Contact form salva su DB
- Pages e componenti base presenti e themable
- Documentazione AI_WORKFLOW.md completa
- Recipes per feature comuni presenti
