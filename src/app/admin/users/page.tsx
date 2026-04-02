import { requireAdmin } from "@/lib/auth-utils";
import db from "@/lib/db";
import Link from "next/link";
import { AdminUserActions } from "./AdminUserActions";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q = "" } = await searchParams;

  const users = await db.user.findMany({
    where: {
      OR: [
        { name:          { contains: q, mode: "insensitive" } },
        { twitterHandle: { contains: q, mode: "insensitive" } },
        { email:         { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      twitterHandle: true,
      email: true,
      isAdmin: true,
      createdAt: true,
      profileComplete: true,
    },
  });

  return (
    <main className="page" style={{ background: "var(--background)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "8rem 1.5rem 6rem" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2.5rem" }}>
          <div>
            <div style={{ fontFamily: "Space Mono, monospace", fontSize: "0.6rem", letterSpacing: "0.2em", color: "#ef4444", marginBottom: "0.5rem" }}>
              — MANAGEMENT
            </div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--foreground)" }}>User Directory</h1>
          </div>
          <Link href="/admin" style={{ fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "none", fontWeight: 600 }}>← Back to Dashboard</Link>
        </div>

        {/* Search */}
        <form style={{ marginBottom: "2rem" }}>
          <input 
            name="q"
            defaultValue={q}
            placeholder="Search by name, handle, or email..."
            style={{ 
              width: "100%", padding: "1rem 1.25rem", borderRadius: "12px", 
              border: "1px solid var(--card-border)", background: "var(--card-bg)", 
              color: "var(--foreground)", fontSize: "0.9rem", outline: "none"
            }}
          />
        </form>

        <div style={{ background: "var(--card-bg)", borderRadius: 16, border: "1px solid var(--card-border)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ textAlign: "left", background: "rgba(var(--foreground-rgb), 0.02)" }}>
                <th style={{ padding: "1rem 1.5rem", color: "var(--text-muted)", fontWeight: 600 }}>User Info</th>
                <th style={{ padding: "1rem 1.5rem", color: "var(--text-muted)", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "1rem 1.5rem", color: "var(--text-muted)", fontWeight: 600 }}>Permissions</th>
                <th style={{ padding: "1rem 1.5rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderTop: "1px solid var(--card-border)" }}>
                  <td style={{ padding: "1.25rem 1.5rem" }}>
                    <div style={{ fontWeight: 700, color: "var(--foreground)", fontSize: "0.9rem" }}>{user.name || "Unknown"}</div>
                    <div style={{ color: "#14b8a6", fontSize: "0.75rem", fontWeight: 600 }}>@{user.twitterHandle}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginTop: 4 }}>{user.email || "No email linked"}</div>
                  </td>
                  <td style={{ padding: "1.25rem 1.5rem" }}>
                    {user.profileComplete ? (
                      <span style={{ color: "#22c55e", fontWeight: 600 }}>● Active</span>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>○ Incomplete</span>
                    )}
                  </td>
                  <td style={{ padding: "1.25rem 1.5rem" }}>
                    {user.isAdmin ? (
                      <span style={{ background: "#fef2f2", color: "#ef4444", padding: "3px 10px", borderRadius: 6, fontSize: "0.65rem", fontWeight: 800, border: "1px solid rgba(239,68,68,0.2)" }}>ADMIN</span>
                    ) : (
                      <span style={{ background: "rgba(var(--foreground-rgb), 0.05)", color: "var(--text-muted)", padding: "3px 10px", borderRadius: 6, fontSize: "0.65rem", fontWeight: 600 }}>USER</span>
                    )}
                  </td>
                  <td style={{ padding: "1.25rem 1.5rem", textAlign: "right" }}>
                    <AdminUserActions userId={user.id} isAdmin={user.isAdmin} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
              No users found matching "{q}"
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
