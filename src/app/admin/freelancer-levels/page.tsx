import { requireOwner } from "@/lib/auth-utils";
import db from "@/lib/db";
import Link from "next/link";
import { computeFreelancerLevel, LEVEL_META } from "@/lib/freelancerLevel";

export default async function FreelancerLevelsPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; q?: string }>;
}) {
  await requireOwner();

  const { level: levelFilter = "", q = "" } = await searchParams;

  // Fetch all users with the data needed to compute level
  const users = await db.user.findMany({
    where: q
      ? {
          OR: [
            { name:          { contains: q, mode: "insensitive" } },
            { twitterHandle: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: {
      id: true,
      name: true,
      twitterHandle: true,
      image: true,
      bio: true,
      skills: true,
      walletAddress: true,
      createdAt: true,
      _count: {
        select: { gigs: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch per-user completed order count and avg rating in bulk
  const userIds = users.map((u) => u.id);

  const [completedOrderGroups, ratingGroups, gigCountGroups] = await Promise.all([
    db.order.groupBy({
      by: ["sellerId"],
      where: { sellerId: { in: userIds }, status: "completed" },
      _count: { id: true },
    }),
    db.review.groupBy({
      by: ["revieweeId"],
      where: { revieweeId: { in: userIds } },
      _avg: { rating: true },
      _count: { id: true },
    }),
    db.gig.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds } },
      _count: { id: true },
    }),
  ]);

  const completedMap = Object.fromEntries(
    completedOrderGroups.map((g) => [g.sellerId, g._count.id])
  );
  const ratingMap = Object.fromEntries(
    ratingGroups.map((g) => [g.revieweeId, { avg: g._avg.rating, count: g._count.id }])
  );
  const gigCountMap = Object.fromEntries(
    gigCountGroups.map((g) => [g.userId, g._count.id])
  );

  // Compute level for each user
  const rows = users.map((u) => {
    const gigCount = gigCountMap[u.id] ?? 0;
    const completedOrders = completedMap[u.id] ?? 0;
    const ratingData = ratingMap[u.id] ?? null;
    const avgRating = ratingData?.avg ?? null;
    const reviewCount = ratingData?.count ?? 0;

    const result = computeFreelancerLevel({
      bio: u.bio,
      image: u.image,
      skills: u.skills,
      walletAddress: u.walletAddress,
      gigCount,
      completedOrders,
      avgRating,
    });

    return { ...u, gigCount, completedOrders, avgRating, reviewCount, ...result };
  });

  // Filter by level if requested
  const filtered = levelFilter
    ? rows.filter((r) => r.level === Number(levelFilter))
    : rows;

  // Sort by points descending
  filtered.sort((a, b) => b.points - a.points);

  // Level distribution counts (unfiltered)
  const dist = [1, 2, 3, 4, 5].map((l) => ({
    level: l,
    count: rows.filter((r) => r.level === l).length,
  }));

  return (
    <main className="page" style={{ background: "var(--background)", minHeight: "100vh" }}>
      <div className="admin-content">

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2.5rem" }}>
          <div>
            <div style={{ fontFamily: "Space Mono, monospace", fontSize: "0.6rem", letterSpacing: "0.2em", color: "#14b8a6", marginBottom: "0.5rem", fontWeight: 700 }}>
              — OWNER EXCLUSIVE
            </div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--foreground)", margin: 0 }}>Freelancer Levels</h1>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
              Rankings based on profile completion, services posted, completed orders, and star ratings.
            </p>
          </div>
          <Link href="/admin" style={{ fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "none", fontWeight: 600 }}>
            ← Back to Dashboard
          </Link>
        </div>

        {/* Level distribution cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.75rem", marginBottom: "2rem" }}>
          {dist.map(({ level, count }) => {
            const meta = LEVEL_META[level];
            const active = levelFilter === String(level);
            return (
              <Link
                key={level}
                href={active ? "/admin/freelancer-levels" : `/admin/freelancer-levels?level=${level}${q ? `&q=${q}` : ""}`}
                style={{
                  textDecoration: "none",
                  background: active ? meta.bg : "var(--card-bg)",
                  border: `1px solid ${active ? meta.color : "var(--card-border)"}`,
                  borderRadius: 14,
                  padding: "1rem",
                  transition: "border-color 0.15s",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <LevelBadge level={level as 1|2|3|4|5} />
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: meta.color, fontFamily: "Space Mono, monospace" }}>
                  {count}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>{meta.desc}</div>
              </Link>
            );
          })}
        </div>

        {/* Search + filter row */}
        <form style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", alignItems: "center" }}>
          {levelFilter && <input type="hidden" name="level" value={levelFilter} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name or handle…"
            style={{
              flex: 1, padding: "0.75rem 1rem", borderRadius: 10,
              border: "1px solid var(--card-border)", background: "var(--card-bg)",
              color: "var(--foreground)", fontSize: "0.875rem", outline: "none",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "0.75rem 1.25rem", borderRadius: 10, border: "none",
              background: "#14b8a6", color: "#fff", fontWeight: 700,
              fontSize: "0.8rem", cursor: "pointer",
            }}
          >
            Search
          </button>
          {(q || levelFilter) && (
            <Link
              href="/admin/freelancer-levels"
              style={{
                padding: "0.75rem 1rem", borderRadius: 10,
                border: "1px solid var(--card-border)", background: "var(--card-bg)",
                color: "var(--text-muted)", fontSize: "0.8rem", textDecoration: "none", fontWeight: 600,
              }}
            >
              Clear
            </Link>
          )}
        </form>

        {/* Table */}
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 14, overflow: "hidden" }}>
          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr",
            padding: "0.75rem 1.25rem",
            borderBottom: "1px solid var(--card-border)",
            fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em",
            color: "var(--text-muted)", textTransform: "uppercase",
          }}>
            <span>Freelancer</span>
            <span>Level</span>
            <span>Points</span>
            <span>Profile</span>
            <span>Services</span>
            <span>Completed</span>
            <span>Avg Rating</span>
          </div>

          {filtered.length === 0 && (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
              No freelancers found.
            </div>
          )}

          {filtered.map((row, i) => {
            const meta = LEVEL_META[row.level];
            return (
              <div
                key={row.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr",
                  padding: "0.875rem 1.25rem",
                  borderBottom: i < filtered.length - 1 ? "1px solid var(--card-border)" : "none",
                  alignItems: "center",
                }}
              >
                {/* Freelancer */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {row.image ? (
                    <img
                      src={row.image}
                      alt=""
                      style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%", background: "var(--card-border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, color: "var(--text-muted)", flexShrink: 0,
                    }}>
                      {(row.name ?? row.twitterHandle ?? "?")[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <Link
                      href={`/u/${row.twitterHandle}`}
                      target="_blank"
                      style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--foreground)", textDecoration: "none" }}
                    >
                      {row.name ?? row.twitterHandle}
                    </Link>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>@{row.twitterHandle}</div>
                  </div>
                </div>

                {/* Level badge */}
                <div>
                  <LevelBadge level={row.level} />
                </div>

                {/* Points */}
                <div>
                  <PointsBar points={row.points} color={meta.color} />
                </div>

                {/* Profile breakdown */}
                <div style={{ fontSize: "0.8rem", color: "var(--foreground)", fontFamily: "Space Mono, monospace" }}>
                  {row.breakdown.profile}<span style={{ color: "var(--text-muted)", fontSize: "0.65rem" }}>/25</span>
                </div>

                {/* Services posted */}
                <div style={{ fontSize: "0.8rem", color: "var(--foreground)", fontFamily: "Space Mono, monospace" }}>
                  {row.gigCount}
                  <span style={{ color: "var(--text-muted)", fontSize: "0.65rem", marginLeft: 2 }}>gig{row.gigCount !== 1 ? "s" : ""}</span>
                </div>

                {/* Completed orders */}
                <div style={{ fontSize: "0.8rem", color: "var(--foreground)", fontFamily: "Space Mono, monospace" }}>
                  {row.completedOrders}
                  <span style={{ color: "var(--text-muted)", fontSize: "0.65rem", marginLeft: 2 }}>done</span>
                </div>

                {/* Avg rating */}
                <div style={{ fontSize: "0.8rem", color: "var(--foreground)", fontFamily: "Space Mono, monospace" }}>
                  {row.avgRating !== null ? (
                    <>
                      <span style={{ color: "#f59e0b" }}>★</span>{" "}
                      {row.avgRating.toFixed(1)}
                      <span style={{ color: "var(--text-muted)", fontSize: "0.65rem", marginLeft: 2 }}>
                        ({row.reviewCount})
                      </span>
                    </>
                  ) : (
                    <span style={{ color: "var(--text-muted)" }}>—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: "1rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          Showing {filtered.length} of {rows.length} users
        </div>

        {/* Scoring legend */}
        <div style={{ marginTop: "2rem", background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 14, padding: "1.25rem" }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "1rem" }}>
            Scoring Breakdown (max 100 pts)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
            {[
              { label: "Profile Completeness", max: 25, desc: "bio, avatar, skills, wallet — scaled to 25 pts" },
              { label: "Services Posted",       max: 25, desc: "1 gig=10 · 3 gigs=17 · 5+ gigs=25 pts" },
              { label: "Completed Orders",      max: 30, desc: "1=5 · 3=12 · 5=20 · 10+=30 pts" },
              { label: "Avg Star Rating",       max: 20, desc: "3.5★=10 · 4.0★=15 · 4.5★=20 pts" },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--foreground)" }}>{item.label}</span>
                  <span style={{ fontSize: "0.7rem", color: "#14b8a6", fontWeight: 700, fontFamily: "Space Mono, monospace" }}>
                    {item.max} pts
                  </span>
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{item.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--card-border)", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {[1, 2, 3, 4, 5].map((l) => {
              const meta = LEVEL_META[l];
              const ranges = ["0–19", "20–39", "40–59", "60–79", "80–100"];
              return (
                <span key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem" }}>
                  <span style={{
                    padding: "2px 8px", borderRadius: 99,
                    background: meta.bg, color: meta.color, fontWeight: 700, fontSize: "0.68rem",
                  }}>
                    Lv{l} {meta.label}
                  </span>
                  <span style={{ color: "var(--text-muted)" }}>{ranges[l - 1]} pts</span>
                </span>
              );
            })}
          </div>
        </div>

      </div>
    </main>
  );
}

function LevelBadge({ level }: { level: 1 | 2 | 3 | 4 | 5 }) {
  const meta = LEVEL_META[level];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 99,
      background: meta.bg, color: meta.color,
      fontSize: "0.7rem", fontWeight: 700, whiteSpace: "nowrap",
    }}>
      <span style={{ fontFamily: "Space Mono, monospace" }}>Lv{level}</span>
      {meta.label}
    </span>
  );
}

function PointsBar({ points, color }: { points: number; color: string }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
        <span style={{ fontSize: "0.8rem", fontWeight: 700, color, fontFamily: "Space Mono, monospace" }}>
          {points}
        </span>
        <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>/100</span>
      </div>
      <div style={{ height: 4, width: "100%", background: "var(--card-border)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${points}%`, background: color, borderRadius: 99, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}
