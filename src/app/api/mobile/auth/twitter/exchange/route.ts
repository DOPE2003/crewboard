/**
 * POST /api/mobile/auth/twitter/exchange
 *
 * Second leg of the server-side PKCE flow.
 *
 * 1. iOS calls GET /api/mobile/auth/twitter  →  { authorizeUrl, state, redirectUri }
 * 2. iOS opens authorizeUrl in ASWebAuthenticationSession with
 *    callbackURLScheme "crewboard" (or MOBILE_APP_SCHEME env).
 *    Twitter redirects to  crewboard://auth/twitter/callback?code=xxx&state=yyy
 * 3. iOS posts { code, state } here.  Backend exchanges the code for an
 *    access token (keeping TWITTER_CLIENT_SECRET server-side), upserts the
 *    user, and returns a mobile JWT.
 *
 * Body  { code: string, state: string }
 * 200   { data: { token, user } }
 * 400   { error }
 * 401   { error: "Twitter token invalid or expired." }
 * 429   { error: "Too many requests." }
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { signMobileJWT } from "../../../_lib/jwt";
import { ok, err } from "../../../_lib/response";
import { rateLimit, clientIp } from "../../../_lib/rate-limit";
import { verifySignedState, mobileRedirectUri } from "../_pkce";
import { fetchTwitterUser, upsertTwitterUser } from "../route";

async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
  redirectUri: string,
): Promise<string | null> {
  const clientId     = process.env.TWITTER_CLIENT_ID!;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET!;

  const body =
    `grant_type=authorization_code` +
    `&code=${encodeURIComponent(code)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&code_verifier=${encodeURIComponent(codeVerifier)}` +
    `&client_id=${encodeURIComponent(clientId)}`;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://api.twitter.com/2/oauth2/token", {
    method:  "POST",
    headers: {
      "Content-Type":  "application/x-www-form-urlencoded",
      "Authorization": `Basic ${credentials}`,
    },
    body,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[mobile/auth/twitter/exchange] token exchange failed:", res.status, detail);
    return null;
  }

  const json = await res.json();
  return (json?.access_token as string) ?? null;
}

export async function POST(req: NextRequest) {
  if (!rateLimit(`tw-exchange:${clientIp(req)}`, 10, 60_000)) {
    return err("Too many requests.", 429);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { code, state } = body as { code?: string; state?: string };

    if (!code)  return err("code is required.");
    if (!state) return err("state is required.");

    const stateData = verifySignedState(state);
    if (!stateData) return err("Invalid or expired state.", 401);

    const redirectUri   = mobileRedirectUri();
    const accessToken   = await exchangeCodeForToken(code, stateData.cv, redirectUri);
    if (!accessToken)   return err("Twitter token exchange failed.", 401);

    const twitterUser = await fetchTwitterUser(accessToken);
    if (!twitterUser?.id) return err("Twitter token invalid or expired.", 401);

    const dbUser = await upsertTwitterUser(twitterUser);
    if (!dbUser) return err("Could not resolve user.", 500);

    const token = await signMobileJWT({
      sub:    dbUser.id,
      handle: dbUser.twitterHandle,
      role:   dbUser.role,
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
    console.error("[mobile/auth/twitter/exchange]", e);
    return err("Something went wrong.", 500);
  }
}
