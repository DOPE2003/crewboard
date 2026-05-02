import { auth } from "@/auth";
import db from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

// ── Workflow steps (ordered) ────────────────────────────────────────────────
const STEPS_FULL    = ["pending", "funded", "accepted", "delivered", "completed"] as const;
const STEPS_SIMPLE  = ["pending", "accepted", "delivered", "completed"] as const;

function stepIndex(status: string, hasEscrow: boolean): number {
  const steps: readonly string[] = hasEscrow ? STEPS_FULL : STEPS_SIMPLE;
  const idx = steps.indexOf(status);
  return idx >= 0 ? idx + 1 : 0;
}

// ── Escrow state per status ─────────────────────────────────────────────────
function escrowLabel(status: string): { text: string; color: string } {
  if (status === "funded" || status === "accepted" || status === "delivered")
    return { text: "Escrow: Locked", color: "#3b82f6" };
  if (status === "completed")
    return { text: "Escrow: Released", color: "#22c55e" };
  if (status === "cancelled")
    return { text: "Escrow: Returned", color: "#94a3b8" };
  if (status === "disputed")
    return { text: "Escrow: Frozen", color: "#ef4444" };
  return { text: "No escrow yet", color: "#94a3b8" };
}

// ── Role-aware status label ─────────────────────────────────────────────────
function statusLabel(status: string, role: "buyer" | "seller"): string {
  if (status === "pending")   return role === "buyer" ? "Waiting for freelancer to accept" : "New order — accept to start";
  if (status === "funded")    return role === "buyer" ? "Escrow locked — freelancer working" : "Escrow funded — accept to start";
  if (status === "accepted")  return role === "buyer" ? "Freelancer working on it" : "In progress — deliver when ready";
  if (status === "delivered") return role === "buyer" ? "Waiting for your review & payment" : "Delivered — awaiting client approval";
  if (status === "completed") return "Completed & paid";
  if (status === "cancelled") return "Cancelled";
  if (status === "disputed")  return "Payment dispute";
  return status;
}

// ── Role-aware status color ─────────────────────────────────────────────────
function statusColor(status: string, role: "buyer" | "seller"): string {
  if (status === "delivered" && role === "buyer") return "#8b5cf6"; // action needed — purple
  if (status === "funded"    && role === "seller") return "#f59e0b"; // action needed — amber
  const map: Record<string, string> = {
    pending: "#94a3b8", funded: "#3b82f6", accepted: "#3b82f6",
    delivered: "#8b5cf6", completed: "#22c55e", cancelled: "#94a3b8", disputed: "#ef4444",
  };
  return map[status] ?? "#94a3b8";
}

// ── Primary CTA per order ───────────────────────────────────────────────────
function primaryCta(status: string, role: "buyer" | "seller", orderId: string): { label: string; href: string; urgent: boolean } | null {
  if (status === "pending" && role === "seller") return { label: "Accept Order",        href: `/orders/${orderId}`, urgent: true  };
  if (status === "pending" && role === "buyer")  return { label: "Continue Chat",       href: `/orders/${orderId}`, urgent: false };
  if (status === "funded"  && role === "seller") return { label: "Accept & Start",    href: `/orders/${orderId}`, urgent: true  };
  if (status === "funded"  && role === "buyer")  return { label: "View Progress",     href: `/orders/${orderId}`, urgent: false };
  if (status === "accepted")  return { label: role === "seller" ? "Submit Delivery" : "View Progress", href: `/orders/${orderId}`, urgent: role === "seller" };
  if (status === "delivered" && role === "buyer")  return { label: "Review & Release Payment", href: `/orders/${orderId}`, urgent: true  };
  if (status === "delivered" && role === "seller") return { label: "View Delivery",   href: `/orders/${orderId}`, urgent: false };
  if (status === "completed") return { label: "View Order",               href: `/orders/${orderId}`, urgent: false };
  if (status === "disputed")  return { label: "View Dispute",             href: `/orders/${orderId}`, urgent: true  };
  return null;
}

// ── "Waiting for me" predicate ──────────────────────────────────────────────
function isWaitingForMe(status: string, role: "buyer" | "seller"): boolean {
  if (role === "buyer"  && status === "delivered") return true;
  if (role === "seller" && status === "pending")   return true;
  if (role === "seller" && status === "funded")    return true;
  if (role === "seller" && status === "accepted")  return true;
  return false;
}

type Tab = "all" | "active" | "waiting" | "completed" | "disputes";

