/**
 * Newsletter subscription confirmation email
 * Sent when user clicks "Subscribe" to confirm double opt-in
 */

import { EmailLayout } from "../base/layout";
import { Heading, Paragraph, Button, Small } from "../base/components";

export interface SubscribeConfirmProps {
  email: string;
  confirmUrl: string;
}

export function SubscribeConfirmTemplate({ email, confirmUrl }: SubscribeConfirmProps) {
  return (
    <EmailLayout preview="Confirm your newsletter subscription">
      <Heading>Confirm Your Subscription</Heading>
      <Paragraph>
        You recently signed up to receive our newsletter at <strong>{email}</strong>.
      </Paragraph>
      <Paragraph>
        To complete your subscription and start receiving updates, please confirm your email address
        by clicking the button below:
      </Paragraph>
      <Button href={confirmUrl}>Confirm Subscription</Button>
      <Small>If you didn't request this subscription, you can safely ignore this email.</Small>
      <Small>This link will expire in 24 hours.</Small>
    </EmailLayout>
  );
}
