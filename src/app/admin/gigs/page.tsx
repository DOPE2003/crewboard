import { requireAdmin } from "@/lib/auth-utils";
import db from "@/lib/db";
import Link from "next/link";
import { GigActions } from "./GigActions";

export default async function AdminGigsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireAdmin();
  const { q = "", status = "all" } = await searchParams;

  const gigs = await db.gig.findMany({
    where: {
      ...(status !== "all" ? { status } : {}),
      ...(q ? {
        OR: [
          { title:    { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
        ],
      } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true, twitterHandle: true } },
      _count: { select: { orders: true } },
    },
  });

  const statusColors: Record<string, { bg: string; color: string }> = {
    active:   { bg: "rgba(34,197,94,0.1)",  color: "#22c55e" },
    inactive: { bg: "rgba(239,68,68,0.1)",  color: "#ef4444" },
  };

  return (
    <main className="page" style={{ background: "var(--background)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "8rem 1.5rem 6rem" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
          <div>
            <div style={{ fontSize: "0.6rem", letterSpacing: "0.2em", color: "#ef4444", marginBottom: "0.5rem", fontWeight: 700 }}>— GIGS</div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--foreground)" }}>Gig Management</h1>
          </div>
          <Link href="/admin" style={{ fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "none", fontWeight: 600 }}>← Dashboard</Link>
        </div>

        {/* Filters */}
        <form style={{ display: "flex", gap: 10, marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <input name="q" defaultValue={q} placeholder="Search title or category…"
            style={{ flex: 1, minWidth: 200, padding: "0.75rem 1rem", borderRadius: 10, border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)", fontSize: "0.85rem", outline: "none" }} />
          <select name="status" defaultValue={status}
            style={{ padding: "0.75rem 1rem", borderRadius: 10, border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)", fontSize: "0.85rem", cursor: "pointer" }}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button type="submit" style={{ padding: "0.75rem 1.25rem", borderRadius: 10, background: "#14b8a6", border: "none", color: "#fff", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}>
            Filter
          </button>
        </form>

        <div style={{ background: "var(--card-bg)", borderRadius: 16, border: "1px solid var(--card-border)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "rgba(var(--foreground-rgb),0.02)", textAlign: "left" }}>
                  {["Gig", "Seller", "Category", "Price", "Orders", "Status", "Action"].map((h) => (
                    <th key={h} style={{ padding: "1rem 1.25rem", color: "var(--text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gigs.map((gig) => {
                  const sc = statusColors[gig.status] ?? { bg: "rgba(0,0,0,0.04)", color: "var(--text-muted)" };
                  return (
                    <tr key={gig.id} style={{ borderTop: "1px solid var(--card-border)" }}>
                      <td style={{ padding: "1rem 1.25rem", maxWidth: 260 }}>
                        <div style={{ fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{gig.title}</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>{new Date(gig.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td style={{ padding: "1rem 1.25rem" }}>
                        <Link href={`/u/${gig.user.twitterHandle}`} style={{ color: "#14b8a6", textDecoration: "none", fontSize: "0.8rem", fontWeight: 600 }}>
                          @{gig.user.twitterHandle}
                        </Link>
                      </td>
                      <td style={{ padding: "1rem 1.25rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>{gig.category}</td>
                      <td style={{ padding: "1rem 1.25rem", fontWeight: 700, color: "var(--foreground)" }}>${gig.price}</td>
                      <td style={{ padding: "1rem 1.25rem", color: "var(--text-muted)" }}>{gig._count.orders}</td>
                      <td style={{ padding: "1rem 1.25rem" }}>
                        <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: sc.bg, color: sc.color }}>
                          {gig.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "1rem 1.25rem" }}>
                        <GigActions gigId={gig.id} status={gig.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {gigs.length === 0 && (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>No gigs found.</div>
          )}
        </div>
      </div>
    </main>
  );
}
