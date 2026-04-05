"use server";

import db from "@/lib/db";

export async function searchBuilders(q: string) {
  const query = q.trim();
  if (query.length < 2) return [];

  const users = await db.user.findMany({
    where: {
      profileComplete: true,
      OR: [
        { name:          { contains: query, mode: "insensitive" } },
        { twitterHandle: { contains: query, mode: "insensitive" } },
        { userTitle:     { contains: query, mode: "insensitive" } },
        { bio:           { contains: query, mode: "insensitive" } },
      ],
    },
    select: { name: true, twitterHandle: true, image: true, userTitle: true },
    take: 6,
    orderBy: { createdAt: "desc" },
  });

  return JSON.parse(JSON.stringify(users));
}
