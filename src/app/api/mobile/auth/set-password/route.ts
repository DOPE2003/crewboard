/**
 * POST /api/mobile/auth/set-password
 *
 * Lets any authenticated user (Twitter/Apple/email) set or change their
 * account password, enabling email+password login afterwards.
 *
 * Auth:  Bearer <mobile JWT>
 * Body:  { password: string; currentPassword?: string; email?: string }
 *
 * - If the account already has a password, `currentPassword` is required.
 * - If the account has no password yet (OAuth-only), `currentPassword` is ignored.
 * - `email` is optional: if the account has no email yet (e.g. Apple sign-in with
 *   hidden email), supplying one here saves it so email+password login works.
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function handler(req: NextRequest, user: MobileTokenPayload) {
  try {
    const body = await req.json().catch(() => ({}));
    const { password, currentPassword } = body as {
      password?: string;
      currentPassword?: string;
    };
    const rawEmail = (body.email as string | undefined)?.toLowerCase().trim() || undefined;

    if (!password || password.length < 8) {
      return err("Password must be at least 8 characters.");
    }

    if (rawEmail && !EMAIL_RE.test(rawEmail)) {
      return err("Invalid email address.");
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.sub },
      select: { id: true, passwordHash: true, email: true },
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

    // Only save the incoming email if the account has none yet — prevents
    // overwriting a verified address but lets Apple/Twitter users add one.
    const emailToSave = !dbUser.email && rawEmail ? rawEmail : undefined;

    if (emailToSave) {
      const taken = await db.user.findFirst({
        where: { email: emailToSave },
        select: { id: true },
      });
      if (taken && taken.id !== dbUser.id) {
        return err("That email is already associated with another account.", 409);
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await db.user.update({
      where: { id: user.sub },
      data: {
        passwordHash,
        ...(emailToSave ? { email: emailToSave } : {}),
      },
    });

    return ok({ message: "Password updated." });
  } catch (e) {
    console.error("[mobile/auth/set-password]", e);
    return err("Something went wrong.", 500);
  }
}

export const POST = withMobileAuth(handler);
