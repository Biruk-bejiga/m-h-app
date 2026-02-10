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

  // Important: do not throw here. Next dev/build may evaluate this module during compilation.
  // If env is missing, we return a config with zero providers; OAuth routes will respond
  // but sign-in will not be available until env is configured.
  const providers =
    googleId && googleSecret
      ? [
          Google({
            clientId: googleId,
            clientSecret: googleSecret,
          }),
        ]
      : [];

  return {
    secret,
    session: { strategy: "jwt" },
    providers,
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
