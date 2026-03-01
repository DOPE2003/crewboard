import { auth } from "@/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // session.user.id = token.sub = Twitter's own user ID, always present.
  const twitterId = session.user.id;
  if (!twitterId) {
    return NextResponse.json(
      { error: "Session expired. Please sign out and sign back in." },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { role, skills, bio, availability } = body;

  if (!role) {
    return NextResponse.json({ error: "Role is required." }, { status: 400 });
  }

  if (bio && bio.length > 200) {
    return NextResponse.json({ error: "Bio must be 200 characters or less." }, { status: 400 });
  }

  // User is guaranteed to exist — signIn callback upserts them on every login.
  await db.user.update({
    where: { twitterId },
    data: {
      role,
      skills: Array.isArray(skills) ? skills : [],
      bio: bio ?? "",
      availability: availability ?? "available",
      profileComplete: true,
    },
  });

  return NextResponse.json({ ok: true });
}
