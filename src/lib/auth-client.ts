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
export const { signIn, signUp, signOut, resetPassword, verifyEmail } = authClient;

/**
 * Request password reset email.
 *
 * Custom implementation for Better Auth v1.4+ where forgetPassword
 * was removed from the client.
 */
export const forgetPassword = async (data: {
  email: string;
  redirectTo?: string;
}): Promise<{
  data?: { success: boolean };
  error?: { message?: string; status?: number };
}> => {
  try {
    const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseURL}/api/auth/forget-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      return {
        error: {
          message: errorData.message || "Failed to send reset email",
          status: response.status,
        },
      };
    }

    return { data: { success: true } };
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : "Network error",
      },
    };
  }
};
