/**
 * POST /api/mobile/auth/set-password
 *
 * Lets any authenticated user (Twitter/Apple/email) set or change their
 * account password, enabling email+password login afterwards.
 *
 * Auth:  Bearer <mobile JWT>
 * Body:  { password: string; currentPassword?: string }
 *
 * - If the account already has a password, `currentPassword` is required.
 * - If the account has no password yet (OAuth-only), `currentPassword` is ignored.
 *
 * 200   { data: { message: "Password updated." } }
 * 400   { error }
 * 401   { error: "Current password is incorrect." }
 */
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { withMobileAuth, MobileTokenPayload } from "../../_lib/auth";
import { ok, err } from "../../_lib/response";

async function handler(req: NextRequest, user: MobileTokenPayload) {
  try {
    const body = await req.json().catch(() => ({}));
    const { password, currentPassword } = body as {
      password?: string;
      currentPassword?: string;
    };

    if (!password || password.length < 8) {
      return err("Password must be at least 8 characters.");
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.sub },
      select: { id: true, passwordHash: true },
    });

    if (!dbUser) return err("User not found.", 404);

    // If account already has a password, require the current one
    if (dbUser.passwordHash) {
      if (!currentPassword) {
        return err("currentPassword is required to change an existing password.");
      }
      const valid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
      if (!valid) return err("Current password is incorrect.", 401);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await db.user.update({
      where: { id: user.sub },
      data: { passwordHash },
    });

    return ok({ message: "Password updated." });
  } catch (e) {
    console.error("[mobile/auth/set-password]", e);
    return err("Something went wrong.", 500);
  }
}

export const POST = withMobileAuth(handler);
