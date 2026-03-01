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
} satisfies NextAuthConfig;
