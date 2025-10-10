# AI Workflow — Come lavorare con questo template

Questo template è ottimizzato per sviluppo con AI (Cursor, Claude Code, GitHub Copilot, ecc.).

## Perché questo template è AI-friendly

1. **Convenzioni naming rigide** → l'AI sa esattamente dove cercare/creare file
2. **Pattern ripetibili** → ogni feature segue la stessa struttura
3. **Type-safety pervasiva** → TypeScript + Zod + Drizzle types guidano l'AI verso codice corretto
4. **Documentazione inline** → JSDoc e commenti che l'AI legge
5. **Validation loop** → ESLint/TypeScript catch errori automaticamente
6. **Drizzle TypeScript-first** → AI genera DB queries con autocomplete perfetto

## Pattern: Aggiungere una nuova feature

Ogni feature segue **sempre** questa struttura:

```
src/features/[feature-name]/
  ├── actions.ts       # Server Actions (export named functions)
  ├── schema.ts        # Zod schemas (export const schemas)
  ├── [Feature]*.tsx   # Componenti React
  └── README.md        # Documentazione feature (opzionale ma consigliato)
```

### Esempio: Feature "Newsletter"

**Prompt per AI:**

> "Aggiungi una feature newsletter seguendo la struttura in `features/contact`. Include:
>
> - Drizzle table `newsletterSubscribers` (email, status, subscribedAt)
> - Server Action per subscribe/unsubscribe
> - Form con validazione Zod
>
> Dopo l'implementazione, esegui `pnpm format && pnpm lint && pnpm typecheck`."

**L'AI creerà:**

1. **Schema Drizzle** (`src/db/schema.ts`)

```typescript
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const newsletterSubscribers = pgTable("newsletter_subscriber", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  status: text("status").notNull().default("active"),
  subscribedAt: timestamp("subscribedAt", { mode: "date" }).notNull().defaultNow(),
});
```

2. **Schema Zod** (`src/features/newsletter/schema.ts`)

```typescript
import { z } from "zod";

export const newsletterSchema = z.object({
  email: z.string().email("Email non valida"),
});

export type NewsletterFormData = z.infer<typeof newsletterSchema>;
```

3. **Server Actions** (`src/features/newsletter/actions.ts`)

```typescript
"use server";

import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { newsletterSchema } from "./schema";
import { eq } from "drizzle-orm";

export async function subscribeNewsletter(input: unknown) {
  const { email } = newsletterSchema.parse(input);

  // Check if exists
  const [existing] = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, email))
    .limit(1);

  if (existing) {
    // Update status
    await db
      .update(newsletterSubscribers)
      .set({ status: "active" })
      .where(eq(newsletterSubscribers.email, email));
  } else {
    // Insert new
    await db.insert(newsletterSubscribers).values({ email, status: "active" });
  }
}
```

4. **Form Component** (`src/features/newsletter/NewsletterForm.tsx`)

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { subscribeNewsletter } from "./actions";
import { newsletterSchema, type NewsletterFormData } from "./schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function NewsletterForm() {
  const [success, setSuccess] = useState(false);
  const { register, handleSubmit, formState, reset } = useForm<NewsletterFormData>({
    resolver: zodResolver(newsletterSchema),
  });

  const onSubmit = async (data: NewsletterFormData) => {
    await subscribeNewsletter(data);
    setSuccess(true);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2">
      <Input placeholder="Email" {...register("email")} />
      <Button type="submit" disabled={formState.isSubmitting}>
        Iscriviti
      </Button>
      {success && <p className="text-sm text-green-600">Iscritto!</p>}
    </form>
  );
}
```

5. **Migration** (automatica)

```bash
pnpm db:generate  # Genera migration
pnpm db:push      # Applica al database
```

## Validation Loop (SEMPRE dopo implementazione)

Dopo ogni feature, l'AI deve eseguire:

```bash
pnpm format      # Formattazione
pnpm lint        # ESLint check
pnpm typecheck   # TypeScript check
```

Se ci sono errori, l'AI li legge e corregge automaticamente.

**Prompt template per AI:**

> "Dopo l'implementazione, esegui `pnpm format && pnpm lint && pnpm typecheck`. Se ci sono errori, correggili prima di confermare completamento."

## Pattern comuni

### 1. Aggiungere una pagina protetta

**Prompt:**

> "Crea una pagina protetta in `app/settings/page.tsx`. Usa `auth()` da `@/lib/auth` per verificare sessione. Se non loggato, redirect a `/login`."

**Output:**

```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="container py-12">
      <h1>Settings</h1>
      <p>Logged in as: {session.user.email}</p>
    </div>
  );
}
```

### 2. Aggiungere un endpoint API pubblico

**Prompt:**

> "Crea un endpoint API POST `/api/webhook` che accetta JSON. Valida con Zod schema. Log errori."

**Output** (`src/app/api/webhook/route.ts`):

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  event: z.string(),
  data: z.record(z.unknown()),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, data } = schema.parse(body);

    // Process webhook
    console.log("Webhook received:", event, data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
```

### 3. Aggiungere un componente UI riusabile

**Prompt:**

> "Crea un componente `PageHeader` in `components/common/PageHeader.tsx`. Props: title (string), description (string optional). Usa Tailwind."

**Output:**

```typescript
interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="border-b pb-6 mb-8">
      <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
      {description && (
        <p className="text-muted-foreground mt-2">{description}</p>
      )}
    </div>
  );
}
```

## Come l'AI legge questo template

### 1. Schema Drizzle

L'AI legge i commenti JSDoc in `src/db/schema.ts`:

