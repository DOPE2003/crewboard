import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Twitter from "next-auth/providers/twitter";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import db from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";

// All sessions issued before this timestamp are invalid.
// Update this value to force sign-out of all users.
const SESSION_VALID_FROM = 1742041200000; // 2026-03-15 — new auth system

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
        // Twitter OAuth 2.0 wraps user data inside a `data` field.
        const data = (p?.data ?? p) as Record<string, unknown>;
        const handle = (data?.username as string) || "";
        const existing = await db.user.findUnique({
          where: { twitterId: account.providerAccountId },
          select: { id: true },
        });

        // Upgrade image to 400x400 (Twitter returns _normal by default)
        const rawImage = user.image ?? "";
        const image = rawImage ? rawImage.replace("_normal", "_400x400") : undefined;

        const dbUser = await db.user.upsert({
          where: { twitterId: account.providerAccountId },
          update: {
            name: user.name ?? undefined,
            image: image ?? undefined,
            ...(handle ? { twitterHandle: handle } : {}),
          },
          create: {
            twitterId: account.providerAccountId,
            twitterHandle: handle,
            name: user.name,
            image,
          },
          select: { id: true },
        });

        if (!existing) {
          // Check if this user is in the first 20 — auto-grant OG badge
          const userCount = await db.user.count();
          if (userCount <= 20) {
            await db.user.update({
              where: { id: dbUser.id },
              data: { isOG: true },
            });
            await db.notification.create({
              data: {
                userId: dbUser.id,
                type: "og_badge",
                title: "You're an OG!",
                body: "You joined Crewboard in the first 20 builders. You've been awarded the OG badge — wear it with pride.",
              },
            });
          }

          // First-ever sign-up — onboarding welcome
          await db.notification.create({
            data: {
              userId: dbUser.id,
              type: "welcome",
              title: "Welcome to Crewboard!",
              body: "Your account is set up. Complete your profile to appear in the talent directory and start connecting with Web3 builders.",
            },
          });

          // Send welcome email if Twitter provided one
          if (user.email) {
            const name = user.name ?? handle ?? "Builder";
            await sendWelcomeEmail({ to: user.email, name, handle }).catch(() => {});
          }
        } else {
          // Returning sign-in — welcome back (once per day max)
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const alreadyToday = await db.notification.findFirst({
            where: {
              userId: dbUser.id,
              type: "signin",
              createdAt: { gte: todayStart },
            },
            select: { id: true },
          });
          if (!alreadyToday) {
            const firstName = (user.name ?? handle ?? "Builder").split(" ")[0];
            await db.notification.create({
              data: {
                userId: dbUser.id,
                type: "signin",
                title: `Welcome back, ${firstName}!`,
                body: "Good to see you again. Check out new builders, browse open projects, and update your availability.",
              },
            });
          }
        }
      }

      // Credentials sign-in — create welcome/signin notification too
      if (account?.provider === "credentials" && user?.id) {
        try {
          const dbUser = await db.user.findUnique({
            where: { id: user.id as string },
            select: { id: true, name: true },
          });
          if (dbUser) {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const alreadyToday = await db.notification.findFirst({
              where: { userId: dbUser.id, type: "signin", createdAt: { gte: todayStart } },
              select: { id: true },
            });
            if (!alreadyToday) {
              const firstName = (dbUser.name ?? "Builder").split(" ")[0];
              await db.notification.create({
                data: {
                  userId: dbUser.id,
                  type: "signin",
                  title: `Welcome back, ${firstName}!`,
                  body: "Good to see you again. Check out new builders, browse open projects, and update your availability.",
                },
              });
            }
          }
        } catch { /* ignore notification errors */ }
      }

      return true;
    },

    async jwt({ token, account, profile, trigger, session, user }) {
      // Invalidate all tokens issued before SESSION_VALID_FROM
      if (account) {
        // Fresh sign-in — stamp it
        token.issuedAt = Date.now();
      } else if (token.issuedAt && (token.issuedAt as number) < SESSION_VALID_FROM) {
        // Token explicitly issued before the cutoff — wipe it
        return {} as typeof token;
      }
      // Tokens with no issuedAt (issued before stamp was added) are allowed through —
      // they'll be stamped next time the user refreshes/signs in.

      if (account?.provider === "credentials") {
        // Credentials sign-in — look up by email (user.id = DB id from authorize())
        const dbUser = await db.user.findUnique({
          where: { id: user.id as string },
          select: { id: true, twitterHandle: true, profileComplete: true },
        });
        token.userId = dbUser?.id;
        token.twitterHandle = dbUser?.twitterHandle;
        token.profileComplete = dbUser?.profileComplete ?? false;
      } else if (account?.provider === "twitter") {
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
      } else if (trigger === "update") {
        const passed = session as { profileComplete?: boolean } | null;
        if (passed?.profileComplete !== undefined) token.profileComplete = passed.profileComplete;
        if (token.userId) {
          const fresh = await db.user.findUnique({
            where: { id: token.userId as string },
            select: { profileComplete: true },
          });
          if (fresh) {
            token.profileComplete = fresh.profileComplete;
          }
        }
      } else if (!token.userId && token.sub) {
        // Recovery: userId missing from existing token (e.g. old JWT before userId field was added).
        // For Credentials users token.sub = DB cuid; for Twitter users token.sub = Twitter providerAccountId.
        try {
          let recovered = await db.user.findUnique({
            where: { id: token.sub },
            select: { id: true, twitterHandle: true, profileComplete: true },
          });
          if (!recovered) {
            // Twitter user — token.sub is the Twitter providerAccountId, not DB id
            recovered = await db.user.findUnique({
              where: { twitterId: token.sub },
              select: { id: true, twitterHandle: true, profileComplete: true },
            });
          }
          if (recovered) {
            token.userId = recovered.id;
            token.twitterHandle = recovered.twitterHandle;
            token.profileComplete = recovered.profileComplete;
          }
        } catch { /* ignore recovery failure */ }
      }
      // Keep token lean — do not store access tokens, image URLs, or timestamps.
      // Image is fetched from DB by components that need it; avatar is updated on sign-in.
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
      return session;
    },
  },
});
