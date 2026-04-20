import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/db";
import { notifyUser } from "@/lib/notify";

// Sends an in-app notification + email to every user asking them to update their role.
// Auth: session role=ADMIN OR x-admin-secret header.
// Safe to call multiple times — skips users who already have this notification.
export async function POST(req: NextRequest) {
  const session = await auth();
  const isAdminSession = (session?.user as any)?.role === "ADMIN";
  const secret = req.headers.get("x-admin-secret");
  const isAdminSecret = secret && secret === process.env.ADMIN_SECRET;

  if (!isAdminSession && !isAdminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const NOTIF_TYPE = "role_update_required";

  // Fetch all users
  const allUsers = await db.user.findMany({
    select: { id: true },
  });

  // Skip users who already received this notification
  const alreadyNotified = await db.notification.findMany({
    where: { type: NOTIF_TYPE },
    select: { userId: true },
  });
  const alreadySet = new Set(alreadyNotified.map((n) => n.userId));

  const toNotify = allUsers.filter((u) => !alreadySet.has(u.id));

  if (toNotify.length === 0) {
    return NextResponse.json({ message: "All users already notified.", count: 0 });
  }

  await Promise.all(
    toNotify.map((u) =>
      notifyUser({
        userId: u.id,
        type: NOTIF_TYPE,
        title: "Please update your role",
        body: "We updated our categories. Visit your profile settings to re-select your role so clients can find you.",
        link: "/settings",
      }).catch(() => {})
    )
  );

  return NextResponse.json({
    message: `Notified ${toNotify.length} users.`,
    count: toNotify.length,
  });
}
