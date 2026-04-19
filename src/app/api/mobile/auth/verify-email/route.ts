/**
 * POST /api/mobile/auth/verify-email
 *
 * Called by the iOS app after the user taps the verification link deep-link
 * (crewboard://verify-email?token=<token>) or by the web /verify-email page.
 *
 * Body  { "token": "<hex token>" }
 * 200   { "ok": true }
 * 400   { "error": "invalid_token" }   — missing/malformed
 * 410   { "error": "token_expired" }   — valid but expired
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { ok, err } from "../../_lib/response";

export async function POST(req: NextRequest) {
  let token: string;
  try {
    const body = await req.json();
    token = (body?.token ?? "").toString().trim();
  } catch {
    return err("invalid_token", 400);
  }

  if (!token) return err("invalid_token", 400);

  const record = await db.emailVerifyToken.findUnique({
    where: { token },
    select: { userId: true, expiresAt: true },
  });

  if (!record) return err("invalid_token", 400);

  if (record.expiresAt < new Date()) {
    await db.emailVerifyToken.delete({ where: { token } }).catch(() => {});
    return err("token_expired", 410);
  }

  await db.user.update({
    where: { id: record.userId },
    data: { emailVerified: new Date() },
  });
  await db.emailVerifyToken.delete({ where: { token } }).catch(() => {});

  return ok({ message: "Email verified." });
}
