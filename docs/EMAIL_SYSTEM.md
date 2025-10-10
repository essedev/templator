# Email System Documentation

## Overview

Templator includes a complete, production-ready email system with:

- ✅ Email verification for new accounts
- ✅ Password reset functionality
- ✅ Mock mode for development (zero configuration)
- ✅ Resend integration for production
- ✅ React Email templates (type-safe, maintainable)
- ✅ Edge-compatible (Cloudflare Workers ready)

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
   RESEND_API_KEY="re_xxxxx"
   EMAIL_FROM="noreply@yourdomain.com"
   EMAIL_PROVIDER="resend"
   ```
3. Deploy - emails are sent automatically

---

## Features Implemented

### 1. Email Verification

**Flow:**

1. User registers → Email sent with verification link
2. User clicks link → Email verified
3. Account activated

**Files:**

- Template: `src/lib/emails/templates/auth/verify-email.tsx`
- Actions: `src/features/auth/email-actions.ts` (`sendVerificationEmail`, `verifyEmailToken`)
- Page: `src/app/verify-email/[token]/page.tsx`

**Test:**

```bash
# Register new user
# Check console logs for verification link
# Click link to verify
```

---

### 2. Password Reset

**Flow:**

1. User requests reset → Email sent with reset link (1 hour expiry)
2. User clicks link → New password form
3. Password updated → Confirmation email sent

**Files:**

- Templates:
  - `src/lib/emails/templates/auth/password-reset.tsx`
  - `src/lib/emails/templates/auth/password-changed.tsx`
- Actions: `src/features/auth/email-actions.ts` (`requestPasswordReset`, `resetPassword`)
- Pages:
  - `src/app/forgot-password/page.tsx`
  - `src/app/reset-password/[token]/page.tsx`

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
├── config.ts                    # Email provider configuration
├── send.ts                      # Unified send function
└── templates/
    ├── base/
    │   ├── layout.tsx           # Shared email layout
    │   └── components.tsx       # Reusable components
    ├── auth/
    │   ├── verify-email.tsx
    │   ├── password-reset.tsx
    │   └── password-changed.tsx
    ├── users/                   # Ready for role notifications
    ├── blog/                    # Ready for post notifications
    ├── newsletter/              # Ready for newsletter
    ├── contact/                 # Ready for contact auto-reply
    ├── profile/                 # Ready for email change
    └── system/                  # Ready for system emails
```

### Send Function

All emails go through `sendEmail()` for consistency:

```typescript
import { sendEmail } from '@/lib/emails/send';
import { VerifyEmailTemplate } from '@/lib/emails/templates/auth/verify-email';

await sendEmail({
  to: 'user@example.com',
  subject: 'Verify your email',
  react: <VerifyEmailTemplate name="John" verificationUrl="https://..." />,
});
```

**Automatic behavior:**

- Mock mode → Logs to console
- Production → Sends via Resend
- Type-safe React templates
- Error handling included

---

## Configuration

### Environment Variables

```bash
# Required
EMAIL_PROVIDER="mock"                    # or "resend" for production

# Resend (production only)
RESEND_API_KEY="re_xxxxx"               # Get from resend.com

# Email addresses
EMAIL_FROM="noreply@yourdomain.com"     # Sender address
EMAIL_REPLY_TO="support@yourdomain.com" # Optional reply-to
ADMIN_EMAIL="admin@yourdomain.com"      # Admin notifications
```

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
import { sendEmail } from '@/lib/emails/send';
import { RoleChangedTemplate } from '@/lib/emails/templates/users/role-changed';

export async function updateUserRole(userId: string, newRole: string) {
  // ... update logic ...

  await sendEmail({
    to: user.email,
    subject: 'Your role has been updated',
    react: <RoleChangedTemplate
      name={user.name}
      oldRole={user.role}
      newRole={newRole}
    />,
  });
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

### Email Verification

- ✅ Tokens expire in 24 hours
- ✅ One-time use (deleted after verification)
- ✅ UUID v4 tokens (cryptographically secure)

### Password Reset

- ✅ Tokens expire in 1 hour
- ✅ One-time use
- ✅ Doesn't reveal if email exists
- ✅ Confirmation email sent after reset
- ✅ Old password immediately invalidated

### General

- ✅ All tokens stored in database
- ✅ Automatic cleanup of expired tokens
- ✅ HTTPS-only links in production
- ✅ Rate limiting ready (add middleware if needed)

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

1. `NEXTAUTH_URL` is set correctly
2. Token hasn't expired (24h for verification, 1h for reset)
3. Token hasn't been used already
4. Check database `verificationTokens` table

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
# Terminal 1
pnpm dev

# Terminal 2 - Register user
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123"}'

# Check Terminal 1 logs for:
📧 [MOCK EMAIL SENT]
  To: test@example.com
  Subject: Verify your email address
  ...
```

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
