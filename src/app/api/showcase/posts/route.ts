import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/db";

const PAGE_SIZE = 12;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const category = searchParams.get("category");
  const userId = searchParams.get("userId");

  const session = await auth();
  const viewerId = (session?.user as any)?.userId as string | undefined;

  try {
    const where: Record<string, unknown> = {};
    if (category && category !== "all") where.category = category;
    if (userId) where.userId = userId;
    if (cursor) where.createdAt = { lt: new Date(cursor) };

    const posts = await db.showcasePost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        description: true,
        mediaUrl: true,
        mediaType: true,
        category: true,
        tags: true,
        views: true,
        createdAt: true,
        user: {
          select: { id: true, name: true, twitterHandle: true, image: true, userTitle: true },
        },
      },
    });

    const postIds = posts.map((p) => p.id);

    const [likeCounts, saveCounts, viewerInteractions] = await Promise.all([
      db.showcaseInteraction.groupBy({
        by: ["postId"],
        where: { postId: { in: postIds }, type: "like" },
        _count: { _all: true },
      }),
      db.showcaseInteraction.groupBy({
        by: ["postId"],
        where: { postId: { in: postIds }, type: "save" },
        _count: { _all: true },
      }),
      viewerId
        ? db.showcaseInteraction.findMany({
            where: { userId: viewerId, postId: { in: postIds }, type: { in: ["like", "save"] } },
            select: { postId: true, type: true },
          })
        : Promise.resolve([]),
    ]);

    const likeMap = Object.fromEntries(likeCounts.map((r) => [r.postId, r._count._all]));
    const saveMap = Object.fromEntries(saveCounts.map((r) => [r.postId, r._count._all]));
    const likedSet = new Set(viewerInteractions.filter((i) => i.type === "like").map((i) => i.postId));
    const savedSet = new Set(viewerInteractions.filter((i) => i.type === "save").map((i) => i.postId));

    const result = posts.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      mediaUrl: p.mediaUrl,
      mediaType: p.mediaType,
      category: p.category,
      tags: p.tags,
      views: p.views,
      createdAt: p.createdAt.toISOString(),
      user: p.user,
      likeCount: likeMap[p.id] ?? 0,
      saveCount: saveMap[p.id] ?? 0,
      liked: likedSet.has(p.id),
      saved: savedSet.has(p.id),
    }));

    const nextCursor =
      posts.length === PAGE_SIZE ? posts[posts.length - 1].createdAt.toISOString() : null;

    return NextResponse.json({ posts: result, nextCursor });
  } catch (err: any) {
    console.error("[showcase/posts GET]", err);
    return NextResponse.json({ error: "Failed to fetch posts." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { title, description, mediaUrl, mediaType, category, tags } = body;

    if (!title?.trim()) return NextResponse.json({ error: "Title is required." }, { status: 400 });
    if (!mediaUrl) return NextResponse.json({ error: "Media is required." }, { status: 400 });
    if (!category) return NextResponse.json({ error: "Category is required." }, { status: 400 });

    const post = await db.showcasePost.create({
      data: {
        userId,
        title: title.trim(),
        description: description?.trim() || null,
        mediaUrl,
        mediaType: mediaType ?? "image",
        category,
        tags: Array.isArray(tags) ? tags : [],
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (err: any) {
    console.error("[showcase/posts POST]", err);
    return NextResponse.json({ error: "Failed to create post." }, { status: 500 });
  }
}
