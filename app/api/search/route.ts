import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) return NextResponse.json([]);

  const users = await db.user.findMany({
    where: {
      profileComplete: true,
      OR: [
        { name:          { contains: q, mode: "insensitive" } },
        { twitterHandle: { contains: q, mode: "insensitive" } },
        { role:          { contains: q, mode: "insensitive" } },
        { bio:           { contains: q, mode: "insensitive" } },
      ],
    },
    select: { name: true, twitterHandle: true, image: true, role: true },
    take: 6,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}
