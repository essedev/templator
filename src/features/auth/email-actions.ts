"use server";

/**
 * Auth email actions
 *
 * Handles email verification and password reset flows.
 */

import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/lib/emails/send";
import { hashPassword } from "@/lib/password";
import { VerifyEmailTemplate } from "@/lib/emails/templates/auth/verify-email";
import { PasswordResetTemplate } from "@/lib/emails/templates/auth/password-reset";
import { PasswordChangedTemplate } from "@/lib/emails/templates/auth/password-changed";

const NEXTAUTH_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

/**
 * Send email verification link to user
 */
export async function sendVerificationEmail(userId: string) {
  try {
    // Get user
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if already verified
    if (user.emailVerified) {
      return { success: false, error: "Email already verified" };
    }

    // Generate token
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Save token
    await db.insert(verificationTokens).values({
      identifier: user.email,
      token,
      expires,
    });

    // Send email
    const verificationUrl = `${NEXTAUTH_URL}/verify-email/${token}`;

    await sendEmail({
      to: user.email,
      subject: "Verify your email address",
      react: VerifyEmailTemplate({
        name: user.name || "User",
        verificationUrl,
      }),
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending verification email:", error);
    return { success: false, error: "Failed to send verification email" };
  }
}

/**
 * Verify email with token
 */
export async function verifyEmailToken(token: string) {
  try {
    // Find token
    const [verification] = await db
      .select()
      .from(verificationTokens)
      .where(eq(verificationTokens.token, token))
      .limit(1);

    if (!verification) {
      return { success: false, error: "Invalid verification link" };
    }

    // Check expiration
    if (verification.expires < new Date()) {
      // Delete expired token
      await db.delete(verificationTokens).where(eq(verificationTokens.token, token));
      return { success: false, error: "Verification link has expired" };
    }

    // Update user
    await db
      .update(users)
      .set({ emailVerified: new Date() })
      .where(eq(users.email, verification.identifier));

    // Delete token
    await db.delete(verificationTokens).where(eq(verificationTokens.token, token));

    return { success: true };
  } catch (error) {
    console.error("Error verifying email:", error);
    return { success: false, error: "Failed to verify email" };
  }
}

/**
 * Request password reset (sends email)
 */
export async function requestPasswordReset(email: string) {
  try {
    // Get user
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    // Don't reveal if email exists (security best practice)
    if (!user) {
      return {
        success: true,
        message: "If this email is registered, you will receive a password reset link",
      };
    }

    // Generate token
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token
    await db.insert(verificationTokens).values({
      identifier: user.email,
      token,
      expires,
    });

    // Send email
    const resetUrl = `${NEXTAUTH_URL}/reset-password/${token}`;

    await sendEmail({
      to: user.email,
      subject: "Reset your password",
      react: PasswordResetTemplate({
        name: user.name || "User",
        resetUrl,
      }),
    });

    return {
      success: true,
      message: "If this email is registered, you will receive a password reset link",
    };
  } catch (error) {
    console.error("Error requesting password reset:", error);
    return {
      success: true,
      message: "If this email is registered, you will receive a password reset link",
    };
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string) {
  try {
    // Validate token
    const [verification] = await db
      .select()
      .from(verificationTokens)
      .where(eq(verificationTokens.token, token))
      .limit(1);

    if (!verification || verification.expires < new Date()) {
      return { success: false, error: "Invalid or expired reset link" };
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, verification.identifier))
      .limit(1);

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    // Delete token
    await db.delete(verificationTokens).where(eq(verificationTokens.token, token));

    // Send confirmation email
    await sendEmail({
      to: user.email,
      subject: "Your password was changed",
      react: PasswordChangedTemplate({
        name: user.name || "User",
        changedAt: new Date(),
      }),
    });

    return { success: true };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { success: false, error: "Failed to reset password" };
  }
}
