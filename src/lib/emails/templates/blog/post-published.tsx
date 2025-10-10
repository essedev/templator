/**
 * Blog post published notification email
 * Sent to author when their post is published by an admin
 */

import { EmailLayout } from "../base/layout";
import { Heading, Paragraph, Button, Small } from "../base/components";

export interface PostPublishedProps {
  authorName: string;
  postTitle: string;
  postUrl: string;
  publishedBy: string;
  publishedAt: Date;
}

export function PostPublishedTemplate({
  authorName,
  postTitle,
  postUrl,
  publishedBy,
  publishedAt,
}: PostPublishedProps) {
  const formattedDate = publishedAt.toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <EmailLayout preview="Your blog post has been published!">
      <Heading>Your Post is Live!</Heading>
      <Paragraph>Hi {authorName},</Paragraph>
      <Paragraph>
        Great news! Your blog post "<strong>{postTitle}</strong>" has been published and is now live
        on the site.
      </Paragraph>
      <Paragraph>
        <strong>Published by:</strong> {publishedBy}
        <br />
        <strong>Published on:</strong> {formattedDate}
      </Paragraph>
      <Button href={postUrl}>View Your Post</Button>
      <Small>Share your post with your audience and on social media!</Small>
    </EmailLayout>
  );
}
