import { requireStaff, getStaffRole, OWNER_HANDLE } from "@/lib/auth-utils";
import db from "@/lib/db";
import Link from "next/link";

export default async function AdminDashboardPage() {
  await requireStaff();
  const staffRole = await getStaffRole();

  const isOwner   = staffRole === "owner";
  const isAdmin   = staffRole === "admin";
  const isSupport = staffRole === "support";

  const dashConfig = {
    owner:   { label: "Owner Dashboard",   accent: "#14b8a6", tag: "— BUILDER CONSOLE" },
    admin:   { label: "Admin Dashboard",    accent: "#ef4444", tag: "— COMMAND CENTER" },
    support: { label: "Support Dashboard",  accent: "#8b5cf6", tag: "— DISPUTE CENTER" },
  }[staffRole!]!;

  const [
    totalUsers, activeGigs, totalOrders, completedOrders,
    totalRevenue, showcasePosts, latestUsers, pendingOrders, disputedOrders,
  ] = await Promise.all([
    isOwner || isAdmin ? db.user.count()                                                          : Promise.resolve(0),
    isOwner || isAdmin ? db.gig.count({ where: { status: "active" } })                           : Promise.resolve(0),
    isOwner || isAdmin ? db.order.count()                                                         : Promise.resolve(0),
    isOwner || isAdmin ? db.order.count({ where: { status: "completed" } })                      : Promise.resolve(0),
    isOwner || isAdmin ? db.order.aggregate({ where: { status: "completed" }, _sum: { amount: true } }) : Promise.resolve({ _sum: { amount: 0 } }),
    isOwner || isAdmin ? db.showcasePost.count()                                                  : Promise.resolve(0),
    isOwner ? db.user.findMany({
      orderBy: { createdAt: "desc" }, take: 8,
      select: { id: true, name: true, twitterHandle: true, image: true, createdAt: true, role: true, isOG: true, profileComplete: true },
    }) : Promise.resolve([]),
    isOwner || isAdmin ? db.order.count({ where: { status: { in: ["pending", "accepted", "funded", "delivered"] } } }) : Promise.resolve(0),
    db.order.count({ where: { status: "disputed" } }),
  ]);

  const revenue = (totalRevenue as any)._sum?.amount ?? 0;

  // Stats visible per role
  const stats = [
    ...(isOwner || isAdmin ? [
      { label: "Total Users",      value: totalUsers,      color: "#14b8a6" },
      { label: "Total Orders",     value: totalOrders,     color: "#f59e0b" },
      { label: "Completed Orders", value: completedOrders, color: "#6366f1" },
      { label: "Total Revenue",    value: `$${revenue.toLocaleString()}`, color: "#ec4899" },
      { label: "Active Gigs",      value: activeGigs,      color: "#22c55e" },
      { label: "Showcase Posts",   value: showcasePosts,   color: "#8b5cf6" },
    ] : []),
    { label: "Open Disputes",  value: disputedOrders, color: "#ef4444" },
  ];

  // Sections visible per role — support only sees disputes
  const allSections = [
    {
      roles: ["owner"],
      href: "/admin/users",
      label: "Users",
      desc: "Manage roles, OG badges, and delete accounts",
      count: totalUsers, color: "#14b8a6",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    },
    {
      roles: ["owner", "admin"],
      href: "/admin/gigs",
      label: "Gigs",
      desc: "Activate or deactivate service listings",
      count: activeGigs, countLabel: "active", color: "#22c55e",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
    },
    {
      roles: ["owner", "admin"],
      href: "/admin/orders",
      label: "Orders",
      desc: "View all orders and update their status",
      count: pendingOrders, countLabel: "pending", color: "#f59e0b",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    },
    {
      roles: ["owner", "admin"],
      href: "/admin/showcase",
      label: "Showcase",
      desc: "Moderate showcase posts and remove content",
      count: showcasePosts, color: "#8b5cf6",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    },
    {
      roles: ["owner", "admin", "support"],
      href: "/admin/disputes",
      label: "Disputes",
      desc: "Resolve on-chain disputes — refund buyer or release to seller",
      count: disputedOrders, countLabel: "open", color: "#ef4444",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    },
  ];

  const sections = allSections.filter(s => s.roles.includes(staffRole!));

  return (
    <main className="page" style={{ background: "var(--background)", minHeight: "100vh" }}>
      <div className="admin-content">

        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ fontSize: "0.6rem", letterSpacing: "0.2em", color: dashConfig.accent, marginBottom: "0.5rem", fontWeight: 700 }}>
            {dashConfig.tag}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--foreground)", margin: 0 }}>{dashConfig.label}</h1>
            <span style={{
              fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.1em", padding: "3px 10px", borderRadius: 99,
              background: isOwner ? "linear-gradient(135deg,#14b8a6,#0f766e)" : isAdmin ? "rgba(239,68,68,0.1)" : "rgba(99,102,241,0.1)",
              color: isOwner ? "#fff" : isAdmin ? "#ef4444" : "#6366f1",
            }}>
              {staffRole!.toUpperCase()}
            </span>
          </div>
          {isSupport && (
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
              You handle dispute resolution for escrow orders.
            </p>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
          {stats.map((s) => (
            <div key={s.label} style={{ background: "var(--card-bg)", padding: "1.25rem", borderRadius: 14, border: "1px solid var(--card-border)" }}>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>
                {s.label}
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: s.color, fontFamily: "Space Mono, monospace", lineHeight: 1 }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Section nav cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "3rem" }}>
          {sections.map((s) => (
            <Link key={s.href} href={s.href} style={{
              display: "block", textDecoration: "none",
              background: "var(--card-bg)", borderRadius: 14, border: "1px solid var(--card-border)",
              padding: "1.25rem", transition: "border-color 0.15s",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <div style={{ color: s.color }}>{s.icon}</div>
                <span style={{ fontSize: "1.25rem", fontWeight: 800, color: s.color, fontFamily: "Space Mono, monospace" }}>
                  {s.count}
                  {(s as any).countLabel && <span style={{ fontSize: "0.6rem", fontWeight: 600, marginLeft: 3, color: "var(--text-muted)" }}>{(s as any).countLabel}</span>}
                </span>
              </div>
              <div style={{ fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.4 }}>{s.desc}</div>
            </Link>
          ))}
        </div>

        {/* Recent signups — owner only */}
        {isOwner && latestUsers.length > 0 && (
          <div style={{ background: "var(--card-bg)", borderRadius: 16, border: "1px solid var(--card-border)", overflow: "hidden" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--card-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Recent Signups</h2>
              <Link href="/admin/users" style={{ fontSize: "0.75rem", color: "#14b8a6", textDecoration: "none", fontWeight: 600 }}>View all →</Link>
            </div>
            <div className="admin-table-wrap">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ textAlign: "left", background: "rgba(var(--foreground-rgb), 0.02)" }}>
                    {["User", "Joined", "Profile", "Role"].map((h) => (
                      <th key={h} style={{ padding: "0.85rem 1.5rem", color: "var(--text-muted)", fontWeight: 600, fontSize: "0.75rem" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(latestUsers as any[]).map((user) => (
                    <tr key={user.id} style={{ borderTop: "1px solid var(--card-border)" }}>
                      <td style={{ padding: "0.9rem 1.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {user.image
                            ? <img src={user.image} alt="" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover" }} />
                            : <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#14b8a6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>
                                {(user.name ?? user.twitterHandle)[0].toUpperCase()}
                              </div>
                          }
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--foreground)", fontSize: "0.85rem" }}>{user.name || "Unknown"}</div>
                            <div style={{ color: "#14b8a6", fontSize: "0.7rem", fontWeight: 600 }}>@{user.twitterHandle}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "0.9rem 1.5rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "0.9rem 1.5rem" }}>
                        {user.profileComplete
                          ? <span style={{ color: "#22c55e", fontSize: "0.75rem", fontWeight: 600 }}>● Complete</span>
                          : <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>○ Incomplete</span>}
                        {user.isOG && <span style={{ marginLeft: 8, fontSize: "0.65rem", background: "rgba(245,158,11,0.12)", color: "#f59e0b", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>OG</span>}
                      </td>
                      <td style={{ padding: "0.9rem 1.5rem" }}>
                        <span style={{
                          fontSize: "0.65rem", fontWeight: 700, padding: "3px 8px", borderRadius: 4,
                          background: user.twitterHandle === OWNER_HANDLE ? "linear-gradient(135deg,#14b8a6,#0f766e)" : user.role === "ADMIN" ? "#fef2f2" : "rgba(var(--foreground-rgb),0.05)",
                          color: user.twitterHandle === OWNER_HANDLE ? "#fff" : user.role === "ADMIN" ? "#ef4444" : "var(--text-muted)",
                        }}>
                          {user.twitterHandle === OWNER_HANDLE ? "OWNER" : user.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
