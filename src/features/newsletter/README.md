# Newsletter Feature

Email newsletter subscription management with double opt-in verification.

## Components

- `NewsletterForm.tsx` - Client form component (typically in footer/sidebar)
- (Form component to be implemented)

## Server Actions

- `subscribeNewsletter(input)` - Creates subscription with pending status
- `confirmSubscription(token)` - Activates subscription after email verification
- `unsubscribe(token)` - Unsubscribes user

## Database Schema

```typescript
// Newsletter status enum
export const newsletterStatusEnum = pgEnum("newsletter_status", [
  "pending",
  "active",
  "unsubscribed",
]);

// Subscriber table
export const newsletterSubscriber = pgTable("newsletter_subscriber", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  status: newsletterStatusEnum("status").notNull().default("pending"),
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
  confirmedAt: timestamp("confirmed_at"),
  unsubscribedAt: timestamp("unsubscribed_at"),
});

// Verification tokens
export const newsletterVerification = pgTable("newsletter_verification", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Status Flow:**

- `pending` → User subscribed, awaiting email confirmation
- `active` → Email confirmed, receives newsletters
- `unsubscribed` → User unsubscribed (keep for compliance)

## Validation

Schema Zod in `schema.ts`:

```typescript
export const newsletterSchema = z.object({
  email: z.string().email("Invalid email address"),
});
```

## Routes

### Public Routes

- Newsletter form in footer/sidebar (no dedicated page)
- `/newsletter/confirm?token=xxx` - Confirmation page
- `/newsletter/unsubscribe?token=xxx` - Unsubscribe page

### Admin Routes (protected)

- `/dashboard/newsletter` - View all subscribers (editor/admin only)

## Features

### 1. Double Opt-In Subscription

**Flow:**

1. User enters email in form
2. Status set to `pending`, verification email sent
3. User clicks confirmation link in email
4. Status updated to `active`, `confirmedAt` set
5. User now receives newsletters

**Why double opt-in?**

- Prevents fake/typo emails
- CAN-SPAM compliance
- Better deliverability (engaged subscribers)

### 2. Duplicate Prevention

- Email field is unique in database
- Re-subscribing updates status to `active` if previously unsubscribed

### 3. Unsubscribe

- One-click unsubscribe link in every newsletter
- Status updated to `unsubscribed`, `unsubscribedAt` set
- Record kept for compliance (don't delete)

## Usage

### Subscribe

```tsx
import { subscribeNewsletter } from "@/features/newsletter/actions";

const result = await subscribeNewsletter({
  email: "user@example.com",
});

// Status: pending, verification email sent
```

### Admin Query

```tsx
// Get all active subscribers
import { db } from "@/db";
import { newsletterSubscriber } from "@/db/schema";
import { eq } from "drizzle-orm";

const activeSubscribers = await db
  .select()
  .from(newsletterSubscriber)
  .where(eq(newsletterSubscriber.status, "active"));

// Count active subscribers
const [{ count }] = await db
  .select({ count: count() })
  .from(newsletterSubscriber)
  .where(eq(newsletterSubscriber.status, "active"));
```

## Extending

### 1. Add Subscriber Preferences

```typescript
export const newsletterSubscriber = pgTable("newsletter_subscriber", {
  // ... existing fields
  frequency: text("frequency").default("weekly"), // daily, weekly, monthly
  topics: text("topics").array(), // ["tech", "business", "lifestyle"]
});
```

### 2. Add Segmentation

```typescript
// Tags for targeting specific groups
export const subscriberTags = pgTable("subscriber_tag", {
  subscriberId: text("subscriber_id").references(() => newsletterSubscriber.id),
  tag: text("tag").notNull(), // "new", "engaged", "vip"
});
```

### 3. Integrate with Email Service Provider

Options:

- **Resend Audiences** - Built-in audience management
- **ConvertKit** - Full-featured email marketing
- **Mailchimp** - Popular choice with automation

```typescript
// Sync to ESP when subscription confirmed
import { Resend } from "resend";

await resend.contacts.create({
  email: subscriber.email,
  audienceId: process.env.RESEND_AUDIENCE_ID!,
});
```

### 4. Add Welcome Email

```typescript
// In confirmSubscription action
await sendEmail({
  to: email,
  subject: "Welcome to our newsletter!",
  react: <WelcomeEmailTemplate />,
});
```

## Security

- ✅ Email validation (client + server)
- ✅ Double opt-in (prevents spam subscriptions)
- ✅ Cryptographically secure tokens
- ✅ Time-limited verification tokens (24h recommended)
- ✅ SQL injection protection (Drizzle ORM)
- ✅ Unique email constraint (prevents duplicates)

**CAN-SPAM Compliance:**

- ✅ Explicit opt-in required
- ✅ Easy unsubscribe in every email
- ✅ Physical address in emails (add to template)
- ✅ Don't delete unsubscribed records (keep for audit)

## Performance

- Unique index on `email` for fast lookups
- Index on `status` for filtering active subscribers
- Batch inserts for bulk imports (if needed)

```sql
CREATE INDEX idx_newsletter_status ON newsletter_subscriber(status);
CREATE INDEX idx_newsletter_email ON newsletter_subscriber(email);
```

## TODO (optional enhancements)

- [ ] Add subscriber preferences (frequency, topics)
- [ ] Implement segmentation/tags
- [ ] Sync with email service provider (Resend/ConvertKit)
- [ ] Send welcome email on confirmation
- [ ] Admin bulk import from CSV
- [ ] Export subscribers to CSV
- [ ] Analytics (open rate, click rate)
- [ ] A/B testing for subject lines
- [ ] Automated campaigns
- [ ] Cleanup expired pending subscriptions (>30 days)

## Email Templates

Create newsletter templates in `src/lib/emails/templates/newsletter/`:

```tsx
// verification-email.tsx
export function VerificationEmailTemplate({ email, verificationUrl }) {
  return (
    <EmailLayout>
      <Heading>Confirm your subscription</Heading>
      <Paragraph>Click below to start receiving our newsletter:</Paragraph>
      <Button href={verificationUrl}>Confirm Subscription</Button>
      <Small>If you didn't subscribe, you can ignore this email.</Small>
    </EmailLayout>
  );
}
```

## Sending Newsletters

```typescript
// Send to all active subscribers
const subscribers = await db
  .select()
  .from(newsletterSubscriber)
  .where(eq(newsletterSubscriber.status, "active"));

for (const subscriber of subscribers) {
  await sendEmail({
    to: subscriber.email,
    subject: "Your Weekly Newsletter",
    react: <NewsletterTemplate unsubscribeUrl={`.../${subscriber.id}`} />,
  });
}
```

**Production tip:** Use batch sending or email service provider API for large lists (>1000 subscribers).

## Cleanup Pending Subscriptions

Remove unconfirmed subscriptions after 30 days:

```typescript
// Cron job or scheduled task
export async function cleanupPendingSubscriptions() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  await db
    .delete(newsletterSubscriber)
    .where(
      and(
        eq(newsletterSubscriber.status, "pending"),
        lt(newsletterSubscriber.subscribedAt, thirtyDaysAgo)
      )
    );
}
```

## See Also

- [`docs/EMAIL_SYSTEM.md`](../../../docs/EMAIL_SYSTEM.md) - Email configuration
- [`docs/RBAC.md`](../../../docs/RBAC.md) - Access control for admin dashboard
