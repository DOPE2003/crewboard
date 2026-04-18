/**
 * POST /api/mobile/auth/reset-password
 *
 * Request:  { "email": "user@example.com" }
 * Response 200 (always, even for unknown email — prevents enumeration):
 *   { "ok": true, "message": "If an account exists for this email, a reset link has been sent." }
 * Response 400 (malformed email only):
 *   { "error": "invalid_email" }
 *
 * - Generates a signed 20-minute token stored in PasswordResetToken.
 * - Reset link points to: https://crewboard.fun/reset-password?token=<token>
 * - Token is single-use: the web /reset-password flow invalidates it on success.
 * - Only users with a passwordHash can reset via this flow (OAuth-only accounts skip silently).
 */
import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import db from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { ok, err } from "../../_lib/response";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://crewboard.fun";
const TOKEN_TTL_MS = 20 * 60 * 1000; // 20 minutes

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const OK_RESPONSE = ok({
  message: "If an account exists for this email, a reset link has been sent.",
});

export async function POST(req: NextRequest) {
  let email: string;
  try {
    const body = await req.json();
    email = (body?.email ?? "").toString().toLowerCase().trim();
  } catch {
    return err("invalid_email", 400);
  }

  if (!email || !EMAIL_RE.test(email)) {
    return err("invalid_email", 400);
  }

  try {
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true },
    });

    // Always return 200 — prevents email enumeration
    if (!user || !user.email || !user.passwordHash) return OK_RESPONSE;

    // Invalidate any existing tokens for this user
    await db.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const token = randomBytes(32).toString("hex");
    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });

    const resetUrl = `${BASE_URL}/reset-password?token=${token}`;
    await sendPasswordResetEmail({ to: user.email, resetUrl });

    return OK_RESPONSE;
  } catch (e) {
    console.error("[mobile/auth/reset-password]", e);
    // Still return 200 on internal errors — don't leak info
    return OK_RESPONSE;
  }
}
