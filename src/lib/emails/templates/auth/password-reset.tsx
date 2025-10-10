/**
 * Password Reset Request Template
 *
 * Sent when user requests to reset their password.
 */

import { EmailLayout } from "../base/layout";
import { Heading, Paragraph, Button, Alert, Small } from "../base/components";

interface PasswordResetProps {
  name: string;
  resetUrl: string;
}

export function PasswordResetTemplate({ name, resetUrl }: PasswordResetProps) {
  return (
    <EmailLayout preview="Reset your password">
      <Heading>Password Reset Request</Heading>
      <Paragraph>Hi {name},</Paragraph>
      <Paragraph>
        We received a request to reset the password for your Templator account. Click the button
        below to choose a new password.
      </Paragraph>
      <Button href={resetUrl}>Reset Password</Button>
      <Paragraph>
        Or copy and paste this link into your browser:
        <br />
        <a href={resetUrl} style={{ color: "#0066cc", wordBreak: "break-all" as const }}>
          {resetUrl}
        </a>
      </Paragraph>
      <Alert>
        <strong>Security notice:</strong> This link expires in 1 hour. If you didn't request this
        password reset, you can safely ignore this email. Your password will remain unchanged.
      </Alert>
      <Small>
        For security reasons, we cannot tell you your current password. You can only reset it.
      </Small>
    </EmailLayout>
  );
}
