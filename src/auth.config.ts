import type { NextAuthConfig } from "next-auth";
import Twitter from "next-auth/providers/twitter";

// Lightweight config — NO database imports.
// Safe to use in Edge Runtime (middleware/proxy).
export const authConfig = {
  providers: [
    Twitter({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" as const },
  pages: { signIn: "/login" },
  trustHost: true,
  callbacks: {
    // Map token fields into the session so the proxy can read profileComplete.
    // No DB calls here — Edge-safe.
    session({ session, token }) {
      session.user.profileComplete = token.profileComplete as boolean | undefined;
      session.user.humanVerified = token.humanVerified as boolean | undefined;
      session.user.userId = token.userId as string | undefined;
      session.user.twitterHandle = token.twitterHandle as string | undefined;
      return session;
    },
  },
} satisfies NextAuthConfig;
