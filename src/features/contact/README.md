# Contact Feature

Public contact form for user inquiries with admin dashboard for viewing submissions.

## Components

- `ContactForm.tsx` - Client form component with React Hook Form
- (Form component to be implemented)

## Server Actions

- `sendContactMessage(input)` - Saves message to database
- Optional: Send email notification to admin

## Database Schema

```typescript
export const contactMessage = pgTable("contact_message", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Fields:**

- `name` - Sender's name
- `email` - Sender's email for reply
- `message` - Message content
- `createdAt` - Timestamp of submission

## Validation

Schema Zod in `schema.ts`:

```typescript
export const contactSchema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().email("Invalid email"),
  message: z.string().min(10, "Message too short (min 10 characters)"),
});
```

## Routes

### Public Routes

- `/contact` - Contact form page (public, anyone can access)

### Admin Routes (protected)

- `/dashboard/contacts` - View all submissions (editor/admin only)

## Features

### 1. Form Submission

- Zod validation client + server side
- Success/error feedback
- Form reset after submission
- Loading state during submission

### 2. Admin Dashboard

- List all messages ordered by date
- Filterable by date/status (to be implemented)
- Message details view

### 3. Optional Email Notification

When a message is submitted:

- Admin receives notification email (if `ADMIN_EMAIL` configured)
- Auto-reply to user (optional enhancement)

## Usage

### Submitting a Message

```tsx
import { sendContactMessage } from "@/features/contact/actions";

const result = await sendContactMessage({
  name: "John Doe",
  email: "john@example.com",
  message: "I have a question about...",
});

if (result.success) {
  // Show success message
}
```

### Viewing Messages (Admin)

```tsx
// Server Component - fetch messages
import { db } from "@/db";
import { contactMessage } from "@/db/schema";
import { desc } from "drizzle-orm";

export default async function ContactsPage() {
  const messages = await db
    .select()
    .from(contactMessage)
    .orderBy(desc(contactMessage.createdAt))
    .limit(50);

  return <div>{/* Render messages */}</div>;
}
```

## Extending

### 1. Add Status Field

Track message status (new/read/replied):

```typescript
export const contactMessage = pgTable("contact_message", {
  // ... existing fields
  status: text("status").notNull().default("new"), // new, read, replied
  repliedAt: timestamp("replied_at"),
});
```

### 2. Add Reply Functionality

```typescript
export async function replyToMessage(messageId: string, reply: string) {
  // Send email with reply
  // Update status to "replied"
  // Store reply in database
}
```

### 3. Add Email Notifications

Enable admin email notifications:

```typescript
// In sendContactMessage action
await sendEmail({
  to: process.env.ADMIN_EMAIL!,
  subject: `New contact from ${name}`,
  react: <ContactNotificationTemplate {...message} />,
});
```

### 4. Add Spam Protection

- Add reCAPTCHA or hCaptcha
- Rate limit submissions per IP
- Honeypot field for bot detection

```typescript
// Example: Rate limiting
const recentSubmissions = await db
  .select()
  .from(contactMessage)
  .where(eq(contactMessage.email, email))
  .where(gte(contactMessage.createdAt, fiveMinutesAgo));

if (recentSubmissions.length >= 3) {
  throw new Error("Too many submissions. Please try again later.");
}
```

## Security

- ✅ Server-side validation with Zod
- ✅ SQL injection protection (Drizzle ORM)
- ✅ XSS protection (React escaping)
- ✅ CSRF protection (Next.js built-in)
- ⚠️ No rate limiting (add for production)
- ⚠️ No spam protection (add reCAPTCHA for production)

**Production recommendations:**

- Add rate limiting (per IP or per email)
- Implement CAPTCHA for bot protection
- Sanitize message content if displaying HTML
- Monitor for abuse patterns

## Performance

- Server Component for message list (no client state)
- Pagination for large datasets (implement when > 100 messages)
- Database index on `createdAt` for fast sorting

```sql
CREATE INDEX idx_contact_message_created_at
ON contact_message(created_at DESC);
```

## TODO (optional enhancements)

- [ ] Add status field (new/read/replied)
- [ ] Implement reply functionality
- [ ] Add email notifications to admin
- [ ] Add auto-reply to user
- [ ] Pagination for message list
- [ ] Filter messages by date range
- [ ] Search messages by name/email
- [ ] Export messages to CSV
- [ ] Add spam protection (reCAPTCHA)
- [ ] Rate limiting per IP/email
- [ ] Message categories/tags

## Email Configuration

By default, no emails are sent (messages are just saved to database).

To enable admin notifications:

```bash
# .env
ADMIN_EMAIL="admin@yourdomain.com"
EMAIL_PROVIDER="resend"
RESEND_API_KEY="re_xxxxx"
```

Then update `sendContactMessage` action to send email.

## See Also

- [`docs/EMAIL_SYSTEM.md`](../../../docs/EMAIL_SYSTEM.md) - Email configuration
- [`docs/RBAC.md`](../../../docs/RBAC.md) - Access control for admin dashboard
