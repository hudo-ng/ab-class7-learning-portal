import NextAuth, { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { db } from "@/db/index";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const authOptions: NextAuthOptions = {
  providers: [
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
        if (!user) return null;

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
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as "USER" | "ADMIN";
        session.user.isApproved = token.isApproved as boolean;
      }
      return session;
    },
    async jwt({ token, user }) {
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
