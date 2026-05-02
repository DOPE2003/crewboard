/**
 * POST /api/mobile/auth/resend-verification
 *
 * Re-sends the email verification link. Accepts either:
 *   - Authorization: Bearer <jwt>   (preferred — user is logged in)
 *   - Body: { "email": "..." }      (fallback — user restored app, no session)
 *
 * Rate-limited to 3 requests/hour per user or per email.
 * Always returns 200 except on rate-limit (anti-enumeration).
 *
 * 200   { "ok": true }
 * 429   { "error": "rate_limited" }
 */
import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import db from "@/lib/db";
import { getMobileUser } from "../../_lib/auth";
import { sendEmailVerificationEmail } from "@/lib/email";
import { rateLimit } from "../../_lib/rate-limit";
import { ok, err } from "../../_lib/response";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://crewboard.fun";
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const OK_RESPONSE = ok({ message: "If your email is on file, a verification link has been sent." });

export async function POST(req: NextRequest) {
  try {
    // Try JWT auth first
    const jwtUser = await getMobileUser(req);
    let userId: string | null = null;
    let email: string | null = null;

    if (jwtUser) {
      userId = jwtUser.sub;
    } else {
      // Fallback: email in body
      const body = await req.json().catch(() => ({}));
      const rawEmail = (body?.email ?? "").toString().toLowerCase().trim();
      if (!rawEmail || !EMAIL_RE.test(rawEmail)) return OK_RESPONSE;
      email = rawEmail;
    }

    // Rate limit by userId or email
    const rlKey = userId ? `resend-verify:u:${userId}` : `resend-verify:e:${email}`;
    if (!rateLimit(rlKey, 3, 60 * 60 * 1000)) {
      return err("rate_limited", 429);
    }

    // Resolve user
    let user: { id: string; email: string | null; emailVerified: Date | null } | null = null;
    if (userId) {
      user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, emailVerified: true },
      });
    } else if (email) {
      user = await db.user.findFirst({
        where: { email },
        select: { id: true, email: true, emailVerified: true },
      });
    }

    // Already verified, no email, or not found — return 200 silently
    if (!user || !user.email || user.emailVerified) return OK_RESPONSE;

    // Invalidate any existing token
    await db.emailVerifyToken.deleteMany({ where: { userId: user.id } });

    const token = randomBytes(32).toString("hex");
    await db.emailVerifyToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + VERIFY_TTL_MS),
      },
    });

    const verifyUrl = `${BASE_URL}/verify-email?token=${token}`;
    await sendEmailVerificationEmail({ to: user.email, verifyUrl });

    return OK_RESPONSE;
  } catch (e) {
    console.error("[mobile/auth/resend-verification]", e);
    return OK_RESPONSE;
  }
}
