import { auth } from "@/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // session.user.userId = token.userId = the internal DB CUID we set in the jwt callback.
  // This is more reliable than token.sub which may differ from account.providerAccountId.
  const userId = session.user.userId;
  if (!userId) {
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

  if (!bio || !bio.trim()) {
    return NextResponse.json({ error: "Bio is required." }, { status: 400 });
  }

  if (bio.length > 200) {
    return NextResponse.json({ error: "Bio must be 200 characters or less." }, { status: 400 });
  }

  // User is guaranteed to exist — signIn callback upserts them on every login.
  await db.user.update({
    where: { id: userId },
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
