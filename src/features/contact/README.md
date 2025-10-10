# Contact Feature

Gestisce il contact form pubblico del sito.

## Componenti

- `schema.ts` - Validazione Zod (name, email, message)
- `actions.ts` - Server Action per salvare messaggio + notifica email
- `ContactForm.tsx` - Form component (da implementare con shadcn/ui)

## Database

Messaggio salvato in tabella `contact_message`:

- `id` (UUID)
- `name` (string)
- `email` (string)
- `message` (text)
- `createdAt` (timestamp)

## Email Notification

Default: **Mock mode** (solo log console)

Per abilitare email reali:

1. Installa Resend: `pnpm add resend`
2. Aggiungi env var: `RESEND_API_KEY=re_xxxxx`
3. Decommentare codice in `src/lib/email.ts`
4. Configurare `ADMIN_EMAIL` in `.env`

Vedi `src/lib/email.ts` per istruzioni dettagliate.

## Uso

```tsx
import { sendContactMessage } from "@/features/contact/actions";

const result = await sendContactMessage({
  name: "Mario Rossi",
  email: "mario@example.com",
  message: "Ciao, vorrei maggiori informazioni...",
});

if (result.success) {
  // Successo!
}
```

## Testing

```bash
# Crea messaggio di test
curl -X POST http://localhost:3000/api/test-contact \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Test","email":"test@example.com","message":"Test message"}'
```

## Admin Panel (TODO)

Per visualizzare i messaggi ricevuti, creare pagina:
`app/admin/contacts/page.tsx`

Query Drizzle:

```ts
const messages = await db
  .select()
  .from(contactMessages)
  .orderBy(desc(contactMessages.createdAt))
  .limit(50);
```
