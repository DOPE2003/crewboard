import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q        = searchParams.get("q")?.trim() ?? "";
  const category = searchParams.get("category")?.trim() ?? "";
  const maxPrice = parseInt(searchParams.get("maxPrice") ?? "0", 10);
  const userId   = searchParams.get("userId")?.trim() ?? "";

  const where: Record<string, unknown> = { status: "active" };

  if (q) {
    where.OR = [
      { title:       { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { tags:        { has: q } },
    ];
  }
  if (category) where.category = category;
  if (maxPrice > 0) where.price = { lte: maxPrice };
  if (userId)   where.userId = userId;

  const gigs = await db.gig.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, twitterHandle: true, image: true, role: true } },
    },
  });

  return NextResponse.json(gigs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await db.user.findUnique({ where: { id: userId }, select: { profileComplete: true } });
  if (!dbUser?.profileComplete) {
    return NextResponse.json({ error: "Complete your profile before creating a gig." }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, price, deliveryDays, category, tags } = body;

  if (!title?.trim())       return NextResponse.json({ error: "Title is required." }, { status: 400 });
  if (!description?.trim()) return NextResponse.json({ error: "Description is required." }, { status: 400 });
  if (!category?.trim())    return NextResponse.json({ error: "Category is required." }, { status: 400 });
  if (!price || price < 1)  return NextResponse.json({ error: "Price must be at least $1." }, { status: 400 });
  if (!deliveryDays || deliveryDays < 1) return NextResponse.json({ error: "Delivery days required." }, { status: 400 });

  const gig = await db.gig.create({
    data: {
      userId,
      title:       title.trim(),
      description: description.trim(),
      price:       parseInt(price, 10),
      deliveryDays: parseInt(deliveryDays, 10),
      category:    category.trim(),
      tags:        Array.isArray(tags) ? tags : [],
    },
  });

  return NextResponse.json(gig, { status: 201 });
}
