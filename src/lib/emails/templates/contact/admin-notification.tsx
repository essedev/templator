/**
 * Contact form admin notification email
 * Sent to admin when someone submits the contact form
 */

import { EmailLayout } from "../base/layout";
import { Heading, Paragraph, Divider, Small } from "../base/components";

export interface ContactAdminNotificationProps {
  name: string;
  email: string;
  message: string;
  submittedAt: Date;
}

export function ContactAdminNotificationTemplate({
  name,
  email,
  message,
  submittedAt,
}: ContactAdminNotificationProps) {
  const formattedDate = submittedAt.toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <EmailLayout preview={`New contact form submission from ${name}`}>
      <Heading>New Contact Form Submission</Heading>
      <Paragraph>
        <strong>From:</strong> {name} ({email})
      </Paragraph>
      <Paragraph>
        <strong>Submitted:</strong> {formattedDate}
      </Paragraph>
      <Divider />
      <Paragraph>
        <strong>Message:</strong>
      </Paragraph>
      <div
        style={{
          backgroundColor: "#f9fafb",
          padding: "16px",
          borderRadius: "6px",
          borderLeft: "4px solid #3b82f6",
          marginBottom: "16px",
        }}
      >
        <p
          style={{
            margin: 0,
            whiteSpace: "pre-wrap",
            color: "#1f2937",
            fontSize: "14px",
            lineHeight: "22px",
          }}
        >
          {message}
        </p>
      </div>
      <Small>Reply to this message at: {email}</Small>
    </EmailLayout>
  );
}
