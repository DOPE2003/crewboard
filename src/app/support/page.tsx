import { auth } from "@/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import Link from "next/link";
import SupportTicketModal from "@/components/ui/SupportTicketModal";
import NewTicketButton from "@/components/ui/NewTicketButton";

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  "open":        { bg: "rgba(245,158,11,0.1)",  color: "#b45309",  label: "Open" },
  "in-progress": { bg: "rgba(99,102,241,0.1)",  color: "#6366f1",  label: "In Progress" },
  "resolved":    { bg: "rgba(34,197,94,0.1)",   color: "#16a34a",  label: "Resolved" },
  "closed":      { bg: "rgba(148,163,184,0.1)", color: "#64748b",  label: "Closed" },
};

const CATEGORY_LABELS: Record<string, string> = {
  general: "General",
  billing: "Billing",
  order:   "Order",
  account: "Account",
  bug:     "Bug",
  other:   "Other",
};

export default async function SupportPage() {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) redirect("/login");

  const tickets = await db.supportTicket.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main style={{ minHeight: "100vh", background: "var(--background)", paddingTop: "5rem", paddingBottom: "4rem" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 1.5rem" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div>
            <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.2em", color: "#14b8a6", marginBottom: "0.4rem" }}>
              — HELP CENTER
            </div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--foreground)", margin: 0 }}>
              Support Tickets
            </h1>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0.4rem 0 0", lineHeight: 1.6 }}>
              Our team typically responds within 24 hours.
            </p>
          </div>
          <NewTicketButton />
        </div>

        {tickets.length === 0 ? (
          <div style={{
            background: "var(--card-bg)", borderRadius: 16, border: "1px solid var(--card-border)",
            padding: "3rem", textAlign: "center",
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🎫</div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--foreground)", marginBottom: 8 }}>
              No tickets yet
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Have a question or found an issue? We're here to help.
            </div>
            <NewTicketButton />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {tickets.map(t => {
              const st = STATUS_STYLE[t.status] ?? STATUS_STYLE["open"];
              return (
                <div key={t.id} style={{
                  background: "var(--card-bg)", borderRadius: 14, border: "1px solid var(--card-border)",
                  padding: "1.25rem 1.5rem",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: "var(--foreground)", fontSize: "0.95rem", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.subject}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "rgba(20,184,166,0.1)", color: "#0f766e" }}>
                          {CATEGORY_LABELS[t.category] ?? t.category}
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                          {new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                    <span style={{
                      fontSize: "0.65rem", fontWeight: 700, padding: "3px 10px", borderRadius: 99,
                      background: st.bg, color: st.color, flexShrink: 0,
                      border: `1px solid ${st.color}33`,
                    }}>
                      {st.label}
                    </span>
                  </div>
                  {t.staffNote && (
                    <div style={{
                      marginTop: 10, padding: "0.65rem 0.9rem", borderRadius: 10,
                      background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.15)",
                      fontSize: "0.8rem", color: "var(--foreground)", lineHeight: 1.6,
                    }}>
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#14b8a6", textTransform: "uppercase", letterSpacing: "0.08em", marginRight: 6 }}>
                        Staff reply:
                      </span>
                      {t.staffNote}
                    </div>
                  )}
                  {t.resolvedAt && (
                    <div style={{ marginTop: 6, fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      Resolved {new Date(t.resolvedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: "2rem", padding: "1.25rem 1.5rem", background: "var(--card-bg)", borderRadius: 14, border: "1px solid var(--card-border)", display: "flex", alignItems: "center", gap: 12 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
          </svg>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
            For urgent order issues, you can also{" "}
            <Link href="/orders" style={{ color: "#14b8a6", textDecoration: "none", fontWeight: 600 }}>open a dispute</Link>
            {" "}directly from your order page.
          </div>
        </div>

      </div>
    </main>
  );
}
