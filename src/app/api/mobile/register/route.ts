/**
 * POST /api/mobile/register
 *
 * Email + password registration.  Mirrors /api/auth/register but returns a
 * JWT immediately so the iOS user lands on the home screen without a second
 * login step.
 *
 * Body  { handle: string; email: string; password: string; name?: string }
 * 200   { data: { token, user } }
 * 400   { error }
 * 409   { error: "Handle / email taken." }
 * 429   { error: "Too many requests." }
 */
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { signMobileJWT } from "../_lib/jwt";
import { ok, err } from "../_lib/response";
import { rateLimit, clientIp } from "../_lib/rate-limit";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  // 5 registrations / minute per IP
  if (!rateLimit(`register:${clientIp(req)}`, 5, 60_000)) {
    return err("Too many requests. Please wait a moment before trying again.", 429);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const handle   = (body?.handle   as string | undefined)?.toLowerCase().trim();
    const email    = (body?.email    as string | undefined)?.toLowerCase().trim();
    const password = body?.password  as string | undefined;
    const name     = (body?.name     as string | undefined)?.trim() || handle;

    if (!handle || !email || !password) {
      return err("handle, email and password are required.");
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(handle)) {
      return err("Handle must be 3–20 characters (letters, numbers, underscores).");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return err("Invalid email address.");
    }
    if (password.length < 8) {
      return err("Password must be at least 8 characters.");
    }

    const [existingHandle, existingEmail] = await Promise.all([
      db.user.findUnique({ where: { twitterHandle: handle }, select: { id: true } }),
      db.user.findFirst({ where: { email }, select: { id: true } }),
    ]);

    if (existingHandle) return err("That handle is already taken.", 409);
    if (existingEmail)  return err("An account with that email already exists.", 409);

    const passwordHash = await bcrypt.hash(password, 12);
    const userCount    = await db.user.count();

    const user = await db.user.create({
      data: {
        twitterHandle: handle,
        email,
        passwordHash,
        name: name ?? handle,
        isOG: userCount < 20,
      },
      select: {
        id: true, twitterHandle: true, name: true, email: true,
        image: true, role: true, profileComplete: true, isOG: true,
      },
    });

    // Welcome notification + email (fire-and-forget)
    db.notification.create({
      data: {
        userId: user.id,
        type: "welcome",
        title: "Welcome to Crewboard!",
        body: "Your account is set up. Complete your profile to appear in the freelancer directory.",
      },
    }).catch(() => {});

    sendWelcomeEmail({ to: email, name: user.name ?? handle, handle }).catch(() => {});

    const token = await signMobileJWT({
      sub: user.id,
      handle: user.twitterHandle,
      role: user.role,
    });

    return ok({ token, user });
  } catch (e) {
    console.error("[mobile/register]", e);
    return err("Something went wrong.", 500);
  }
}