const TABS: { key: Tab; label: string }[] = [
  { key: "all",       label: "All Orders"      },
  { key: "active",    label: "Active"          },
  { key: "waiting",   label: "Waiting for me"  },
  { key: "completed", label: "Completed"       },
  { key: "disputes",  label: "Disputes"        },
];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) redirect("/login");

  const { tab = "all" } = await searchParams;
  const activeTab = (["all", "active", "waiting", "completed", "disputes"].includes(tab) ? tab : "all") as Tab;

  const [buyerOrders, sellerOrders] = await Promise.all([
    db.order.findMany({
      where: { buyerId: userId },
      orderBy: { updatedAt: "desc" },
      include: {
        gig: { select: { id: true, title: true, category: true } },
        seller: { select: { id: true, name: true, twitterHandle: true, image: true } },
      },
    }),
    db.order.findMany({
      where: { sellerId: userId },
      orderBy: { updatedAt: "desc" },
      include: {
        gig: { select: { id: true, title: true, category: true } },
        buyer: { select: { id: true, name: true, twitterHandle: true, image: true } },
      },
    }),
  ]);

  // Annotate with role
  const allOrders = [
    ...buyerOrders.map((o) => ({ ...o, role: "buyer" as const, other: o.seller })),
    ...sellerOrders.map((o) => ({ ...o, role: "seller" as const, other: o.buyer })),
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const activeOrders    = allOrders.filter((o) => ["pending", "funded", "accepted", "delivered"].includes(o.status));
  const waitingOrders   = allOrders.filter((o) => isWaitingForMe(o.status, o.role));
  const completedOrders = allOrders.filter((o) => o.status === "completed");
  const disputeOrders   = allOrders.filter((o) => o.status === "disputed");

  const listToShow =
    activeTab === "active"    ? activeOrders    :
    activeTab === "waiting"   ? waitingOrders   :
    activeTab === "completed" ? completedOrders :
    activeTab === "disputes"  ? disputeOrders   :
    allOrders;

  return (
    <main style={{ background: "var(--background)", minHeight: "100vh" }}>
      <div className="ord-wrap" style={{ maxWidth: 1100, width: "100%", margin: "0 auto", padding: "5rem 1.5rem 4rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "1.75rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--foreground)", margin: 0, letterSpacing: "-0.02em" }}>
            Orders
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: 4 }}>
            Track active work, release payments, and manage your contracts.
          </p>
        </div>

        {/* Tabs */}
        <div className="ord-tabs" style={{ display: "flex", gap: 6, marginBottom: "1.75rem", flexWrap: "wrap" }}>
          {TABS.map((t) => {
            const count =
              t.key === "active"    ? activeOrders.length    :
              t.key === "waiting"   ? waitingOrders.length   :
              t.key === "completed" ? completedOrders.length :
              t.key === "disputes"  ? disputeOrders.length   :
              allOrders.length;
            const isActive = activeTab === t.key;
            const isUrgent = t.key === "waiting" && waitingOrders.length > 0;
            return (
              <Link
                key={t.key}
                href={`/orders?tab=${t.key}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "6px 14px", borderRadius: 99, fontSize: "12px", fontWeight: 700,
                  textDecoration: "none",
                  background: isActive ? "#14B8A6" : "var(--card-bg)",
                  color: isActive ? "#fff" : isUrgent ? "#d97706" : "var(--text-muted)",
                  border: `1px solid ${isActive ? "#14B8A6" : isUrgent ? "rgba(245,158,11,0.35)" : "var(--card-border)"}`,
                }}
              >
                {t.label}
                {count > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, borderRadius: 99, padding: "1px 6px",
                    background: isActive ? "rgba(255,255,255,0.25)" : t.key === "disputes" ? "#ef444420" : isUrgent ? "#f59e0b20" : "rgba(var(--foreground-rgb),0.06)",
                    color: isActive ? "#fff" : t.key === "disputes" ? "#ef4444" : isUrgent ? "#d97706" : "var(--text-muted)",
                  }}>
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Order list */}
        {listToShow.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {listToShow.map((o) => (
              <OrderCard key={`${o.id}-${o.role}`} order={o} role={o.role} other={o.other} />
            ))}
          </div>
        )}

      </div>
    </main>
  );
}

// ── Order Card ──────────────────────────────────────────────────────────────
function OrderCard({ order, role, other }: { order: any; role: "buyer" | "seller"; other: any }) {
  const hasEscrow  = !!order.txHash;
  const color      = statusColor(order.status, role);
  const label      = statusLabel(order.status, role);
  const escrow     = hasEscrow ? escrowLabel(order.status) : { text: "No escrow", color: "#94a3b8" };
  const cta        = primaryCta(order.status, role, order.id);
  const stepIdx    = stepIndex(order.status, hasEscrow);
  const totalSteps = hasEscrow ? 5 : 4;
  const isUrgent   = cta?.urgent ?? false;
  const otherName = other?.name ?? other?.twitterHandle ?? "Unknown";
  const counterpartRole = role === "buyer" ? "Freelancer" : "Client";

  return (
    <div className="ord-card" style={{
      borderRadius: 14,
      border: `1px solid ${isUrgent ? `${color}55` : "var(--card-border)"}`,
      background: "var(--card-bg)",
      overflow: "hidden",
      boxShadow: isUrgent ? `0 0 0 1px ${color}22, 0 2px 8px rgba(0,0,0,0.06)` : "0 1px 4px rgba(0,0,0,0.04)",
    }}>

      {/* Urgent banner */}
      {isUrgent && (
        <div style={{ background: `${color}12`, borderBottom: `1px solid ${color}30`, padding: "6px 16px", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0, animation: "availPulse 2s ease-in-out infinite" }} />
          <span style={{ fontSize: "11px", fontWeight: 700, color }}>Action required — {label}</span>
        </div>
      )}

      <div style={{ padding: "1rem 1.25rem", display: "flex", alignItems: "flex-start", gap: "1rem" }}>

        {/* Avatar */}
        <div style={{ width: 42, height: 42, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "rgba(var(--foreground-rgb),0.06)", border: "1px solid var(--card-border)" }}>
          {other?.image && <img src={other.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Top row: gig title + amount */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--foreground)", lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>
              {order.gig.title}
            </div>
            <div style={{ fontWeight: 800, fontSize: "15px", color: "var(--foreground)", flexShrink: 0 }}>
              ${order.amount}
            </div>
          </div>

          {/* Role + counterpart */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "2px 7px", borderRadius: 99, background: role === "buyer" ? "rgba(59,130,246,0.1)" : "rgba(20,184,166,0.1)", color: role === "buyer" ? "#3b82f6" : "#14B8A6", border: `1px solid ${role === "buyer" ? "rgba(59,130,246,0.2)" : "rgba(20,184,166,0.2)"}` }}>
              You · {role === "buyer" ? "Buyer" : "Seller"}
            </span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {counterpartRole}: <span style={{ fontWeight: 600, color: "var(--foreground)" }}>{otherName}</span>
            </span>
            {order.gig.category && (
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>· {order.gig.category}</span>
            )}
          </div>

          {/* Status + escrow row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            {/* Status pill */}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 99, background: `${color}15`, border: `1px solid ${color}40` }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }} />
              <span style={{ fontSize: "11px", fontWeight: 600, color }}>{label}</span>
            </span>

            {/* Escrow badge */}
            <span style={{ fontSize: "11px", fontWeight: 600, color: escrow.color, display: "flex", alignItems: "center", gap: 4 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              {escrow.text}
            </span>

            {/* Step progress */}
            {stepIdx > 0 && order.status !== "cancelled" && order.status !== "disputed" && (
              <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "auto", flexShrink: 0 }}>
                Step {stepIdx}/{totalSteps}
              </span>
            )}
          </div>

          {/* Progress bar */}
          {stepIdx > 0 && order.status !== "cancelled" && order.status !== "disputed" && (
            <div style={{ marginTop: 8, height: 3, background: "var(--card-border)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(stepIdx / totalSteps) * 100}%`, background: stepIdx === totalSteps ? "#22c55e" : color, borderRadius: 99, transition: "width 0.4s" }} />
            </div>
          )}

        </div>
      </div>

      {/* Action footer */}
      {cta && (
        <div className="ord-footer" style={{ borderTop: "1px solid var(--card-border)", padding: "0.65rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Updated {timeAgo(order.updatedAt)}
          </span>
          <Link
            href={cta.href}
            className="ord-cta-btn"
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "6px 16px", borderRadius: 8, fontSize: "12px", fontWeight: 700,
              textDecoration: "none",
              background: isUrgent ? color : "var(--background)",
              color: isUrgent ? "#fff" : color,
              border: `1px solid ${color}`,
              flexShrink: 0,
            }}
          >
            {cta.label} →
          </Link>
        </div>
      )}

    </div>
  );
}

