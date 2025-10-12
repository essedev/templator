"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

/**
 * Client providers wrapper.
 * Include ThemeProvider (dark mode) e Sonner (toast notifications).
 *
 * Note: Better Auth doesn't require a SessionProvider wrapper like NextAuth.
 * Session management is handled automatically via cookies and hooks.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
      <Toaster />
    </ThemeProvider>
  );
}
