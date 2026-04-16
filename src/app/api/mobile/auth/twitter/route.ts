/**
 * POST /api/mobile/auth/twitter
 *
 * Accepts a Twitter OAuth 2.0 Bearer access-token obtained by the iOS app
 * via Sign in with Twitter (PKCE flow).  We verify it with the Twitter v2 API,
 * then find-or-create the user exactly like the web signIn callback does.
 *
 * Body  { accessToken: string }
 * 200   { data: { token, user } }
 * 400   { error }
 * 401   { error: "Twitter token invalid." }
 * 429   { error: "Too many requests." }
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { signMobileJWT } from "../../_lib/jwt";
import { ok, err } from "../../_lib/response";
import { rateLimit, clientIp } from "../../_lib/rate-limit";
import { sendWelcomeEmail } from "@/lib/email";

interface TwitterUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
}

async function fetchTwitterUser(accessToken: string): Promise<TwitterUser | null> {
  const res = await fetch(
    "https://api.twitter.com/2/users/me?user.fields=id,name,username,profile_image_url",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data ?? null;
}

export async function POST(req: NextRequest) {
  if (!rateLimit(`tw-auth:${clientIp(req)}`, 10, 60_000)) {
    return err("Too many requests.", 429);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const accessToken = body?.accessToken as string | undefined;

    if (!accessToken) {
      return err("accessToken is required.");
    }

    const twitterUser = await fetchTwitterUser(accessToken);
    if (!twitterUser?.id) {
      return err("Twitter token invalid or expired.", 401);
    }

    const handle = twitterUser.username.toLowerCase();
    const image  = twitterUser.profile_image_url
      ? twitterUser.profile_image_url.replace("_normal", "_400x400")
      : undefined;

    let dbUser: { id: string; twitterHandle: string; role: string; profileComplete: boolean } | null = null;

    try {
      const upserted = await db.user.upsert({
        where: { twitterId: twitterUser.id },
        update: {
          name: twitterUser.name ?? undefined,
          image: image ?? undefined,
          twitterHandle: handle,
        },
        create: {
          twitterId: twitterUser.id,
          twitterHandle: handle,
          name: twitterUser.name,
          image,
        },
        select: { id: true, twitterHandle: true, role: true, profileComplete: true, name: true, email: true, isOG: true },
      });
      dbUser = upserted;

      // Welcome notification for brand-new users
      if (!upserted.profileComplete) {
        db.notification.create({
          data: {
            userId: upserted.id,
            type: "welcome",
            title: "Welcome to Crewboard!",
            body: "Complete your profile to appear in the freelancer directory.",
          },
        }).catch(() => {});

        if (upserted.email) {
          sendWelcomeEmail({ to: upserted.email, name: upserted.name ?? handle, handle }).catch(() => {});
        }
      }
    } catch (e: any) {
      // P2002: handle already taken by a different user — link twitterId to existing
      if (e?.code === "P2002") {
        const existing = await db.user.update({
          where: { twitterHandle: handle },
          data: {
            twitterId: twitterUser.id,
            name: twitterUser.name ?? undefined,
            image: image ?? undefined,
          },
          select: { id: true, twitterHandle: true, role: true, profileComplete: true },
        });
        dbUser = existing;
      } else {
        throw e;
      }
    }

    if (!dbUser) return err("Could not resolve user.", 500);

    const token = await signMobileJWT({
      sub: dbUser.id,
      handle: dbUser.twitterHandle,
      role: dbUser.role,
    });

    db.user.update({ where: { id: dbUser.id }, data: { lastSeenAt: new Date() } }).catch(() => {});

    // Return full profile so iOS can bootstrap immediately
    const fullUser = await db.user.findUnique({
      where: { id: dbUser.id },
      select: {
        id: true, twitterHandle: true, name: true, email: true, image: true,
        role: true, profileComplete: true, isOG: true, bio: true, userTitle: true,
        skills: true, availability: true, walletAddress: true, humanVerified: true,
        githubHandle: true, telegramHandle: true, linkedinHandle: true,
        discordHandle: true, website: true, bannerImage: true,
      },
    });

    return ok({ token, user: fullUser });
  } catch (e) {
    console.error("[mobile/auth/twitter]", e);
    return err("Something went wrong.", 500);
  }
}
