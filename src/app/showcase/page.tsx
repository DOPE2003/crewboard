import { auth } from "@/auth";
import db from "@/lib/db";
import Link from "next/link";
import ShowcaseFeed from "./ShowcaseFeed";
import type { ShowcasePost } from "./ShowcaseFeed";

export const metadata = { title: "Showcase — Crewboard" };

const CATEGORIES = ["all", "Design", "Development", "Marketing", "Creative", "Content", "Other"];

export default async function ShowcasePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category = "all" } = await searchParams;
  const session = await auth();
  const viewerId = (session?.user as any)?.userId as string | undefined;

  const where: Record<string, unknown> = {};
  if (category !== "all") where.category = category;

  const rawPosts = await db.showcasePost
    .findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 12,
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
          select: { id: true, name: true, twitterHandle: true, image: true, role: true },
        },
      },
    })
    .catch(() => []);

  const postIds = rawPosts.map((p) => p.id);

  const [likeCounts, saveCounts, viewerInteractions] = await Promise.all([
    db.showcaseInteraction
      .groupBy({ by: ["postId"], where: { postId: { in: postIds }, type: "like" }, _count: { _all: true } })
      .catch(() => []),
    db.showcaseInteraction
      .groupBy({ by: ["postId"], where: { postId: { in: postIds }, type: "save" }, _count: { _all: true } })
      .catch(() => []),
    viewerId
      ? db.showcaseInteraction
          .findMany({
            where: { userId: viewerId, postId: { in: postIds }, type: { in: ["like", "save"] } },
            select: { postId: true, type: true },
          })
          .catch(() => [])
      : Promise.resolve([]),
  ]);

  const likeMap = Object.fromEntries(likeCounts.map((r) => [r.postId, r._count._all]));
  const saveMap = Object.fromEntries(saveCounts.map((r) => [r.postId, r._count._all]));
  const likedSet = new Set(viewerInteractions.filter((i) => i.type === "like").map((i) => i.postId));
  const savedSet = new Set(viewerInteractions.filter((i) => i.type === "save").map((i) => i.postId));

  const posts: ShowcasePost[] = rawPosts.map((p) => ({
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

  const nextCursor = posts.length === 12 ? posts[posts.length - 1].createdAt : null;

  return (
    <main style={{ minHeight: "calc(100vh - 56px)", background: "var(--bg)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.25rem" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.75rem", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: "1.625rem", fontWeight: 700, color: "var(--text)", margin: 0, letterSpacing: "-0.02em" }}>
              Showcase
            </h1>
            <p style={{ color: "var(--text-muted)", marginTop: "0.3rem", fontSize: "0.875rem" }}>
              See what Web3 builders are creating
            </p>
          </div>
          {session?.user && (
            <Link
              href="/showcase/new"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                background: "var(--teal)",
                color: "#fff",
                padding: "0.5rem 1rem",
                borderRadius: 8,
                fontSize: "0.8125rem",
                fontWeight: 600,
                textDecoration: "none",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              + Post your work
            </Link>
          )}
        </div>

        {/* Category pills */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.75rem" }}>
          {CATEGORIES.map((cat) => {
            const isActive = category === cat;
            return (
              <Link
                key={cat}
                href={cat === "all" ? "/showcase" : `/showcase?category=${encodeURIComponent(cat)}`}
                style={{
                  padding: "0.3rem 0.8rem",
                  borderRadius: 999,
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  textDecoration: "none",
                  background: isActive ? "var(--teal)" : "var(--bg-secondary)",
                  color: isActive ? "#fff" : "var(--text-muted)",
                  border: `1px solid ${isActive ? "var(--teal)" : "var(--border)"}`,
                  transition: "all 0.15s",
                }}
              >
                {cat === "all" ? "All" : cat}
              </Link>
            );
          })}
        </div>

        <ShowcaseFeed
          initialPosts={posts}
          initialNextCursor={nextCursor}
          category={category}
          loggedIn={!!session?.user}
        />
      </div>
    </main>
  );
}
