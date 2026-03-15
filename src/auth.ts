import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import db from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  providers: [
    // Inherit Twitter provider from authConfig, then add Credentials
    ...(authConfig.providers ?? []),
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
      return true;
    },

    async jwt({ token, account, profile, trigger, session, user }) {
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
        // Store access token so we can refresh the avatar periodically
        if (account.access_token) token.twitterAccessToken = account.access_token;
        token.imageRefreshedAt = Date.now();
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
      } else if (token.twitterAccessToken && token.userId) {
        // Refresh avatar from Twitter API once per hour
        const lastRefresh = (token.imageRefreshedAt as number) ?? 0;
        const oneHourMs = 60 * 60 * 1000;
        if (Date.now() - lastRefresh > oneHourMs) {
          try {
            const res = await fetch(
              "https://api.twitter.com/2/users/me?user.fields=profile_image_url,name",
              { headers: { Authorization: `Bearer ${token.twitterAccessToken}` } }
            );
            if (res.ok) {
              const json = await res.json();
              const twitterData = json?.data as Record<string, string> | undefined;
              if (twitterData?.profile_image_url) {
                // Use higher-res version (_normal → _400x400)
                const imageUrl = twitterData.profile_image_url.replace("_normal", "_400x400");
                await db.user.update({
                  where: { id: token.userId as string },
                  data: {
                    image: imageUrl,
                    ...(twitterData.name ? { name: twitterData.name } : {}),
                  },
                });
                token.picture = imageUrl;
              }
            }
          } catch { /* ignore — image stays as-is */ }
          token.imageRefreshedAt = Date.now();
        }
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
