import db from "@/lib/db";
import Link from "next/link";
import OGBadge from "@/components/ui/OGBadge";
import { WalletVerifiedBadge } from "@/components/ui/VerificationBadges";
import T from "@/components/ui/T";

const AVAILABILITY_COLORS: Record<string, string> = {
  available: "rgba(120,255,180,0.8)",
  open: "rgba(255,200,80,0.8)",
  busy: "rgba(255,100,100,0.8)",
};

const AVAILABILITY_LABELS: Record<string, string> = {
  available: "Available",
  open: "Open to offers",
  busy: "Busy",
};

const PAGE_SIZE = 20;

export default async function TalentPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string; avail?: string; page?: string }>;
}) {
  const { role = "", q = "", avail = "", page = "1" } = await searchParams;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const skip = (pageNum - 1) * PAGE_SIZE;

  let users: any[] = [];
  let total = 0;
  let dbError = false;

  try {
    const where: Record<string, unknown> = { profileComplete: true };

    if (role.trim()) {
      where.role = { equals: role.trim(), mode: "insensitive" };
    }

    if (avail === "1") {
      where.availability = "available";
    }

    if (q.trim()) {
      where.OR = [
        { name: { contains: q.trim(), mode: "insensitive" } },
        { twitterHandle: { contains: q.trim(), mode: "insensitive" } },
      ];
    }

    [users, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: PAGE_SIZE,
        select: {
          twitterHandle: true,
          name: true,
          image: true,
          role: true,
          skills: true,
          availability: true,
          bio: true,
          isOG: true,
          walletAddress: true,
          worldIdLevel: true,
        },
      }),
      db.user.count({ where }),
    ]);
  } catch (error) {
    console.error("Talent Page DB Error:", error);
    dbError = true;
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Build URL helper preserving current filters
  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (role) params.set("role", role);
    if (q) params.set("q", q);
    if (avail) params.set("avail", avail);
    params.set("page", String(p));
    return `/talent?${params.toString()}`;
  }

  return (
    <main className="page">
      <section className="talent-wrap">
        <div className="talent-header">
          <div className="auth-kicker"><T k="talent.kicker" /></div>
          <h1 className="auth-title">{role ? role : <T k="talent.title" />}</h1>
          <p className="auth-sub">
            {role
              ? `Verified Web3 ${role} builders, ready to crew up.`
              : <T k="talent.subtitle" />}
          </p>
          {role && (
            <Link
              href="/talent"
              style={{
                marginTop: "0.75rem",
                display: "inline-flex",
                fontFamily: "Space Mono, monospace",
                fontSize: "0.7rem",
                color: "var(--foreground)",
                textDecoration: "none",
                letterSpacing: "0.04em",
              }}
            >
              <T k="talent.allTalent" />
            </Link>
          )}
        </div>

        {/* ── Filters bar ── */}
        <form method="GET" action="/talent" className="talent-filters">
          {/* preserve role if active */}
          {role && <input type="hidden" name="role" value={role} />}

          <input
            className="talent-search-input"
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by name or handle..."
            autoComplete="off"
          />

          <label className="talent-avail-toggle" title="Show only available builders">
            <input
              type="checkbox"
              name="avail"
              value="1"
              defaultChecked={avail === "1"}
              style={{ display: "none" }}
            />
            <span
              className={`talent-avail-chip${avail === "1" ? " talent-avail-chip--active" : ""}`}
            >
              <span style={{
                display: "inline-block",
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: avail === "1" ? "#22c55e" : "rgba(120,255,180,0.6)",
                marginRight: "0.35rem",
              }} />
              Available now
            </span>
          </label>

          <button type="submit" className="talent-search-btn">Search</button>

          {(q || avail === "1") && (
            <Link
              href={role ? `/talent?role=${encodeURIComponent(role)}` : "/talent"}
              className="talent-clear-btn"
            >
              Clear
            </Link>
          )}
        </form>

        {dbError ? (
          <div className="talent-empty">
            <p style={{ color: "#ef4444" }}>Unable to load talent directory. Please try again.</p>
            <Link href="/talent" className="btn-primary" style={{ marginTop: 16, display: "inline-flex" }}>
              Retry
            </Link>
          </div>
        ) : users.length === 0 ? (
          <div className="talent-empty">
            <p>No {role ? `${role} builders` : "builders"} found{q ? ` for "${q}"` : ""}.</p>
            <Link href="/dashboard" className="btn-primary" style={{ marginTop: 16, display: "inline-flex" }}>
              <T k="talent.dashboard" />
            </Link>
          </div>
        ) : (
          <>
            <div className="talent-grid">
              {users.map((user: any) => {
                const avail = user.availability ?? "available";
                return (
                  <Link
                    key={user.twitterHandle}
                    href={`/u/${user.twitterHandle}`}
                    className="talent-card"
                  >
                    <div className="talent-card-top">
                      <div className="talent-avatar">
                        {user.image ? (
                          <img src={user.image} alt={user.name ?? ""} className="talent-avatar-img" />
                        ) : (
                          <div className="talent-avatar-fallback" />
                        )}
                      </div>
                      <div className="talent-card-meta">
                        <div className="talent-name" style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                          {user.name ?? user.twitterHandle}
                          {user.isOG && <OGBadge />}
                          {user.walletAddress && <WalletVerifiedBadge />}
                        </div>
                        {user.role && <div className="talent-role">{user.role}</div>}
                      </div>
                      <span
                        className="talent-avail-dot"
                        style={{
                          background: AVAILABILITY_COLORS[avail],
                          boxShadow: `0 0 6px ${AVAILABILITY_COLORS[avail]}`,
                        }}
                        title={AVAILABILITY_LABELS[avail]}
                      />
                    </div>

                    {user.bio && (
                      <p className="talent-bio">{user.bio}</p>
                    )}

                    {user.skills.length > 0 && (
                      <div className="talent-skills">
                        {user.skills.slice(0, 5).map((s: string) => (
                          <span key={s} className="talent-skill-chip">{s}</span>
                        ))}
                        {user.skills.length > 5 && (
                          <span className="talent-skill-chip talent-skill-more">+{user.skills.length - 5}</span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="talent-pagination">
                {pageNum > 1 && (
                  <Link href={pageUrl(pageNum - 1)} className="talent-page-btn">← Prev</Link>
                )}
                <span className="talent-page-info">
                  Page {pageNum} of {totalPages}
                </span>
                {pageNum < totalPages && (
                  <Link href={pageUrl(pageNum + 1)} className="talent-page-btn">Next →</Link>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
