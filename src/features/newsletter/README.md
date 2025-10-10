# Newsletter Feature

Gestisce iscrizioni/disiscrizioni alla newsletter.

## Componenti

- `schema.ts` - Validazione Zod (email)
- `actions.ts` - Server Actions per subscribe/unsubscribe
- `NewsletterForm.tsx` - Form component (da implementare)

## Database

Subscriber salvato in tabella `newsletter_subscriber`:

- `id` (UUID)
- `email` (string, unique)
- `status` (string: "active" | "unsubscribed")
- `subscribedAt` (timestamp)
- `unsubscribedAt` (timestamp, nullable)

## Features

- ✅ Validazione email
- ✅ Prevenzione duplicati
- ✅ Ri-attivazione se già disiscritto
- ✅ Email di benvenuto (mock by default)
- ✅ Unsubscribe action

## Uso

```tsx
import { subscribeToNewsletter } from "@/features/newsletter/actions";

const result = await subscribeToNewsletter({
  email: "user@example.com",
});

if (result.success) {
  // Successo!
}
```

## Email Configuration

Vedi `src/lib/email.ts` per configurare email reali.

## Posizionamento

Tipicamente nel footer del sito o in popup:

```tsx
<footer>
  <NewsletterForm />
</footer>
```

## Admin Query

```ts
// Tutti i subscribers attivi
const activeSubscribers = await db
  .select()
  .from(newsletterSubscribers)
  .where(eq(newsletterSubscribers.status, "active"));

// Count totale
const [{ count }] = await db
  .select({ count: count() })
  .from(newsletterSubscribers)
  .where(eq(newsletterSubscribers.status, "active"));
```
