/**
 * Unified email sending function
 *
 * Handles both mock mode (development/testing) and real sending with Resend.
 * All email sending in the app should go through this function.
 */

import { Resend } from "resend";
import { emailConfig, isMockMode } from "./config";
import type { ReactElement } from "react";

const resend = emailConfig.resendApiKey ? new Resend(emailConfig.resendApiKey) : null;

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: ReactElement;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: unknown;
}

/**
 * Send an email using configured provider (mock or Resend)
 *
 * @example
 * await sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Welcome!',
 *   react: <WelcomeTemplate name="John" />
 * });
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { to, subject, react, replyTo } = options;

  // Mock mode (development or no API key configured)
  if (isMockMode) {
    console.log("📧 [MOCK EMAIL SENT]");
    console.log(`  To: ${Array.isArray(to) ? to.join(", ") : to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  From: ${emailConfig.from}`);
    if (replyTo) console.log(`  Reply-To: ${replyTo}`);
    console.log("  ---");
    return { success: true, messageId: "mock-" + Date.now() };
  }

  // Real sending with Resend
  try {
    if (!resend) {
      throw new Error("Resend not initialized - check RESEND_API_KEY");
    }

    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: Array.isArray(to) ? to : [to],
      subject,
      react,
      replyTo: replyTo || emailConfig.replyTo,
    });

    if (error) {
      console.error("❌ Email send error:", error);
      return { success: false, error };
    }

    console.log(`✅ Email sent: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("❌ Email send error:", error);
    return { success: false, error };
  }
}
