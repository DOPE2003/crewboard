import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import db from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "twitter") {
        const p = profile as Record<string, unknown>;
        // Twitter OAuth 2.0 wraps user data inside a `data` field.
        const data = (p?.data ?? p) as Record<string, unknown>;
        const handle = (data?.username as string) || "";
        await db.user.upsert({
          where: { twitterId: account.providerAccountId },
          update: {
            name: user.name ?? undefined,
            image: user.image ?? undefined,
            // Patch any existing empty handle on every sign-in.
            ...(handle ? { twitterHandle: handle } : {}),
          },
          create: {
            twitterId: account.providerAccountId,
            twitterHandle: handle,
            name: user.name,
            image: user.image,
          },
        });
      }
      return true;
    },

    async jwt({ token, account, profile, trigger }) {
      if (account?.provider === "twitter") {
        // First sign-in — populate token from DB
        const dbUser = await db.user.findUnique({
          where: { twitterId: account.providerAccountId },
          select: { id: true, twitterHandle: true, profileComplete: true },
        });
        const p = profile as Record<string, unknown>;
        const data = (p?.data ?? p) as Record<string, unknown>;
        const handleFromProfile = (data?.username as string) || undefined;
        token.userId = dbUser?.id;
        token.twitterHandle = dbUser?.twitterHandle || handleFromProfile;
        token.profileComplete = dbUser?.profileComplete ?? false;
      } else if (trigger === "update" && token.sub) {
        // Called after useSession().update() — re-fetch profileComplete from DB
        const dbUser = await db.user.findUnique({
          where: { twitterId: token.sub },
          select: { profileComplete: true },
        });
        token.profileComplete = dbUser?.profileComplete ?? false;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.sub ?? "";
      session.user.userId = token.userId as string | undefined;
      session.user.twitterHandle = token.twitterHandle as string | undefined;
      session.user.profileComplete = token.profileComplete as boolean | undefined;
      return session;
    },
  },
});
