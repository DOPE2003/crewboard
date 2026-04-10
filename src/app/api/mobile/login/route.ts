import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const user = await db.user.findFirst({
      where: { email: email.toLowerCase() },
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
        portfolioItems: true,
        telegramHandle: true,
        githubHandle: true,
        website: true,
      },
    });

    if (!user?.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Don't send passwordHash to the client
    const { passwordHash, ...profile } = user;

    return NextResponse.json({ ok: true, user: profile });
  } catch (err) {
    console.error("Mobile login error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
