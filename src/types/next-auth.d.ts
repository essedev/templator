import { DefaultSession } from "next-auth";

/**
 * Module augmentation for NextAuth types.
 * Estende i tipi di default per includere il campo 'role'.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "user" | "editor" | "admin";
    } & DefaultSession["user"];
  }

  interface User {
    role: "user" | "editor" | "admin";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "user" | "editor" | "admin";
  }
}
