/**
 * Email system configuration
 *
 * Supports mock mode (development) and Resend (production).
 * Set EMAIL_PROVIDER=mock or omit RESEND_API_KEY for mock mode.
 */

export const emailConfig = {
  provider: process.env.EMAIL_PROVIDER || "mock",
  from: process.env.EMAIL_FROM || "noreply@templator.dev",
  replyTo: process.env.EMAIL_REPLY_TO,
  resendApiKey: process.env.RESEND_API_KEY,
};

export const isDevelopment = process.env.NODE_ENV === "development";
export const isMockMode = emailConfig.provider === "mock" || !emailConfig.resendApiKey;