```typescript
/**
 * Utente del sistema. Gestito da NextAuth.
 * Relazioni: sessions, accounts
 */
export const users = pgTable("user", {
  id: text("id").primaryKey(),

  /** Email (unique, usata per login) */
  email: text("email").notNull().unique(),
});
```

→ L'AI capisce cosa fa ogni table e come usarla.

### 2. JSDoc nei file TypeScript

```typescript
/**
 * Server Action: salva messaggio di contatto.
 * @throws ZodError se validazione fallisce
 */
export async function sendContactMessage(input: unknown) {
  // ...
}
```

→ L'AI sa cosa fa la funzione e come gestire errori.

### 3. README nelle features

Ogni feature ha `README.md` che spiega:

- Cosa fa
- Come estenderla
- Dipendenze

→ L'AI legge il README prima di modificare la feature.

### 4. Esempi in EXAMPLES.md

L'AI usa gli esempi in `docs/EXAMPLES.md` come template per nuovo codice.

## Prompt efficaci per questo template

### ✅ Prompt buoni (specifici)

> "Aggiungi una feature 'comments' seguendo la struttura in `features/contact`. Ogni comment ha: userId (FK), postId (FK), content (text), createdAt. Include moderazione (status: pending/approved/rejected). Usa Drizzle ORM."

> "Crea una pagina `/blog/[slug]` che fetch post da database con Drizzle. Se post non esiste, mostra 404. Usa Server Component."

> "Aggiungi dark mode toggle nella Navbar. Usa `next-themes` e componente `ThemeToggle` in `components/layout/`."

### ❌ Prompt vaghi (evitare)

> "Aggiungi un sistema di commenti" ← troppo vago, l'AI deve indovinare

> "Crea una pagina blog" ← manca struttura, routing, data source

> "Implementa auth" ← auth già presente, specifica cosa serve

## Troubleshooting

### L'AI crea file nella posizione sbagliata

**Soluzione:** Specifica sempre il path completo nel prompt.

```
❌ "Crea ContactForm"
✅ "Crea src/features/contact/ContactForm.tsx"
```

### L'AI usa import relativi

**Soluzione:** Ricordagli di usare alias `@/`.

```
❌ import { Button } from "../../components/ui/button"
✅ import { Button } from "@/components/ui/button"
```

### L'AI non esegue validation loop

**Soluzione:** Aggiungi sempre nel prompt:

> "Dopo l'implementazione, esegui `pnpm format && pnpm lint && pnpm typecheck`."

### TypeScript errors dopo generazione

**Soluzione:** Chiedi all'AI:

> "Leggi gli errori TypeScript e correggili. Poi rilancia `pnpm typecheck`."

## Best Practices per prompt

1. **Riferisci feature esistenti** → "seguendo la struttura in `features/contact`"
2. **Specifica path completi** → `src/features/[name]/[file].tsx`
3. **Chiedi validation loop** → "esegui format, lint, typecheck"
4. **Usa terminologia del template** → "Server Action", "schema Zod", "feature folder"
5. **Chiedi un solo step alla volta** → non "implementa auth + dashboard + blog"

## Estendere il template

### Aggiungere libreria opzionale

**Esempio: Aggiungere Framer Motion**

```bash
pnpm add framer-motion
```

Poi crea wrapper in `components/common/AnimatedDiv.tsx`:

```typescript
"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

export function AnimatedDiv(props: HTMLMotionProps<"div">) {
  return <motion.div {...props} />;
}
```

### Aggiungere provider OAuth

**Prompt:**

> "Aggiungi Discord OAuth in `lib/auth.ts`. Richiede env vars: DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET."

**Output:**

```typescript
// lib/auth.ts
import Discord from "next-auth/providers/discord";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // ... config esistente
  providers: [
    Credentials({ ... }),
    GitHub({ ... }),
    Google({ ... }),
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
});
```

## Template di prompt pronti all'uso

### Feature completa

```
Aggiungi una feature "[nome]" in src/features/[nome]/:
- Drizzle table [tableName] in src/db/schema.ts con campi: [lista campi]
- Schema Zod in schema.ts
- Server Action [actionName] in actions.ts (usa Drizzle per queries)
- Form component [Name]Form.tsx con React Hook Form
- README.md che spiega la feature

Segui la struttura in features/contact come riferimento.
Dopo l'implementazione, esegui pnpm db:generate && pnpm db:push per applicare schema.
Poi esegui pnpm format && pnpm lint && pnpm typecheck.
```

### Pagina protetta

```
Crea una pagina protetta in src/app/[nome]/page.tsx.
Usa auth() da @/lib/auth per verificare sessione.
Se non loggato, redirect a /login.
Mostra [contenuto pagina].
```

### Componente UI

```
Crea un componente [Nome] in src/components/[category]/[Nome].tsx.
Props: [lista props con tipi].
Style: Tailwind, usa variabili theme (bg-background, text-foreground).
```

### API endpoint

```
Crea un endpoint API [METHOD] /api/[path] in src/app/api/[path]/route.ts.
Input: [schema Zod]
Output: [formato JSON]
Error handling: try/catch con log e response appropriato.
```

## Risorse per l'AI

Quando l'AI lavora su questo template, ha accesso a:

1. **Documentazione completa** in `docs/`
2. **Esempi funzionanti** in `docs/EXAMPLES.md`
3. **Recipes step-by-step** in `docs/recipes/`
4. **Schema Drizzle commentato** in `src/db/schema.ts`
5. **Feature di riferimento** in `src/features/contact/` e `src/features/blog/`

L'AI può leggere questi file per comprendere pattern e replicarli accuratamente.
