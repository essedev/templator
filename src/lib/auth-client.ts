import { createAuthClient } from "better-auth/react";

/**
 * Better Auth client for client-side authentication.
 *
 * Provides hooks and methods:
 * - useSession() - Get current session (reactive)
 * - signIn.email() - Sign in with email/password
 * - signUp.email() - Sign up with email/password
 * - signOut() - Sign out
 * - resetPassword() - Reset password
 * - forgetPassword() - Request password reset
 * - verifyEmail() - Verify email
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

// Export commonly used hooks and methods
export const { useSession } = authClient;
export const { signIn, signUp, signOut, resetPassword, forgetPassword, verifyEmail } = authClient;