// ── Empty state ─────────────────────────────────────────────────────────────
function EmptyState({ tab }: { tab: Tab }) {
  const msgs: Record<Tab, { title: string; sub: string; link?: { href: string; label: string } }> = {
    all:       { title: "No orders yet",              sub: "Orders you place or receive will appear here.",        link: { href: "/talent", label: "Browse talent →" } },
    active:    { title: "No active orders",           sub: "Start by hiring a freelancer or posting a service.",   link: { href: "/talent", label: "Browse talent →" } },
    waiting:   { title: "Nothing needs your action",  sub: "You're all caught up." },
    completed: { title: "No completed orders yet",    sub: "Completed orders will appear here once paid out." },
    disputes:  { title: "No disputes",                sub: "Disputes are raised when buyer and seller disagree. Good luck staying out of here." },
  };
  const m = msgs[tab];
  return (
    <div style={{ padding: "2.5rem 1.5rem", borderRadius: 14, border: "1px solid var(--card-border)", background: "var(--card-bg)", textAlign: "center" }}>
      <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--foreground)", marginBottom: 6 }}>{m.title}</div>
      <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: m.link ? "1rem" : 0 }}>{m.sub}</div>
      {m.link && (
        <Link href={m.link.href} style={{ fontSize: "13px", fontWeight: 700, color: "#14B8A6", textDecoration: "none" }}>
          {m.link.label}
        </Link>
      )}
    </div>
  );
}

// ── Time ago helper ─────────────────────────────────────────────────────────
function timeAgo(date: Date | string): string {
  const diffMs  = Date.now() - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr  = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffMin < 2)   return "just now";
  if (diffMin < 60)  return `${diffMin}m ago`;
  if (diffHr  < 24)  return `${diffHr}h ago`;
  if (diffDay < 7)   return `${diffDay}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
