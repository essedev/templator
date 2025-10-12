/**
 * Email helpers for Better Auth flows.
 * Handles email verification and password reset emails.
 */

import { sendEmail } from "./send";
import { VerifyEmailTemplate } from "./templates/auth/verify-email";
import { PasswordResetTemplate } from "./templates/auth/password-reset";

/**
 * Send email verification link.
 * Called by Better Auth when user needs to verify their email.
 */
export async function sendVerificationEmail({
  user,
  url,
}: {
  user: { name: string; email: string };
  url: string;
}) {
  await sendEmail({
    to: user.email,
    subject: "Verify your email address",
    react: VerifyEmailTemplate({
      name: user.name,
      verificationUrl: url,
    }),
  });
}

/**
 * Send password reset link.
 * Called by Better Auth when user requests password reset.
 */
export async function sendPasswordResetEmail({
  user,
  url,
}: {
  user: { name: string; email: string };
  url: string;
}) {
  await sendEmail({
    to: user.email,
    subject: "Reset your password",
    react: PasswordResetTemplate({
      name: user.name,
      resetUrl: url,
    }),
  });
}
