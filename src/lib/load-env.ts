import { config } from "dotenv";
import { resolve } from "path";

/**
 * Load environment variables consistently across the project
 *
 * This is used by:
 * - drizzle.config.ts (database migrations)
 * - seed scripts (tsx)
 * - any other standalone scripts that need env vars
 *
 * Next.js runtime automatically loads .env.local, but standalone
 * scripts (drizzle-kit, tsx) need manual loading.
 *
 * Priority order (dotenv default):
 * 1. .env.local (local overrides, gitignored)
 * 2. .env (defaults, committed)
 */
export function loadEnv() {
  const projectRoot = process.cwd();

  // Load .env.local first (highest priority)
  config({ path: resolve(projectRoot, ".env.local") });

  // Load .env as fallback
  config({ path: resolve(projectRoot, ".env") });
}
