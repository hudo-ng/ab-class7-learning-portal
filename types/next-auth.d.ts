import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: "USER" | "ADMIN";
      isApproved: boolean;
    } & DefaultSession["user"];
  }
  interface User {
    role: "USER" | "ADMIN";
    isApproved: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "USER" | "ADMIN";
    isApproved?: boolean;
  }
}
