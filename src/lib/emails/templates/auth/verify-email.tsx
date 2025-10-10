/**
 * Email Verification Template
 *
 * Sent when user registers to verify their email address.
 */

import { EmailLayout } from "../base/layout";
import { Heading, Paragraph, Button, Alert, Small } from "../base/components";

interface VerifyEmailProps {
  name: string;
  verificationUrl: string;
}

export function VerifyEmailTemplate({ name, verificationUrl }: VerifyEmailProps) {
  return (
    <EmailLayout preview="Verify your email address">
      <Heading>Welcome, {name}!</Heading>
      <Paragraph>
        Thanks for signing up for Templator. To complete your registration and unlock all features,
        please verify your email address.
      </Paragraph>
      <Button href={verificationUrl}>Verify Email Address</Button>
      <Paragraph>
        Or copy and paste this link into your browser:
        <br />
        <a href={verificationUrl} style={{ color: "#0066cc", wordBreak: "break-all" as const }}>
          {verificationUrl}
        </a>
      </Paragraph>
      <Alert>
        <strong>Important:</strong> This verification link will expire in 24 hours for security
        reasons.
      </Alert>
      <Small>If you didn't create an account, you can safely ignore this email.</Small>
    </EmailLayout>
  );
}
