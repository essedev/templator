/**
 * Type definitions for Better Auth with custom role field.
 */
import type { User as BetterAuthUser, Session as BetterAuthSession } from "better-auth/types";

// Define custom role type
export type Role = "user" | "editor" | "admin";

// Extend Better Auth User with role field
export interface AppUser extends Omit<BetterAuthUser, "role"> {
  role: Role;
}

// Extend Better Auth Session with custom User
export interface AppSession extends Omit<BetterAuthSession, "user"> {
  user: AppUser;
}

// Module augmentation for Better Auth
declare module "better-auth/types" {
  interface User {
    role: Role;
  }
}
