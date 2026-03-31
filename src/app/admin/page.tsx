import { requireAdmin } from "@/lib/auth-utils";
import db from "@/lib/db";
import Link from "next/link";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [totalUsers, activeGigs, totalOrders, latestUsers] = await Promise.all([
    db.user.count(),
    db.gig.count({ where: { status: "active" } }),
    db.order.count(),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, name: true, twitterHandle: true, createdAt: true, isAdmin: true, humanVerified: true }
    })
  ]);

  return (
    <main className="page" style={{ background: "var(--background)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "8rem 1.5rem 6rem" }}>
        
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontFamily: "Space Mono, monospace", fontSize: "0.6rem", letterSpacing: "0.2em", color: "#ef4444", marginBottom: "0.5rem" }}>
            — COMMAND CENTER
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--foreground)" }}>Admin Dashboard</h1>
        </div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", marginBottom: "3rem" }}>
          <StatCard label="Total Users" value={totalUsers} color="#14b8a6" />
          <StatCard label="Active Gigs" value={activeGigs} color="#22c55e" />
          <StatCard label="Total Orders" value={totalOrders} color="#f59e0b" />
          <StatCard label="Admin Users" value={latestUsers.filter(u => u.isAdmin).length} color="#ef4444" />
        </div>

        {/* User Management Table */}
        <div style={{ background: "var(--card-bg)", borderRadius: 16, border: "1px solid var(--card-border)", overflow: "hidden" }}>
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--card-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--foreground)" }}>Recent Signups</h2>
            <Link href="/admin/users" style={{ fontSize: "0.75rem", color: "#14b8a6", textDecoration: "none", fontWeight: 600 }}>View all users →</Link>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ textAlign: "left", background: "rgba(var(--foreground-rgb), 0.02)" }}>
                  <th style={{ padding: "1rem 1.5rem", color: "var(--text-muted)", fontWeight: 600 }}>User</th>
                  <th style={{ padding: "1rem 1.5rem", color: "var(--text-muted)", fontWeight: 600 }}>Joined</th>
                  <th style={{ padding: "1rem 1.5rem", color: "var(--text-muted)", fontWeight: 600 }}>Status</th>
                  <th style={{ padding: "1rem 1.5rem", textAlign: "right" }}></th>
                </tr>
              </thead>
              <tbody>
                {latestUsers.map((user) => (
                  <tr key={user.id} style={{ borderTop: "1px solid var(--card-border)" }}>
                    <td style={{ padding: "1rem 1.5rem" }}>
                      <div style={{ fontWeight: 600, color: "var(--foreground)" }}>{user.name || "Unknown"}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>@{user.twitterHandle}</div>
                    </td>
                    <td style={{ padding: "1rem 1.5rem", color: "var(--foreground)" }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "1rem 1.5rem" }}>
                      {user.isAdmin && <span style={{ background: "#fef2f2", color: "#ef4444", padding: "2px 8px", borderRadius: 4, fontSize: "0.65rem", fontWeight: 700 }}>ADMIN</span>}
                      {!user.isAdmin && <span style={{ background: "rgba(var(--foreground-rgb), 0.05)", color: "var(--text-muted)", padding: "2px 8px", borderRadius: 4, fontSize: "0.65rem" }}>USER</span>}
                    </td>
                    <td style={{ padding: "1rem 1.5rem", textAlign: "right" }}>
                      <Link href={`/u/${user.twitterHandle}`} style={{ color: "#14b8a6", textDecoration: "none" }}>View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: "var(--card-bg)", padding: "1.5rem", borderRadius: 16, border: "1px solid var(--card-border)" }}>
      <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>{label}</div>
      <div style={{ fontSize: "2rem", fontWeight: 800, color: color, fontFamily: "Space Mono, monospace" }}>{value}</div>
    </div>
  );
}
