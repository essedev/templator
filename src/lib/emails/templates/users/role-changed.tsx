/**
 * User role change notification email
 * Sent when an admin changes a user's role
 */

import { EmailLayout } from "../base/layout";
import { Heading, Paragraph, Code, Divider, Small } from "../base/components";

export interface RoleChangedProps {
  name: string;
  oldRole: string;
  newRole: string;
  changedBy: string;
  changedAt: Date;
}

export function RoleChangedTemplate({
  name,
  oldRole,
  newRole,
  changedBy,
  changedAt,
}: RoleChangedProps) {
  const formattedDate = changedAt.toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <EmailLayout preview="Your account role has been updated">
      <Heading>Account Role Updated</Heading>
      <Paragraph>Hi {name},</Paragraph>
      <Paragraph>
        Your account role has been changed from <Code>{oldRole}</Code> to <Code>{newRole}</Code>.
      </Paragraph>
      <Paragraph>
        <strong>Changed by:</strong> {changedBy}
        <br />
        <strong>Changed on:</strong> {formattedDate}
      </Paragraph>
      <Divider />
      <Small>
        If you believe this change was made in error, please contact support immediately.
      </Small>
    </EmailLayout>
  );
}
