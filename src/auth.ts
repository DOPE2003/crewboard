import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Twitter from "next-auth/providers/twitter";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import db from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";

// All sessions issued before this timestamp are invalid.
const SESSION_VALID_FROM = 1742041200000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  providers: [
    Twitter({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)?.toLowerCase();
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;
        const user = await db.user.findFirst({
          where: { email },
          select: { id: true, email: true, passwordHash: true, name: true, twitterHandle: true, image: true },
        });
        if (!user?.passwordHash) return null;
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "twitter") {
        const p = profile as Record<string, unknown>;
        const data = (p?.data ?? p) as Record<string, unknown>;
        const handle = ((data?.username as string) || "").toLowerCase();

        const rawImage = user.image ?? "";
        const image = rawImage ? rawImage.replace("_normal", "_400x400") : undefined;

        try {
          await db.user.upsert({
            where: { twitterId: account.providerAccountId },
            update: {
              name: user.name ?? undefined,
              image: image ?? undefined,
              ...(handle ? { twitterHandle: handle } : {}),
              // Save email from Twitter if provided and not already set
              ...(user.email ? { email: user.email } : {}),
            },
            create: {
              twitterId: account.providerAccountId,
              twitterHandle: handle,
              name: user.name,
              image,
              ...(user.email ? { email: user.email } : {}),
            },
          });
        } catch (e: any) {
          // P2002: twitterHandle already exists under a different/null twitterId.
          // Link the twitterId to the existing user instead.
          if (e?.code === "P2002" && handle) {
            await db.user.update({
              where: { twitterHandle: handle },
              data: {
                twitterId: account.providerAccountId,
                name: user.name ?? undefined,
                image: image ?? undefined,
              },
            });
          } else {
            throw e;
          }
        }
      }
      return true;
    },

    async jwt({ token, account, profile, trigger, session, user }) {
      if (account) {
        token.issuedAt = Date.now();
      } else if (token.issuedAt && (token.issuedAt as number) < SESSION_VALID_FROM) {
        return {} as typeof token;
      }

      if (account?.provider === "credentials" || account?.provider === "twitter") {
        const dbUser = await db.user.findUnique({
          where: account.provider === "twitter" 
            ? { twitterId: account.providerAccountId }
            : { id: user?.id as string },
          select: { id: true, twitterHandle: true, profileComplete: true, role: true },
        });
        
        token.userId = dbUser?.id;
        token.twitterHandle = dbUser?.twitterHandle;
        token.profileComplete = dbUser?.profileComplete ?? false;
        token.role = dbUser?.role ?? "USER";
      } else if (trigger === "update") {
        const passed = session as { profileComplete?: boolean } | null;
        if (passed?.profileComplete !== undefined) token.profileComplete = passed.profileComplete;
        if (token.userId) {
          const fresh = await db.user.findUnique({
            where: { id: token.userId as string },
            select: { profileComplete: true, role: true },
          });
          if (fresh) {
            token.profileComplete = fresh.profileComplete;
            token.role = fresh.role;
          }
        }
      } else if (!token.userId && token.sub) {
        try {
          let recovered = await db.user.findUnique({
            where: { id: token.sub },
            select: { id: true, twitterHandle: true, profileComplete: true, role: true },
          });
          if (!recovered) {
            recovered = await db.user.findUnique({
              where: { twitterId: token.sub },
              select: { id: true, twitterHandle: true, profileComplete: true, role: true },
            });
          }
          if (recovered) {
            token.userId = recovered.id;
            token.twitterHandle = recovered.twitterHandle;
            token.profileComplete = recovered.profileComplete;
            token.role = recovered.role;
          }
        } catch { /* ignore */ }
      }
      
      delete (token as Record<string, unknown>).picture;
      delete (token as Record<string, unknown>).twitterAccessToken;
      delete (token as Record<string, unknown>).imageRefreshedAt;
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.sub ?? "";
      session.user.userId = token.userId as string | undefined;
      session.user.twitterHandle = token.twitterHandle as string | undefined;
      session.user.profileComplete = token.profileComplete as boolean | undefined;
      session.user.role = token.role as any;
      return session;
    },
  },
});
