import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// Auth.js integration. Uses JWT sessions (no adapter) and we bridge to our own
// app session cookies via /api/auth/exchange and /api/auth/link/google.
export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth(async () => {
  const secret = process.env.NEXTAUTH_SECRET;
  const googleId = process.env.AUTH_GOOGLE_ID;
  const googleSecret = process.env.AUTH_GOOGLE_SECRET;

  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is not set");
  }
  if (!googleId || !googleSecret) {
    throw new Error("Google OAuth is not configured (AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET)");
  }

  return {
    secret,
    session: { strategy: "jwt" },
    providers: [
      Google({
        clientId: googleId,
        clientSecret: googleSecret,
      }),
    ],
    callbacks: {
      async jwt({ token, account, profile }) {
        // When signing in, stash provider subject so our bridge endpoints can read it.
        if (account?.provider && account.providerAccountId) {
          (token as Record<string, unknown>).provider = account.provider;
          (token as Record<string, unknown>).providerAccountId = account.providerAccountId;
        }

        const maybeProfile = profile as unknown as { email?: unknown } | undefined;
        if (maybeProfile && typeof maybeProfile.email === "string") {
          (token as Record<string, unknown>).email = maybeProfile.email;
        }

        return token;
      },
      async session({ session, token }) {
        const extra = token as Record<string, unknown>;
        (session as Record<string, unknown>).provider = extra.provider;
        (session as Record<string, unknown>).providerAccountId = extra.providerAccountId;
        (session as Record<string, unknown>).email = extra.email;
        return session;
      },
    },
  };
});
