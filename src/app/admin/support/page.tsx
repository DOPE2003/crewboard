import { requireStaff } from "@/lib/auth-utils";
import db from "@/lib/db";
import Link from "next/link";
import AdminTicketActions from "./AdminTicketActions";

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  "open":        { bg: "rgba(245,158,11,0.1)",  color: "#b45309", label: "Open" },
  "in-progress": { bg: "rgba(99,102,241,0.1)",  color: "#6366f1", label: "In Progress" },
  "resolved":    { bg: "rgba(34,197,94,0.1)",   color: "#16a34a", label: "Resolved" },
  "closed":      { bg: "rgba(148,163,184,0.1)", color: "#64748b", label: "Closed" },
};

const CATEGORY_LABELS: Record<string, string> = {
  general: "General", billing: "Billing", order: "Order",
  account: "Account", bug: "Bug", other: "Other",
};

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireStaff();
  const { status = "all", q = "" } = await searchParams;

  const where: any = {};
  if (status !== "all") where.status = status;
  if (q) {
    where.OR = [
      { subject: { contains: q, mode: "insensitive" } },
      { body:    { contains: q, mode: "insensitive" } },
      { user: { OR: [
        { name:          { contains: q, mode: "insensitive" } },
        { twitterHandle: { contains: q, mode: "insensitive" } },
        { email:         { contains: q, mode: "insensitive" } },
      ]}},
    ];
  }

  const [tickets, counts] = await Promise.all([
    db.supportTicket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { id: true, name: true, twitterHandle: true, image: true, email: true } },
      },
    }),
    db.supportTicket.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  const countMap = Object.fromEntries(counts.map(c => [c.status, c._count]));
  const total = Object.values(countMap).reduce((a, b) => a + b, 0);

  const STATUS_FILTERS = [
    { value: "all",        label: "All",         count: total },
    { value: "open",       label: "Open",        count: countMap["open"] ?? 0 },
    { value: "in-progress",label: "In Progress", count: countMap["in-progress"] ?? 0 },
    { value: "resolved",   label: "Resolved",    count: countMap["resolved"] ?? 0 },
    { value: "closed",     label: "Closed",      count: countMap["closed"] ?? 0 },
  ];

  return (
    <main className="page" style={{ background: "var(--background)", minHeight: "100vh" }}>
      <div className="admin-content">

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
          <div>
            <div style={{ fontFamily: "Space Mono, monospace", fontSize: "0.6rem", letterSpacing: "0.2em", color: "#14b8a6", marginBottom: "0.4rem" }}>
              — SUPPORT
            </div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--foreground)", margin: 0 }}>
              Support Tickets
            </h1>
          </div>
          <Link href="/admin" style={{ fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "none", fontWeight: 600 }}>← Back</Link>
        </div>

        {/* Filters + search */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {STATUS_FILTERS.map(f => (
              <Link
                key={f.value}
                href={`/admin/support?status=${f.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                style={{
                  padding: "6px 14px", borderRadius: 99, fontSize: "0.75rem", fontWeight: 600,
                  textDecoration: "none",
                  border: "1px solid " + (status === f.value ? "#14b8a6" : "var(--card-border)"),
                  background: status === f.value ? "rgba(20,184,166,0.1)" : "transparent",
                  color: status === f.value ? "#14b8a6" : "var(--text-muted)",
                  display: "flex", alignItems: "center", gap: 5,
                }}
              >
                {f.label}
                {f.count > 0 && (
                  <span style={{
                    fontSize: "0.6rem", fontWeight: 800, padding: "1px 6px", borderRadius: 99,
                    background: status === f.value ? "rgba(20,184,166,0.2)" : "rgba(var(--foreground-rgb),0.06)",
                    color: status === f.value ? "#14b8a6" : "var(--text-muted)",
                  }}>
                    {f.count}
                  </span>
                )}
              </Link>
            ))}
          </div>
          <form style={{ flex: 1, minWidth: 180 }}>
            <input
              name="q"
              defaultValue={q}
              placeholder="Search subject, user…"
              style={{
                width: "100%", padding: "0.5rem 0.85rem", borderRadius: 10,
                border: "1px solid var(--card-border)", background: "var(--card-bg)",
                color: "var(--foreground)", fontSize: "0.82rem", outline: "none",
              }}
            />
            <input type="hidden" name="status" value={status} />
          </form>
        </div>

        {/* Ticket list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {tickets.length === 0 && (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)", background: "var(--card-bg)", borderRadius: 14, border: "1px solid var(--card-border)" }}>
              No tickets found.
            </div>
          )}
          {tickets.map(t => {
            const st = STATUS_STYLE[t.status] ?? STATUS_STYLE["open"];
            return (
              <div key={t.id} style={{
                background: "var(--card-bg)", borderRadius: 14, border: "1px solid var(--card-border)",
                padding: "1.25rem 1.5rem",
              }}>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  {/* User */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {t.user.image
                      ? <img src={t.user.image} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                      : <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#14b8a6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>
                          {(t.user.name ?? t.user.twitterHandle)[0].toUpperCase()}
                        </div>
                    }
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--foreground)" }}>{t.user.name ?? t.user.twitterHandle}</div>
                      <div style={{ fontSize: "0.7rem", color: "#14b8a6" }}>@{t.user.twitterHandle}</div>
                      {t.user.email && <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{t.user.email}</div>}
                    </div>
                  </div>

                  {/* Ticket content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, color: "var(--foreground)", fontSize: "0.9rem" }}>{t.subject}</span>
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "rgba(20,184,166,0.1)", color: "#0f766e" }}>
                        {CATEGORY_LABELS[t.category] ?? t.category}
                      </span>
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: st.bg, color: st.color, border: `1px solid ${st.color}33` }}>
                        {st.label}
                      </span>
                    </div>
                    <p style={{ margin: "0 0 8px", fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
                      {t.body}
                    </p>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      {new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                    </div>
                    {t.staffNote && (
                      <div style={{ marginTop: 8, padding: "0.6rem 0.85rem", borderRadius: 8, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", fontSize: "0.78rem", color: "var(--foreground)", lineHeight: 1.5 }}>
                        <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.06em", marginRight: 6 }}>Your reply:</span>
                        {t.staffNote}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ flexShrink: 0, display: "flex", alignItems: "flex-start" }}>
                    <AdminTicketActions ticketId={t.id} currentStatus={t.status} currentNote={t.staffNote ?? ""} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </main>
  );
}
