# Email System Documentation

## Overview

Templator includes a complete, production-ready email system powered by **Better Auth** with:

- ✅ Email verification for new accounts (auto-enabled with Resend)
- ✅ Password reset functionality (built-in)
- ✅ Mock mode for development (zero configuration)
- ✅ Resend integration for production
- ✅ React Email templates (type-safe, maintainable)
- ✅ Edge-compatible (Cloudflare Workers ready)

**Integration:** Email flows are handled by Better Auth with custom email sending via Resend.

---

## Quick Start

### Development (Mock Mode)

No configuration needed! Emails are logged to console:

```bash
pnpm dev
# Register a user - check console for "verification email"
```

### Production (Resend)

1. Get API key from [resend.com](https://resend.com)
2. Add to `.env`:
   ```bash
   EMAIL_PROVIDER="resend"
   RESEND_API_KEY="re_xxxxx"
   EMAIL_FROM="noreply@yourdomain.com"
   ```
3. Deploy - emails are sent automatically

**Note:** Setting `EMAIL_PROVIDER="resend"` automatically enables email verification in Better Auth (see `src/lib/auth.ts`).

---

## Features Implemented

### 1. Email Verification

**Flow:**

1. User registers → Better Auth sends email with verification link (if EMAIL_PROVIDER="resend")
2. User clicks link → Email verified by Better Auth
3. Account activated

**Files:**

- Config: `src/lib/auth.ts` (Better Auth `emailAndPassword.sendVerificationEmail`)
- Email sender: `src/lib/emails/auth-emails.ts` (`sendVerificationEmail()`)
- Template: `src/lib/emails/templates/auth/verify-email.tsx`
- Page: `src/app/verify-email/page.tsx`

**Auto-enabled:** Email verification is automatically enabled when `EMAIL_PROVIDER="resend"` (configured in `src/lib/auth.ts`).

**Test:**

```bash
# Register new user
# Check console logs for verification link
# Click link to verify
```

---

### 2. Password Reset

**Flow:**

1. User requests reset → Better Auth sends email with reset link (1 hour expiry)
2. User clicks link → New password form
3. Password updated via Better Auth

**Files:**

- Config: `src/lib/auth.ts` (Better Auth `emailAndPassword.sendResetPassword`)
- Email sender: `src/lib/emails/auth-emails.ts` (`sendPasswordResetEmail()`)
- Template: `src/lib/emails/templates/auth/password-reset.tsx`
- Pages:
  - `src/app/forgot-password/page.tsx` (request reset form)
  - `src/app/reset-password/page.tsx` (reset form with token in URL)

**Built-in:** Password reset is always available, regardless of EMAIL_PROVIDER (but emails only sent when not in mock mode).

**Test:**

```bash
# Go to /login → "Forgot password?"
# Enter email
# Check console for reset link
# Follow link to reset password
```

---

## Architecture

### Directory Structure

```
src/lib/emails/
├── auth-emails.ts               # Better Auth email senders
└── templates/
    ├── base/
    │   ├── layout.tsx           # Shared email layout
    │   └── components.tsx       # Reusable components
    ├── auth/
    │   ├── verify-email.tsx     # Email verification template
    │   └── password-reset.tsx   # Password reset template
    ├── users/                   # Ready for role notifications
    ├── blog/                    # Ready for post notifications
    ├── newsletter/              # Ready for newsletter
    ├── contact/                 # Ready for contact auto-reply
    ├── profile/                 # Ready for email change
    └── system/                  # Ready for system emails
```

**Better Auth Integration:**

- `auth-emails.ts` contains `sendVerificationEmail()` and `sendPasswordResetEmail()`
- These are called by Better Auth hooks (configured in `src/lib/auth.ts`)
- Templates use Resend's `@react-email/components` for rendering

### Better Auth Email Senders

Auth emails are sent through Better Auth hooks:

```typescript
// src/lib/auth.ts
emailAndPassword: {
  sendVerificationEmail: async ({ user, url }) => {
    await sendVerificationEmail({ user, url });
  },
  sendResetPassword: async ({ user, url }) => {
    await sendPasswordResetEmail({ user, url });
  },
}
```

**Automatic behavior:**

- Mock mode (`EMAIL_PROVIDER="mock"`) → Logs to console
- Production (`EMAIL_PROVIDER="resend"`) → Sends via Resend
- Email verification auto-enabled with Resend
- Type-safe React templates
- Error handling included

### Custom Email Sending

For non-auth emails (newsletter, notifications, etc.), use Resend directly:

```typescript
import { Resend } from 'resend';
import { MyEmailTemplate } from '@/lib/emails/templates/my-email';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: process.env.EMAIL_FROM!,
  to: user.email,
  subject: 'Your subject',
  react: <MyEmailTemplate {...props} />,
});
```

---

## Configuration

### Environment Variables

```bash
# Email Provider (controls Better Auth email verification)
EMAIL_PROVIDER="mock"                    # "mock" (dev) or "resend" (production)

# Resend Configuration (required if EMAIL_PROVIDER="resend")
RESEND_API_KEY="re_xxxxx"               # Get from resend.com
EMAIL_FROM="noreply@yourdomain.com"     # Sender address (must match verified domain)

# Optional
EMAIL_REPLY_TO="support@yourdomain.com" # Reply-to address
ADMIN_EMAIL="admin@yourdomain.com"      # For admin notifications
```

**Important:** When `EMAIL_PROVIDER="resend"`:

- Email verification is automatically enabled in Better Auth
- `RESEND_API_KEY` and `EMAIL_FROM` must be set
- `EMAIL_FROM` must be from a verified domain in Resend

### Provider Switching

**Development:**

```bash
EMAIL_PROVIDER="mock"
# or omit RESEND_API_KEY
```

**Production:**

```bash
EMAIL_PROVIDER="resend"
RESEND_API_KEY="re_xxxxx"
```

---

## Creating New Email Templates

### 1. Create Template

```tsx
// src/lib/emails/templates/users/role-changed.tsx
import { EmailLayout } from "../base/layout";
import { Heading, Paragraph, Code } from "../base/components";

interface RoleChangedProps {
  name: string;
  oldRole: string;
  newRole: string;
}

export function RoleChangedTemplate({ name, oldRole, newRole }: RoleChangedProps) {
  return (
    <EmailLayout preview="Your role has been updated">
      <Heading>Role Updated</Heading>
      <Paragraph>Hi {name},</Paragraph>
      <Paragraph>
        Your role has been changed from <Code>{oldRole}</Code> to <Code>{newRole}</Code>.
      </Paragraph>
    </EmailLayout>
  );
}
```

### 2. Send Email

```typescript
// src/features/users/actions.ts
import { Resend } from 'resend';
import { RoleChangedTemplate } from '@/lib/emails/templates/users/role-changed';

export async function updateUserRole(userId: string, newRole: string) {
  // ... update logic ...

  // Send email via Resend
  if (process.env.EMAIL_PROVIDER === "resend") {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: user.email,
      subject: 'Your role has been updated',
      react: <RoleChangedTemplate
        name={user.name}
        oldRole={user.role}
        newRole={newRole}
      />,
    });
  } else {
    // Mock mode - log to console
    console.log(`📧 [MOCK EMAIL] Role changed: ${user.email}`);
  }
}
```

---

## Available Components

### Layout

```tsx
<EmailLayout preview="Preview text">{/* Your content */}</EmailLayout>
```

### Components

```tsx
<Heading>Main Title</Heading>
<Paragraph>Regular text content</Paragraph>
<Button href="https://...">Click Here</Button>
<Code>code-or-token</Code>
<Alert>Important notice</Alert>
<Divider />
<Small>Secondary information</Small>
```

---

## Security Features

### Email Verification (Better Auth)

- ✅ Managed by Better Auth `verification` table
- ✅ Tokens expire based on Better Auth configuration
- ✅ One-time use (deleted after verification)
- ✅ Cryptographically secure tokens
- ✅ Auto-enabled when `EMAIL_PROVIDER="resend"`

### Password Reset (Better Auth)

- ✅ Tokens expire in 1 hour (Better Auth default)
- ✅ One-time use (deleted after reset)
- ✅ Doesn't reveal if email exists (security best practice)
- ✅ Old password immediately invalidated
- ✅ Uses custom PBKDF2 hashing (Cloudflare Workers compatible)

### General

- ✅ All tokens stored in `verification` table (Better Auth)
- ✅ Automatic cleanup of expired tokens
- ✅ HTTPS-only links in production
- ✅ Rate limiting built-in (Better Auth database-backed)

---

## Troubleshooting

### Emails not sending in production

**Check:**

1. `RESEND_API_KEY` is set correctly
2. `EMAIL_FROM` matches verified domain in Resend
3. Check Resend dashboard for delivery status
4. Check server logs for errors

**Common issues:**

- Domain not verified in Resend
- API key incorrect
- FROM address doesn't match verified domain

### Verification links not working

**Check:**

1. `BETTER_AUTH_URL` is set correctly (not `NEXTAUTH_URL`)
2. Token hasn't expired (configurable in Better Auth, default 1h for reset)
3. Token hasn't been used already (deleted after use)
4. Check database `verification` table (Better Auth table)
5. Ensure `EMAIL_PROVIDER="resend"` if expecting real emails

---

## Production Checklist

### Before Launch

- [ ] Get Resend API key
- [ ] Verify domain in Resend
- [ ] Set `RESEND_API_KEY` in environment
- [ ] Set `EMAIL_FROM` to verified domain
- [ ] Set `EMAIL_PROVIDER=resend`
- [ ] Test email verification flow
- [ ] Test password reset flow
- [ ] Check spam folder (adjust SPF/DKIM if needed)
- [ ] Monitor Resend dashboard for deliverability

### Domain Verification (Resend)

1. Add domain in Resend dashboard
2. Add DNS records (SPF, DKIM, DMARC)
3. Wait for verification (usually 5-10 min)
4. Test sending from verified domain

---

## Costs

### Resend Pricing

- **Free tier:** 100 emails/day, 3,000/month
- **Pro plan:** $20/month for 50,000 emails
- **Growth plan:** $80/month for 500,000 emails

**Estimated for typical SaaS:**

- 100 users/month × 2 emails (verification + welcome) = 200 emails
- 20 password resets/month = 40 emails
- **Total: ~250 emails/month = FREE**

---

## Future Enhancements

### Ready to Implement

Templates are organized and ready for:

1. **Newsletter**: Bulk sending, double opt-in
2. **Contact**: Auto-reply to submissions
3. **Blog**: Notify author when post published
4. **Users**: Notify on role changes
5. **Profile**: Verify email changes
6. **System**: Onboarding, re-engagement, reports

### Recommended Libraries

```bash
# Background jobs (Cloudflare Queues)
pnpm add @cloudflare/workers-types

# Email list management
# Use Resend's audiences feature

# Advanced templates
# Use @react-email/components (already installed)
```

---

## Examples

### Test in Development

```bash
# Start dev server
pnpm dev

# Register a user via UI at /register
# Or use Better Auth API directly:
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123"}'

# Check terminal logs for:
📧 [MOCK EMAIL] Verification email would be sent to: test@example.com
  Link: http://localhost:3000/verify-email?token=...
```

**Note:** In mock mode (`EMAIL_PROVIDER="mock"`), emails are logged to console with verification links you can click.

### Preview Templates Locally

Create `src/emails-preview.tsx`:

```tsx
import { VerifyEmailTemplate } from "./lib/emails/templates/auth/verify-email";

export default function EmailPreview() {
  return (
    <div>
      <h1>Email Templates Preview</h1>
      <VerifyEmailTemplate name="John Doe" verificationUrl="https://example.com/verify/token123" />
    </div>
  );
}
```

---

## Support

**Questions?**

- Check [Resend docs](https://resend.com/docs)
- Check [React Email docs](https://react.email/docs)
- Review code examples in `src/lib/emails/`

**Common patterns:**

- All templates in `templates/` folder
- All actions in feature `actions.ts`
- Use `sendEmail()` function for all sends
- Mock mode for development, Resend for production
