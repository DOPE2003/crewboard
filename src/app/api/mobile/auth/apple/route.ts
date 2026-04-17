/**
 * POST /api/mobile/auth/apple
 *
 * Accepts an `identityToken` (a JWT) from Apple's Sign in with Apple SDK on iOS.
 * Verifies it against Apple's public JWKS, then finds or creates the user.
 *
 * Apple only sends `email` and `fullName` on the FIRST sign-in.  For returning
 * users those fields are absent — we fall back to the stored values.
 *
 * Required env var: APPLE_BUNDLE_ID  (e.g. "com.crewboard.app")
 *
 * Body  {
 *   identityToken: string;    // JWT from ASAuthorizationAppleIDCredential
 *   fullName?: string;        // only on first sign-in
 *   email?: string;           // only on first sign-in
 * }
 * 200   { data: { token, user } }
 * 400   { error }
 * 401   { error: "Apple token invalid." }
 * 429   { error: "Too many requests." }
 */
import { NextRequest } from "next/server";
import { createRemoteJWKSet, jwtVerify } from "jose";
import db from "@/lib/db";
import { signMobileJWT } from "../../_lib/jwt";
import { ok, err } from "../../_lib/response";
import { rateLimit, clientIp } from "../../_lib/rate-limit";
import { sendWelcomeEmail } from "@/lib/email";

// Apple's public keys endpoint — cached by jose automatically
const APPLE_JWKS = createRemoteJWKSet(
  new URL("https://appleid.apple.com/auth/keys")
);

interface AppleClaims {
  sub: string;
  email?: string;
  email_verified?: boolean;
}

async function verifyAppleToken(identityToken: string): Promise<AppleClaims> {
  const bundleId = process.env.APPLE_BUNDLE_ID;
  if (!bundleId) throw new Error("APPLE_BUNDLE_ID env var not set.");

  const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
    issuer: "https://appleid.apple.com",
    audience: bundleId,
  });

  if (!payload.sub) throw new Error("Missing sub in Apple token.");

  return {
    sub: payload.sub as string,
    email: payload.email as string | undefined,
    email_verified: payload.email_verified as boolean | undefined,
  };
}

/** Derive a stable handle from an Apple sub.  Apple subs look like
 *  "001234.abcdef1234567890.0123" — we take the middle segment. */
function handleFromAppleSub(sub: string): string {
  const parts = sub.split(".");
  const segment = (parts[1] ?? parts[0] ?? sub).slice(0, 15).toLowerCase();
  return `ap_${segment}`;
}

export async function POST(req: NextRequest) {
  if (!rateLimit(`apple-auth:${clientIp(req)}`, 10, 60_000)) {
    return err("Too many requests.", 429);
  }

  try {
    const body = await req.json().catch(() => ({}));
    // Accept both camelCase (identityToken) and snake_case (identity_token)
    const identityToken: string | undefined =
      body.identityToken ?? body.identity_token;
    const bodyEmail: string | undefined =
      body.email;
    // fullName may arrive as a string OR as { givenName?, familyName? } from Swift
    const rawFullName = body.fullName ?? body.full_name;
    const fullName: string | undefined =
      typeof rawFullName === "string"
        ? rawFullName || undefined
        : rawFullName && typeof rawFullName === "object"
          ? [rawFullName.givenName, rawFullName.familyName].filter(Boolean).join(" ") || undefined
          : undefined;

    if (!identityToken) {
      return err("identityToken is required.");
    }

    let claims: AppleClaims;
    try {
      claims = await verifyAppleToken(identityToken);
    } catch {
      return err("Apple token invalid or expired.", 401);
    }

    // Apple's sub is the stable unique ID for this user
    const appleId = `apple:${claims.sub}`;

    // Email from Apple claims (first sign-in) OR from body (iOS passes it separately)
    const email = claims.email?.toLowerCase() || bodyEmail?.toLowerCase() || undefined;

    // Try to find existing user by their stored twitterId (we repurpose the
    // twitterId field as a generic "external provider ID" — Apple IDs are
    // prefixed with "apple:" so they never collide with real Twitter IDs).
    let dbUser = await db.user.findFirst({
      where: { twitterId: appleId },
      select: { id: true, twitterHandle: true, role: true, profileComplete: true },
    });

    const isNew = !dbUser;

    if (!dbUser) {
      // Try to match on email if available (user may have a Credentials account)
      if (email) {
        const byEmail = await db.user.findFirst({
          where: { email },
          select: { id: true, twitterHandle: true, role: true, profileComplete: true },
        });
        if (byEmail) {
          // Link Apple ID to existing account
          await db.user.update({
            where: { id: byEmail.id },
            data: { twitterId: appleId },
          });
          dbUser = byEmail;
        }
      }

      if (!dbUser) {
        // Create a brand-new user
        const baseHandle = handleFromAppleSub(claims.sub);
        // Ensure handle uniqueness
        let handle = baseHandle;
        let suffix = 0;
        while (await db.user.findUnique({ where: { twitterHandle: handle }, select: { id: true } })) {
          suffix += 1;
          handle = `${baseHandle}${suffix}`;
        }

        const userCount = await db.user.count();

        const created = await db.user.create({
          data: {
            twitterId: appleId,
            twitterHandle: handle,
            name: fullName?.trim() || handle,
            email: email ?? undefined,
            isOG: userCount < 20,
          },
          select: { id: true, twitterHandle: true, role: true, profileComplete: true, name: true, email: true },
        });

        db.notification.create({
          data: {
            userId: created.id,
            type: "welcome",
            title: "Welcome to Crewboard!",
            body: "Complete your profile to appear in the freelancer directory.",
          },
        }).catch(() => {});

        if (created.email) {
          sendWelcomeEmail({
            to: created.email,
            name: created.name ?? handle,
            handle,
          }).catch(() => {});
        }

        dbUser = created;
      }
    }

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
        discordHandle: true, website: true, bannerImage: true,
      },
    });

    return ok({ token, user: fullUser, isNewUser: isNew });
  } catch (e) {
    console.error("[mobile/auth/apple]", e);
    return err("Something went wrong.", 500);
  }
}
