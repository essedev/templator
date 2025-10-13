# Environment Variables Setup

Sistema semplificato per la gestione delle variabili d'ambiente.

## 📁 File Structure

```
├── .env.local          ← Sviluppo locale (gitignored)
├── .env.example        ← Template per .env.local
└── wrangler.jsonc      ← Config Cloudflare + variabili produzione (committed)
```

---

## 🏠 Sviluppo Locale

**File:** `.env.local` (gitignored)

1. Copia il template:

   ```bash
   cp .env.example .env.local
   ```

2. Compila i valori:
   - `DATABASE_URL` - Il tuo database Neon
   - `BETTER_AUTH_SECRET` - Genera con: `openssl rand -base64 32`
   - Altri valori sono già impostati per localhost

3. Avvia il server:
   ```bash
   npm run dev
   ```

**Nota:** `.env.local` contiene secrets e NON deve essere committato.

---

## 🚀 Produzione (Cloudflare)

### Config Pubblica: `wrangler.jsonc`

Variabili **pubbliche** (URL, email, ecc.) sono in `wrangler.jsonc`:

```jsonc
{
  "vars": {
    "BETTER_AUTH_URL": "https://templator.essedev.it",
    "NEXT_PUBLIC_APP_URL": "https://templator.essedev.it",
    "EMAIL_PROVIDER": "mock",
    "EMAIL_FROM": "noreply@templator.gen-8ae.workers.dev",
    // ...
  },
}
```

✅ Questo file **è committato** perché contiene solo config pubblica.

### Secrets: Wrangler CLI (una tantum)

Secrets **sensibili** (DATABASE_URL, API keys) vanno configurati via CLI:

```bash
# Database
echo "postgresql://..." | wrangler secret put DATABASE_URL

# Auth secret
echo "..." | wrangler secret put BETTER_AUTH_SECRET

# Resend (se usi email in produzione)
echo "re_xxxxx" | wrangler secret put RESEND_API_KEY
```

**Nota:** I secrets vanno configurati **una sola volta**. Sono salvati in modo sicuro su Cloudflare.

---

## 📦 Deploy

**Un solo comando:**

```bash
npm run deploy
```

**Cosa fa lo script:**

1. ✅ Legge le variabili da `wrangler.jsonc`
2. ✅ Le usa durante il build (per `NEXT_PUBLIC_*`)
3. ✅ Builda l'app con OpenNext
4. ✅ Deploya su Cloudflare

Nessuna confusione, nessun file duplicato!

---

## 🎯 Come Funziona

### Problema: NEXT*PUBLIC*\* variables

Le variabili `NEXT_PUBLIC_*` vengono **embedded nel JavaScript** durante il build (che gira localmente).

### Soluzione: Script Intelligente

Lo script `scripts/deploy.mjs`:

- Legge `wrangler.jsonc` → `NEXT_PUBLIC_APP_URL`
- Setta la variabile per il processo di build
- Builda → Next.js embedded il valore corretto
- Deploya → Cloudflare usa le vars da `wrangler.jsonc` a runtime

---

## 📝 Riepilogo

| Cosa                     | Dove             | Committato | Quando           |
| ------------------------ | ---------------- | ---------- | ---------------- |
| **Secrets locali**       | `.env.local`     | ❌ No      | `npm run dev`    |
| **Config pubblica prod** | `wrangler.jsonc` | ✅ Sì      | `npm run deploy` |
| **Secrets prod**         | Wrangler CLI     | ❌ No      | Una tantum       |

**Semplice, no?** 🎉
