/**
 * POST /api/mobile/login
 *
 * Email + password login.
 * Returns a long-lived JWT the iOS app stores securely (Keychain) and sends as
 * `Authorization: Bearer <token>` on every subsequent request.
 *
 * Body  { email: string; password: string }
 * 200   { data: { token, user } }
 * 400   { error }
 * 401   { error: "Invalid credentials." }
 * 429   { error: "Too many requests." }
 */
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { signMobileJWT } from "../_lib/jwt";
import { ok, err } from "../_lib/response";
import { rateLimit, clientIp } from "../_lib/rate-limit";

export async function POST(req: NextRequest) {
  // 10 attempts / minute per IP
  if (!rateLimit(`login:${clientIp(req)}`, 10, 60_000)) {
    return err("Too many requests. Please wait a moment before trying again.", 429);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email = (body?.email as string | undefined)?.toLowerCase().trim();
    const password = body?.password as string | undefined;

    if (!email || !password) {
      return err("email and password are required.");
    }

    const user = await db.user.findFirst({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        name: true,
        twitterHandle: true,
        image: true,
        userTitle: true,
        bio: true,
        skills: true,
        availability: true,
        walletAddress: true,
        profileComplete: true,
        isOG: true,
        humanVerified: true,
        role: true,
        bannerImage: true,
        githubHandle: true,
        telegramHandle: true,
        linkedinHandle: true,
        discordHandle: true,
        website: true,
      },
    });

    if (!user?.passwordHash) {
      return err("Invalid credentials.", 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return err("Invalid credentials.", 401);
    }

    const token = await signMobileJWT({
      sub: user.id,
      handle: user.twitterHandle,
      role: user.role,
    });

    // fire-and-forget
    db.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } }).catch(() => {});

    const { passwordHash: _ph, ...profile } = user;

    return ok({ token, user: profile });
  } catch (e) {
    console.error("[mobile/login]", e);
    return err("Something went wrong.", 500);
  }
}
