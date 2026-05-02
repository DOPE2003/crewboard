import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";
import { notifyUser } from "@/lib/notify";

export async function POST(req: NextRequest) {
  try {
    const { handle, email, password, name, image } = await req.json();

    // Validate
    if (!handle || !email || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(handle)) {
      return NextResponse.json({ error: "Handle must be 3–20 characters (letters, numbers, underscores)." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    // Check uniqueness
    const [existingHandle, existingEmail] = await Promise.all([
      db.user.findUnique({ where: { twitterHandle: handle.toLowerCase() }, select: { id: true } }),
      db.user.findFirst({ where: { email: email.toLowerCase() }, select: { id: true } }),
    ]);
    if (existingHandle) return NextResponse.json({ error: "That handle is already taken." }, { status: 409 });
    if (existingEmail) return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 12);

    // Count users before creating to check OG eligibility
    const userCount = await db.user.count();

    const user = await db.user.create({
      data: {
        twitterHandle: handle.toLowerCase(),
        email: email.toLowerCase(),
        passwordHash,
        name: name || handle,
        image: (image && !image.startsWith("data:")) ? image : null,
        isOG: userCount < 20,
      },
      select: { id: true, isOG: true },
    });

    // Welcome notification (email handled separately by sendWelcomeEmail below)
    await db.notification.create({
      data: {
        userId: user.id,
        type: "welcome",
        title: "Welcome to Crewboard!",
        body: "Your account is set up. Complete your profile to appear in the freelancer directory.",
      },
    });

    if (user.isOG) {
      // notifyUser sends in-app + email for OG badge
      notifyUser({
        userId: user.id,
        type: "og_badge",
        title: "You're an OG!",
        body: "You joined Crewboard in the first 20 builders. You've been awarded the OG badge.",
      }).catch(() => {});
    }

    // Welcome email (richer template than generic notification email)
    await sendWelcomeEmail({ to: email.toLowerCase(), name: name || handle, handle: handle.toLowerCase() });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
