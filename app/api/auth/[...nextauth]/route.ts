import NextAuth, { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google, { type GoogleProfile } from "next-auth/providers/google";
import bcrypt from "bcrypt";
import { db } from "@/db/index";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { findOrCreateGoogleUser } from "@/db/queries/users";

export const authOptions: NextAuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.trim().toLowerCase();
        const user = await db.query.users.findFirst({
          where: sql`lower(${users.email}) = ${email}`,
        });

        if (!user?.hashedPassword) return null;

        const valid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword,
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          role: user.role as "USER" | "ADMIN",
          isApproved: user.isApproved,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  callbacks: {
    // Runs first on every sign-in; returning false rejects it
    signIn({ account, profile }) {
      if (account?.provider === "google") {
        const google = profile as GoogleProfile | undefined;
        // Only trust addresses Google has verified: we link accounts by email
        return !!google?.email && google.email_verified === true;
      }
      return true; // credentials were already checked in authorize()
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as "USER" | "ADMIN";
        session.user.isApproved = token.isApproved as boolean;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      // First request after a Google sign-in: swap Google's id for ours
      if (account?.provider === "google" && token.email) {
        const dbUser = await findOrCreateGoogleUser(token.email);
        token.sub = dbUser.id;
        token.role = dbUser.role as "USER" | "ADMIN";
        token.isApproved = dbUser.isApproved;
        return token;
      }
      if (user) {
        token.role = user.role;
        token.isApproved = user.isApproved;
        return token;
      }
      if (token.sub) {
        try {
          const dbUser = await db.query.users.findFirst({
            where: eq(users.id, token.sub),
            columns: { role: true, isApproved: true },
          });
          if (!dbUser) {
            token.role = "USER";
            token.isApproved = false;
          } else {
            token.role = dbUser.role as "USER" | "ADMIN";
            token.isApproved = dbUser.isApproved;
          }
        } catch (err) {
          // Keep the existing token values if the DB is briefly unavailable
          console.error("Session refresh failed:", (err as Error).cause ?? err);
        }
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);
export { handler as POST, handler as GET };
