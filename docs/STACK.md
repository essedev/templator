# Stack tecnica e motivazioni

## Stack Core (sempre installata)

### Framework e linguaggio

**Next.js 15 (App Router)**

- Server Components di default → meno JS al client
- Server Actions → backend semplice senza API routes
- Routing file-based → prevedibile per AI
- Ottimizzazioni built-in (immagini, font, bundle)

**TypeScript (strict mode)**

- Type safety → l'AI può verificare errori in fase di scrittura
- Autocomplete eccellente → suggerimenti accurati
- Refactoring sicuro → rename/move senza rompere tutto
- JSDoc + tipi → documentazione inline che l'AI legge

### UI e styling

**TailwindCSS**

- Utility-first → zero context switching
- Design tokens nel codice → personalizzazione rapida
- IntelliSense → l'AI sa tutte le classi disponibili
- Purge automatico → bundle CSS minimo

**shadcn/ui**

- Componenti copia-incolla (non npm package) → personalizzabili 100%
- Accessibilità built-in (Radix UI) → ARIA automatico
- Variant API (class-variance-authority) → pattern prevedibili
- L'AI conosce la struttura → può estendere facilmente

**Lucide Icons**

- Tree-shakeable → solo icone usate nel bundle
- API consistente → tutti i nomi prevedibili
- TypeScript nativo

### Dati e backend

**Drizzle ORM**

- TypeScript-first → schema = types nativi
- Performance eccellente → SQL-like API, zero overhead
- Drizzle Kit → migrations, Drizzle Studio
- Edge-ready → perfetto per Cloudflare Workers
- L'AI legge lo schema facilmente → può generare query corrette

**Perché Drizzle e non Prisma?**

- Drizzle è TypeScript-first nativo (schema = codice TS)
- Performance superiori (importante per edge/serverless)
- Compatibilità perfetta con Cloudflare Workers e Neon
- Meno overhead e bundle size più piccolo

### Form e validazione

**React Hook Form + Zod**

- Zod schema condivisibili server/client → DRY
- Validation centralizzata → unica fonte di verità
- Performance (uncontrolled components)
- Pattern ripetibile → l'AI replica facilmente

### Auth

**NextAuth v5 (Auth.js)**

- Integrazione nativa con Next.js App Router
- Drizzle Adapter → seamless integration con database
- JWT + Database sessions → flessibilità completa
- Credentials provider → email/password out-of-the-box
- Estendibile con OAuth providers (GitHub, Google, ecc.)
- Callbacks personalizzabili → controllo totale su session/token

**RBAC (Role-Based Access Control)**

- Three-tier role system: user, editor, admin
- Permission helpers in `src/lib/permissions.ts`
- Server components: `RoleGate` for conditional rendering
- Client components: `RoleGateClient` with `useSession()`
- Middleware protection for route-level access control
- Type-safe role extensions in NextAuth session

**Perché NextAuth v5?**

- Integrazione perfetta con Next.js 15
- Drizzle adapter ufficiale ben supportato
- Ecosistema maturo e community grande
- Pattern prevedibili → AI replica facilmente
- Funziona su edge runtime (Cloudflare Workers)

### Qualità codice

**ESLint (config bilanciata)**

- Catch errori comuni → import mancanti, unused vars
- React hooks rules → dependency array corretti
- No regole estetiche (gestite da Prettier)
- L'AI può leggere errori e auto-correggersi

**Prettier**

- Formatting automatico → zero discussioni su stile
- Config condivisa → consistenza nel team (umano+AI)

## Stack Opzionale (aggiungi solo se serve)

### TanStack Query

**Quando usarlo:**

- Polling/refetch automatico necessario
- Caching complesso (infinite scroll, pagination)
- Optimistic updates
- Sincronizzazione multi-tab

**Quando NON serve:**

- Se usi solo Server Components + Server Actions
- Per form semplici (RHF + Server Actions basta)
- Per dati che non cambiano spesso

### Zustand

**Quando usarlo:**

- Stato globale client necessario (es. cart e-commerce)
- Condivisione stato tra componenti distanti
- Stato che persiste (localStorage sync)

**Quando NON serve:**

- App Router gestisce routing state
- Server Components eliminano molti use case
- useState + Context spesso sufficiente

### Framer Motion

**Quando usarlo:**

- Animazioni complesse (orchestrazioni, sequenze)
- Gesture (drag, swipe)
- Animazioni layout (reordering, shared elements)

**Quando NON serve:**

- Transizioni semplici (usa CSS transitions)
- Fade/slide (TailwindCSS + CSS animations basta)
- Performance critica (CSS è più veloce)

## Deployment

**Cloudflare Workers (consigliato)**

- Edge deployment globale → latenza minima
- Zero cold starts → performance costanti
- OpenNext adapter → compatibilità Next.js
- Free tier generoso (100k richieste/giorno)
- Neon PostgreSQL → database serverless perfetto
- Wrangler CLI → deploy in secondi

**Perché Cloudflare Workers?**

- Performance superiori su edge network globale
- Costo inferiore rispetto ad alternative
- Ottimo per app serverless con Neon PostgreSQL
- OpenNext mantiene compatibilità con Next.js features

**Alternative:**

- Vercel (ottimo per Next.js, ma più costoso)
- Railway, Render, Fly.io (Dockerfile required)
- Self-hosted (Docker + Nginx)

## Cosa NON includiamo (e perché)

**Testing frameworks (Vitest, Jest, Testing Library)**

- Overhead per MVP/prototipi rapidi
- TypeScript + ESLint + build già catch molti errori
- Se serve in futuro, aggiungi manualmente

**Storybook**

- Troppo setup per rapid development
- L'AI può vedere componenti direttamente nel codice
- shadcn/ui ha già esempi nella doc

**Turborepo / monorepo tools**

- Overhead per progetti singoli
- Se cresci, aggiungi dopo

**End-to-end testing (Playwright, Cypress)**

- Per fase di maturità successiva
- Template focalizzato su rapid prototyping
