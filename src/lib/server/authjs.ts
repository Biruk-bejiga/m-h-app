import type { NextAuthOptions, Session } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";
import type { Account, Profile } from "next-auth";

// NextAuth v4 configuration.
// We use JWT sessions (no adapter) and bridge to our own app session cookies via /api/auth/exchange.
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_JWT_SECRET,
  session: { strategy: "jwt" },
  providers:
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : [],
  callbacks: {
    async jwt({ token, account, profile }: { token: JWT; account?: Account | null; profile?: Profile }) {
      if (account?.provider && account.providerAccountId) {
        (token as Record<string, unknown>).provider = account.provider;
        (token as Record<string, unknown>).providerAccountId = account.providerAccountId;
      }
      if (profile && typeof (profile as unknown as { email?: unknown }).email === "string") {
        (token as Record<string, unknown>).email = (profile as unknown as { email: string }).email;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      const extra = token as Record<string, unknown>;
      const mutable = session as unknown as Record<string, unknown>;
      mutable.provider = extra.provider;
      mutable.providerAccountId = extra.providerAccountId;
      mutable.email = extra.email;
      return session;
    },
  },
};
