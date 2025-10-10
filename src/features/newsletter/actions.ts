"use server";

import { db } from "@/db";
import { newsletterSubscribers, verificationTokens } from "@/db/schema";
import { newsletterSchema } from "./schema";
import { eq, and } from "drizzle-orm";
import { sendEmail } from "@/lib/emails/send";
import { SubscribeConfirmTemplate } from "@/lib/emails/templates/newsletter/subscribe-confirm";
import { NewsletterWelcomeTemplate } from "@/lib/emails/templates/newsletter/welcome";
import { z } from "zod";

const NEXTAUTH_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

/**
 * Server Action: newsletter subscription with double opt-in.
 *
 * Flow:
 * 1. Validate email with Zod
 * 2. Check if already subscribed
 * 3. Create pending subscriber
 * 4. Send confirmation email
 *
 * @param input - Email to validate
 * @returns Success state
 */
export async function subscribeToNewsletter(input: unknown) {
  try {
    // 1. Validate input
    const data = newsletterSchema.parse(input);

    // 2. Check if already subscribed
    const [existing] = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, data.email))
      .limit(1);

    if (existing) {
      if (existing.status === "active") {
        return {
          success: false,
          error: "You're already subscribed to the newsletter!",
        };
      }

      if (existing.status === "pending") {
        // Resend confirmation email
        const token = crypto.randomUUID();
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await db.insert(verificationTokens).values({
          identifier: `newsletter:${data.email}`,
          token,
          expires,
        });

        const confirmUrl = `${NEXTAUTH_URL}/newsletter/confirm/${token}`;
        await sendEmail({
          to: data.email,
          subject: "Confirm your newsletter subscription",
          react: SubscribeConfirmTemplate({
            email: data.email,
            confirmUrl,
          }),
        });

        return {
          success: true,
          message: "Confirmation email resent! Please check your inbox.",
        };
      }

      // Reactivate if was unsubscribed
      if (existing.status === "unsubscribed") {
        const token = crypto.randomUUID();
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await db
          .update(newsletterSubscribers)
          .set({
            status: "pending",
            subscribedAt: new Date(),
            confirmedAt: null,
            unsubscribedAt: null,
          })
          .where(eq(newsletterSubscribers.email, data.email));

        await db.insert(verificationTokens).values({
          identifier: `newsletter:${data.email}`,
          token,
          expires,
        });

        const confirmUrl = `${NEXTAUTH_URL}/newsletter/confirm/${token}`;
        await sendEmail({
          to: data.email,
          subject: "Confirm your newsletter subscription",
          react: SubscribeConfirmTemplate({
            email: data.email,
            confirmUrl,
          }),
        });

        return {
          success: true,
          message: "Please check your email to confirm your subscription.",
        };
      }
    }

    // 3. Create new pending subscriber
    await db.insert(newsletterSubscribers).values({
      email: data.email,
      status: "pending",
    });

    // 4. Create verification token and send confirmation email
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.insert(verificationTokens).values({
      identifier: `newsletter:${data.email}`,
      token,
      expires,
    });

    const confirmUrl = `${NEXTAUTH_URL}/newsletter/confirm/${token}`;

    const result = await sendEmail({
      to: data.email,
      subject: "Confirm your newsletter subscription",
      react: SubscribeConfirmTemplate({
        email: data.email,
        confirmUrl,
      }),
    });

    if (!result.success) {
      console.error("Failed to send confirmation email:", result.error);
      return {
        success: false,
        error: "Failed to send confirmation email. Please try again later.",
      };
    }

    return {
      success: true,
      message: "Please check your email to confirm your subscription!",
    };
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return {
      success: false,
      error: "An error occurred during subscription. Please try again later.",
    };
  }
}

/**
 * Server Action: confirm newsletter subscription.
 *
 * @param token - Verification token from email
 * @returns Success state
 */
export async function confirmNewsletterSubscription(token: string) {
  try {
    // 1. Find verification token
    const [verification] = await db
      .select()
      .from(verificationTokens)
      .where(and(eq(verificationTokens.token, token)))
      .limit(1);

    if (!verification) {
      return {
        success: false,
        error: "Invalid or expired confirmation link.",
      };
    }

    // Check if expired
    if (verification.expires < new Date()) {
      await db.delete(verificationTokens).where(eq(verificationTokens.token, token));
      return {
        success: false,
        error: "Confirmation link has expired. Please subscribe again.",
      };
    }

    // Extract email from identifier (format: "newsletter:email@example.com")
    if (!verification.identifier.startsWith("newsletter:")) {
      return {
        success: false,
        error: "Invalid confirmation token.",
      };
    }

    const email = verification.identifier.replace("newsletter:", "");

    // 2. Update subscriber status to active
    await db
      .update(newsletterSubscribers)
      .set({
        status: "active",
        confirmedAt: new Date(),
      })
      .where(eq(newsletterSubscribers.email, email));

    // 3. Delete verification token (one-time use)
    await db.delete(verificationTokens).where(eq(verificationTokens.token, token));

    // 4. Send welcome email
    const unsubscribeUrl = `${NEXTAUTH_URL}/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;

    await sendEmail({
      to: email,
      subject: "Welcome to our newsletter!",
      react: NewsletterWelcomeTemplate({
        email,
        unsubscribeUrl,
      }),
    });

    return {
      success: true,
      message: "Subscription confirmed! Welcome to our newsletter.",
    };
  } catch (error) {
    console.error("Newsletter confirmation error:", error);
    return {
      success: false,
      error: "An error occurred during confirmation.",
    };
  }
}

/**
 * Server Action: unsubscribe from newsletter.
 *
 * @param email - Email to unsubscribe
 */
export async function unsubscribeFromNewsletter(email: string) {
  try {
    const emailSchema = z.string().email();
    const validatedEmail = emailSchema.parse(email);

    const [existing] = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, validatedEmail))
      .limit(1);

    if (!existing) {
      return {
        success: false,
        error: "Email not found.",
      };
    }

    await db
      .update(newsletterSubscribers)
      .set({
        status: "unsubscribed",
        unsubscribedAt: new Date(),
      })
      .where(eq(newsletterSubscribers.email, validatedEmail));

    return {
      success: true,
      message: "You have been unsubscribed from the newsletter.",
    };
  } catch (error) {
    console.error("Newsletter unsubscribe error:", error);
    return {
      success: false,
      error: "An error occurred during unsubscription.",
    };
  }
}
