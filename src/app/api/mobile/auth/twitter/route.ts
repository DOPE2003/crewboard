/**
 * GET  /api/mobile/auth/twitter
 *   Returns a Twitter OAuth 2.0 PKCE authorize URL for the iOS app to open
 *   in ASWebAuthenticationSession.  The signed `state` encodes the
 *   code_verifier so no server-side storage is needed.
 *
 *   200  { data: { authorizeUrl, state, redirectUri } }
 *
 * POST /api/mobile/auth/twitter
 *   Accepts a Twitter OAuth 2.0 Bearer access-token already obtained by the
 *   iOS app (legacy / custom PKCE flow).
 *
 *   Body  { accessToken: string }
 *   200   { data: { token, user } }
 *   401   { error: "Twitter token invalid." }
 *   429   { error: "Too many requests." }
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { signMobileJWT } from "../../_lib/jwt";
import { ok, err } from "../../_lib/response";
import { rateLimit, clientIp } from "../../_lib/rate-limit";
import { sendWelcomeEmail } from "@/lib/email"; // used by upsertTwitterUser
import {
  generateCodeVerifier,
  generateCodeChallenge,
  makeSignedState,
  mobileRedirectUri,
} from "./_pkce";

export interface TwitterUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
}

export async function fetchTwitterUser(accessToken: string): Promise<TwitterUser | null> {
  const res = await fetch(
    "https://api.twitter.com/2/users/me?user.fields=id,name,username,profile_image_url",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data ?? null;
}

export async function upsertTwitterUser(twitterUser: TwitterUser) {
  const handle = twitterUser.username.toLowerCase();
  const image  = twitterUser.profile_image_url
    ? twitterUser.profile_image_url.replace("_normal", "_400x400")
    : undefined;

  let dbUser: { id: string; twitterHandle: string; role: string; profileComplete: boolean; name: string | null; email: string | null; isOG: boolean } | null = null;

  try {
    const upserted = await db.user.upsert({
      where: { twitterId: twitterUser.id },
      update: {
        name: twitterUser.name ?? undefined,
        image: image ?? undefined,
        twitterHandle: handle,
        emailVerified: new Date(),
      },
      create: {
        twitterId: twitterUser.id,
        twitterHandle: handle,
        name: twitterUser.name,
        image,
        emailVerified: new Date(),
      },
      select: { id: true, twitterHandle: true, role: true, profileComplete: true, name: true, email: true, isOG: true },
    });
    dbUser = upserted;

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
    if (e?.code === "P2002") {
      const existing = await db.user.update({
        where: { twitterHandle: handle },
        data: {
          twitterId: twitterUser.id,
          name: twitterUser.name ?? undefined,
          image: image ?? undefined,
        },
        select: { id: true, twitterHandle: true, role: true, profileComplete: true, name: true, email: true, isOG: true },
      });
      dbUser = existing;
    } else {
      throw e;
    }
  }

  return dbUser;
}

// ─── GET — return PKCE authorize URL ─────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!rateLimit(`tw-authorize:${clientIp(req)}`, 20, 60_000)) {
    return err("Too many requests.", 429);
  }

  const clientId = process.env.TWITTER_CLIENT_ID;
  if (!clientId) return err("Twitter OAuth not configured.", 503);

  const codeVerifier   = generateCodeVerifier();
  const codeChallenge  = generateCodeChallenge(codeVerifier);
  const state          = makeSignedState(codeVerifier);
  const redirectUri    = mobileRedirectUri();

  const authorizeUrl =
    `https://twitter.com/i/oauth2/authorize` +
    `?response_type=code` +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent("tweet.read users.read offline.access")}` +
    `&state=${encodeURIComponent(state)}` +
    `&code_challenge=${encodeURIComponent(codeChallenge)}` +
    `&code_challenge_method=S256`;

  return ok({ authorizeUrl, state, redirectUri });
}

// ─── POST — accept access-token (legacy / custom PKCE) ───────────────────────

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

    const dbUser = await upsertTwitterUser(twitterUser);
    if (!dbUser) return err("Could not resolve user.", 500);

    const token = await signMobileJWT({
      sub: dbUser.id,
      handle: dbUser.twitterHandle,
      role: dbUser.role,
    });

    db.user.update({ where: { id: dbUser.id }, data: { lastSeenAt: new Date() } }).catch(() => {});

    const fullUser = await db.user.findUnique({
      where: { id: dbUser.id },
      select: {
        id: true, twitterHandle: true, name: true, email: true, image: true,
        role: true, profileComplete: true, isOG: true, bio: true, userTitle: true,
        skills: true, availability: true, walletAddress: true, humanVerified: true,
        githubHandle: true, telegramHandle: true, linkedinHandle: true,
        discordHandle: true, website: true, bannerImage: true, emailVerified: true,
      },
    });

    const { emailVerified, ...userRest } = fullUser ?? {} as any;
    return ok({ token, user: { ...userRest, emailVerified: !!emailVerified } });
  } catch (e) {
    console.error("[mobile/auth/twitter]", e);
    return err("Something went wrong.", 500);
  }
}
