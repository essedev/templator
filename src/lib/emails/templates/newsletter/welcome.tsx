/**
 * Newsletter welcome email
 * Sent after user confirms subscription
 */

import { EmailLayout } from "../base/layout";
import { Heading, Paragraph, Small, Divider } from "../base/components";

export interface NewsletterWelcomeProps {
  email: string;
  unsubscribeUrl: string;
}

export function NewsletterWelcomeTemplate({ email, unsubscribeUrl }: NewsletterWelcomeProps) {
  return (
    <EmailLayout preview="Welcome to our newsletter!">
      <Heading>Welcome to Templator Newsletter!</Heading>
      <Paragraph>
        Thanks for confirming your subscription! You're now part of our community at{" "}
        <strong>{email}</strong>.
      </Paragraph>
      <Paragraph>You'll receive updates about:</Paragraph>
      <ul style={{ margin: "0 0 16px 0", paddingLeft: "20px", color: "#374151" }}>
        <li style={{ marginBottom: "8px" }}>New features and updates</li>
        <li style={{ marginBottom: "8px" }}>Best practices and tips</li>
        <li style={{ marginBottom: "8px" }}>Community highlights</li>
      </ul>
      <Divider />
      <Small>
        You can unsubscribe at any time by clicking{" "}
        <a href={unsubscribeUrl} style={{ color: "#6b7280", textDecoration: "underline" }}>
          here
        </a>
        .
      </Small>
    </EmailLayout>
  );
}
