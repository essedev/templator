/**
 * Contact form auto-reply email
 * Sent to user after they submit the contact form
 */

import { EmailLayout } from "../base/layout";
import { Heading, Paragraph, Small, Divider } from "../base/components";

export interface ContactAutoReplyProps {
  name: string;
}

export function ContactAutoReplyTemplate({ name }: ContactAutoReplyProps) {
  return (
    <EmailLayout preview="We received your message">
      <Heading>Thanks for reaching out!</Heading>
      <Paragraph>Hi {name},</Paragraph>
      <Paragraph>
        We've received your message and will get back to you as soon as possible.
      </Paragraph>
      <Paragraph>Our team typically responds within 24-48 hours during business days.</Paragraph>
      <Divider />
      <Small>This is an automated response. Please don't reply to this email.</Small>
    </EmailLayout>
  );
}
