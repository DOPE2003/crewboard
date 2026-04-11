import { requireModerator } from "@/lib/auth-utils";
import db from "@/lib/db";
import Link from "next/link";
import { ShowcaseDeleteButton } from "./ShowcaseActions";

export default async function AdminShowcasePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  await requireModerator();
  const { category = "all" } = await searchParams;

  const posts = await db.showcasePost.findMany({
    where: category !== "all" ? { category } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true, twitterHandle: true, image: true } },
      _count: { select: { interactions: true } },
    },
  });

  const categories = ["all", ...Array.from(new Set(posts.map((p) => p.category)))];

  return (
    <main className="page" style={{ background: "var(--background)", minHeight: "100vh" }}>
      <div className="admin-content">

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
          <div>
            <div style={{ fontSize: "0.6rem", letterSpacing: "0.2em", color: "#ef4444", marginBottom: "0.5rem", fontWeight: 700 }}>— MODERATION</div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--foreground)" }}>Showcase Queue</h1>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 4 }}>{posts.length} posts</p>
          </div>
          <Link href="/admin" style={{ fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "none", fontWeight: 600 }}>← Dashboard</Link>
        </div>

        {/* Category tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {categories.map((c) => (
            <Link key={c} href={`/admin/showcase?category=${c}`} style={{
              padding: "6px 14px", borderRadius: 99, fontSize: "0.75rem", fontWeight: 700,
              textDecoration: "none",
              background: category === c ? "#14b8a6" : "var(--card-bg)",
              color: category === c ? "#fff" : "var(--text-muted)",
              border: "1px solid var(--card-border)",
            }}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </Link>
          ))}
        </div>

        {/* Grid of post cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {posts.map((post) => (
            <div key={post.id} style={{
              background: "var(--card-bg)", borderRadius: 14, border: "1px solid var(--card-border)",
              overflow: "hidden", display: "flex", flexDirection: "column",
            }}>
              {/* Preview */}
              {post.mediaType === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.mediaUrl} alt={post.title} style={{ width: "100%", height: 160, objectFit: "cover" }} />
              ) : (
                <div style={{ height: 160, background: "#0f0f0f", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 32 }}>▶</span>
                </div>
              )}

              <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Title + category */}
                <div>
                  <div style={{ fontWeight: 700, color: "var(--foreground)", fontSize: "0.9rem", marginBottom: 4 }}>{post.title}</div>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "rgba(20,184,166,0.1)", color: "#14b8a6" }}>
                    {post.category}
                  </span>
                </div>

                {/* Author */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {post.user.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.user.image} alt="" style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }} />
                  )}
                  <Link href={`/u/${post.user.twitterHandle}`} style={{ fontSize: "0.8rem", color: "#14b8a6", textDecoration: "none", fontWeight: 600 }}>
                    @{post.user.twitterHandle}
                  </Link>
                </div>

                {/* Stats */}
                <div style={{ display: "flex", gap: 14, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  <span>{post.views} views</span>
                  <span>{post._count.interactions} interactions</span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Action */}
                <div style={{ marginTop: "auto", paddingTop: 8, borderTop: "1px solid var(--card-border)", display: "flex", justifyContent: "flex-end" }}>
                  <ShowcaseDeleteButton postId={post.id} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {posts.length === 0 && (
          <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>No posts found.</div>
        )}
      </div>
    </main>
  );
}
