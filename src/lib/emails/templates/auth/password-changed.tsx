/**
 * Password Changed Confirmation Template
 *
 * Sent after user successfully changes their password.
 */

import { EmailLayout } from "../base/layout";
import { Heading, Paragraph, Alert, Small } from "../base/components";

interface PasswordChangedProps {
  name: string;
  changedAt: Date;
}

export function PasswordChangedTemplate({ name, changedAt }: PasswordChangedProps) {
  const formattedDate = changedAt.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <EmailLayout preview="Your password was changed">
      <Heading>Password Changed Successfully</Heading>
      <Paragraph>Hi {name},</Paragraph>
      <Paragraph>
        Your password was successfully changed on {formattedDate}. If you made this change, no
        further action is needed.
      </Paragraph>
      <Alert>
        <strong>Didn't make this change?</strong> If you didn't change your password, please contact
        support immediately. Your account may be compromised.
      </Alert>
      <Small>
        For security, we recommend using a strong, unique password for your Templator account.
      </Small>
    </EmailLayout>
  );
}
