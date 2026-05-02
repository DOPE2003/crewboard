import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/db";
import { notifyUser } from "@/lib/notify";

// One-time endpoint: grants OG badge to first 20 users and notifies them.
// Auth: session role=ADMIN OR x-admin-secret header.
export async function POST(req: NextRequest) {
  const session = await auth();
  const isAdminSession = (session?.user as any)?.role === "ADMIN";
  const secret = req.headers.get("x-admin-secret");
  const isAdminSecret = secret && secret === process.env.ADMIN_SECRET;

  if (!isAdminSession && !isAdminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get first 20 users by sign-up date
  const ogUsers = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    take: 20,
    select: { id: true, name: true, twitterHandle: true, isOG: true },
  });

  const toGrant = ogUsers.filter((u) => !u.isOG);

  if (toGrant.length === 0) {
    return NextResponse.json({ message: "All OG users already granted.", count: 0 });
  }

  // Grant badge
  await db.user.updateMany({
    where: { id: { in: toGrant.map((u) => u.id) } },
    data: { isOG: true },
  });

  // Notify each user — notifyUser sends in-app notification + email
  await Promise.all(
    toGrant.map((u) =>
      notifyUser({
        userId: u.id,
        type: "og_badge",
        title: "You earned the OG Badge",
        body: "You're one of the first 20 builders on Crewboard. Your OG badge is now live on your profile.",
        link: `/u/${u.twitterHandle}`,
      }).catch(() => {})
    )
  );

  return NextResponse.json({
    message: `OG badge granted to ${toGrant.length} users.`,
    users: toGrant.map((u) => u.twitterHandle),
  });
}
