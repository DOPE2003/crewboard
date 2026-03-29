import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const users = await db.user.findMany({
    where: { profileComplete: true },
    select: {
      id: true,
      name: true,
      twitterHandle: true,
      image: true,
      role: true,
      bio: true,
      skills: true,
      availability: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(users);
}
