import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/db";

// One-time endpoint: grants OG badge to first 20 users and notifies them.
// Protected by ADMIN_SECRET env var.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (!secret || secret !== process.env.ADMIN_SECRET) {
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

  // Send notification to each
  await db.notification.createMany({
    data: toGrant.map((u) => ({
      userId: u.id,
      type: "og_badge",
      title: "You earned the OG Badge",
      body: "You're one of the first 20 builders on Crewboard. Your OG badge is now live on your profile.",
    })),
  });

  return NextResponse.json({
    message: `OG badge granted to ${toGrant.length} users.`,
    users: toGrant.map((u) => u.twitterHandle),
  });
}
