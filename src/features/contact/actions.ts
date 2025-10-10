"use server";

import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { contactSchema } from "./schema";
import { sendEmail } from "@/lib/emails/send";
import { ContactAutoReplyTemplate } from "@/lib/emails/templates/contact/auto-reply";
import { ContactAdminNotificationTemplate } from "@/lib/emails/templates/contact/admin-notification";
import { emailConfig } from "@/lib/emails/config";

/**
 * Server Action: save contact message and send notifications.
 *
 * Flow:
 * 1. Validate input with Zod
 * 2. Save message to database
 * 3. Send auto-reply to user
 * 4. Send notification to admin
 *
 * @param input - Form data validated with Zod
 * @returns Success state
 */
export async function sendContactMessage(input: unknown) {
  try {
    // 1. Validate input
    const data = contactSchema.parse(input);

    // 2. Save to database
    const [savedMessage] = await db
      .insert(contactMessages)
      .values({
        name: data.name,
        email: data.email,
        message: data.message,
      })
      .returning();

    // 3. Send auto-reply to user
    try {
      await sendEmail({
        to: data.email,
        subject: "We received your message",
        react: ContactAutoReplyTemplate({
          name: data.name,
        }),
      });
    } catch (emailError) {
      // Don't block if email fails
      console.error("Auto-reply email failed:", emailError);
    }

    // 4. Send notification to admin
    try {
      const adminEmail = process.env.ADMIN_EMAIL || emailConfig.from;
      await sendEmail({
        to: adminEmail,
        subject: `New contact message from ${data.name}`,
        react: ContactAdminNotificationTemplate({
          name: data.name,
          email: data.email,
          message: data.message,
          submittedAt: savedMessage.createdAt,
        }),
        replyTo: data.email,
      });
    } catch (emailError) {
      // Don't block if email fails
      console.error("Admin notification email failed:", emailError);
    }

    return {
      success: true,
      message: "Message sent successfully!",
    };
  } catch (error) {
    console.error("Contact form error:", error);
    return {
      success: false,
      error: "An error occurred while sending your message. Please try again later.",
    };
  }
}
