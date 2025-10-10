# Recipes — Template step-by-step

Questa cartella contiene template pratici per operazioni comuni.
Ogni recipe è una guida completa e copiabile.

## Recipes disponibili

### 🚀 [add-new-feature.md](add-new-feature.md)

**Pattern completo per aggiungere una feature.**

Esempio: Sistema commenti con moderazione

- Schema Drizzle
- Zod validation
- Server Actions
- Form component
- List component

**Quando usare:** Aggiungi qualsiasi feature CRUD (newsletter, wishlist, reviews, ecc.)

---

### 🔒 [add-protected-page.md](add-protected-page.md)

**Crea pagine che richiedono autenticazione.**

Pattern trattati:

- Auth check inline
- Layout condiviso per area privata
- Middleware (opzionale)
- Role-based access (admin, user)
- Helper functions per DRY

**Quando usare:** Dashboard, settings, profilo, area admin

---

### 🌐 [add-api-endpoint.md](add-api-endpoint.md)

**Crea route handlers (API REST).**

Pattern trattati:

- GET pubblico (con pagination)
- POST protetto (con auth)
- Dynamic routes (by ID)
- Webhook endpoint
- File upload
- CORS
- Error handling
- Rate limiting

**Quando usare:** API per mobile app, webhook, integrazione esterna, file upload

---

## Come usare le recipes

### 1. Leggi la recipe

Comprendi il pattern e le best practices.

### 2. Adatta al tuo use case

Le recipes sono template generici, personalizzali per il tuo progetto.

### 3. Copia e modifica

Non riscrivere da zero, copia gli esempi e adatta nomi/logica.

### 4. Segui il validation loop

Dopo implementazione:

```bash
pnpm format && pnpm lint && pnpm typecheck
```

## Prompt AI per usare recipes

**Esempio 1:** Feature wishlist

> "Implementa una feature wishlist seguendo la recipe in `docs/recipes/add-new-feature.md`. Un wishlist item ha: userId (FK), productId (FK), addedAt. Include form per aggiungere/rimuovere item."

**Esempio 2:** Pagina profilo

> "Crea una pagina protetta `/profile` seguendo `docs/recipes/add-protected-page.md`. Mostra dati utente (name, email, joinedAt). Permetti modifica nome con form + Server Action."

**Esempio 3:** Webhook Stripe

> "Aggiungi endpoint webhook Stripe seguendo `docs/recipes/add-api-endpoint.md` (pattern 4). Gestisci eventi: payment_intent.succeeded, subscription.created. Verifica signature."

## Aggiungere nuove recipes

Se implementi pattern ricorrenti, crea una recipe:

1. Crea file `docs/recipes/[nome].md`
2. Usa struttura simile alle recipe esistenti:
   - Intro + use case
   - Step-by-step con codice completo
   - Best practices
   - Validation
3. Aggiungi link in questo README
4. Commit e condividi!

## Differenza tra Recipes ed Examples

**EXAMPLES.md** → Codice funzionante specifico (ContactForm, auth setup)
**Recipes/** → Template generici step-by-step per pattern comuni

Le recipes usano gli examples come riferimento, ma sono più strutturate e complete.
