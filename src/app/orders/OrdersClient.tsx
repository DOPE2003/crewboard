"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type FilterKey = "all" | "active" | "waiting" | "completed" | "disputes" | "cancelled";

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: Date | string): string {
  const ms  = Date.now() - new Date(date).getTime();
  const min = Math.floor(ms / 60_000);
  const hr  = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (min < 2)  return "just now";
  if (min < 60) return `${min}m ago`;
  if (hr  < 24) return `${hr}h ago`;
  if (day <  7) return `${day}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function escrowLabel(status: string): { text: string; color: string } {
  if (["funded", "accepted", "delivered"].includes(status)) return { text: "Locked",     color: "#3b82f6" };
  if (status === "completed") return { text: "Released",   color: "#22c55e" };
  if (status === "cancelled") return { text: "Returned",   color: "#94a3b8" };
  if (status === "disputed")  return { text: "Frozen",     color: "#ef4444" };
  return                             { text: "Not funded", color: "#94a3b8" };
}

function statusLabel(status: string, role: "buyer" | "seller"): string {
  if (status === "pending")   return role === "buyer" ? "Awaiting acceptance"       : "New order — action needed";
  if (status === "funded")    return role === "buyer" ? "Escrow locked"             : "Funded — accept to start";
  if (status === "accepted")  return "In progress";
  if (status === "delivered") return role === "buyer" ? "Delivered — release payment" : "Awaiting approval";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  if (status === "disputed")  return "Dispute open";
  return status;
}

function statusColor(status: string, role: "buyer" | "seller"): string {
  if (status === "delivered" && role === "buyer")  return "#8b5cf6";
  if (status === "funded"    && role === "seller") return "#f59e0b";
  if (status === "pending"   && role === "seller") return "#f59e0b";
  const map: Record<string, string> = {
    pending: "#94a3b8", funded: "#3b82f6", accepted: "#3b82f6",
    delivered: "#8b5cf6", completed: "#22c55e", cancelled: "#94a3b8", disputed: "#ef4444",
  };
  return map[status] ?? "#94a3b8";
}

function primaryCta(status: string, role: "buyer" | "seller", orderId: string): { label: string; href: string; urgent: boolean } | null {
  const href = `/orders/${orderId}`;
  if (status === "pending"   && role === "seller") return { label: "Accept Order",       href, urgent: true  };
  if (status === "pending"   && role === "buyer")  return { label: "View Order",         href, urgent: false };
  if (status === "funded"    && role === "seller") return { label: "Accept & Start",     href, urgent: true  };
  if (status === "funded"    && role === "buyer")  return { label: "View Progress",      href, urgent: false };
  if (status === "accepted"  && role === "seller") return { label: "Submit Delivery",    href, urgent: false };
  if (status === "accepted"  && role === "buyer")  return { label: "View Progress",      href, urgent: false };
  if (status === "delivered" && role === "buyer")  return { label: "Review & Release",   href, urgent: true  };
  if (status === "delivered" && role === "seller") return { label: "View Delivery",      href, urgent: false };
  if (status === "completed")                      return { label: "View Order",         href, urgent: false };
  if (status === "disputed")                       return { label: "View Dispute",       href, urgent: true  };
  return null;
}

function isWaitingForMe(status: string, role: "buyer" | "seller"): boolean {
  if (role === "buyer"  && status === "delivered") return true;
  if (role === "seller" && (status === "pending" || status === "funded" || status === "accepted")) return true;
  if (status === "disputed") return true;
  return false;
}

function stepIndex(status: string, hasEscrow: boolean): number {
  const steps = hasEscrow
    ? ["pending", "funded", "accepted", "delivered", "completed"]
    : ["pending", "accepted", "delivered", "completed"];
  const idx = steps.indexOf(status);
  return idx >= 0 ? idx + 1 : 0;
}

// ── Nav icons ─────────────────────────────────────────────────────────────────

const NAV_CFG: {
  key: FilterKey;
  label: string;
  icon: React.ReactNode;
  accent?: string;
}[] = [
  {
    key: "all", label: "All Orders",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  },
  {
    key: "active", label: "Active",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  },
  {
    key: "waiting", label: "Waiting For Me",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    accent: "#f59e0b",
  },
  {
    key: "completed", label: "Completed",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  },
  {
    key: "disputes", label: "Disputes",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    accent: "#ef4444",
  },
  {
    key: "cancelled", label: "Cancelled",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  },
];

// ── Main client component ─────────────────────────────────────────────────────

export default function OrdersClient({ orders }: { orders: any[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const counts = useMemo(() => ({
    all:       orders.length,
    active:    orders.filter(o => ["pending","funded","accepted","delivered"].includes(o.status)).length,
    waiting:   orders.filter(o => isWaitingForMe(o.status, o.role)).length,
    completed: orders.filter(o => o.status === "completed").length,
    disputes:  orders.filter(o => o.status === "disputed").length,
    cancelled: orders.filter(o => o.status === "cancelled").length,
  }), [orders]);

  const filtered = useMemo(() => {
    let list: any[];
    switch (filter) {
      case "active":    list = orders.filter(o => ["pending","funded","accepted","delivered"].includes(o.status)); break;
      case "waiting":   list = orders.filter(o => isWaitingForMe(o.status, o.role)); break;
      case "completed": list = orders.filter(o => o.status === "completed"); break;
      case "disputes":  list = orders.filter(o => o.status === "disputed"); break;
      case "cancelled": list = orders.filter(o => o.status === "cancelled"); break;
      default:          list = [...orders];
    }
    return list.sort((a, b) => {
      const aw = isWaitingForMe(a.status, a.role) ? 0 : 1;
      const bw = isWaitingForMe(b.status, b.role) ? 0 : 1;
      if (aw !== bw) return aw - bw;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [orders, filter]);

  const activeCfg = NAV_CFG.find(n => n.key === filter)!;

  return (
    <>
      <style>{`
        @media (max-width: 720px) {
          .ord-sidebar  { display: none !important; }
          .ord-mob-tabs { display: flex !important; }
        }
      `}</style>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>

        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside
          className="ord-sidebar"
          style={{
            width: 210,
            flexShrink: 0,
            borderRight: "1px solid var(--card-border)",
            padding: "1.25rem 0.5rem 2rem",
            position: "sticky",
            top: "5rem",
            alignSelf: "flex-start",
          }}
        >
          <div style={{
            fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.15em",
            textTransform: "uppercase", color: "var(--text-muted)",
            padding: "0 0.5rem", marginBottom: "0.4rem",
          }}>
            Filter
          </div>

          {NAV_CFG.map(item => {
            const count    = counts[item.key];
            const isActive = filter === item.key;
            const hasAlert = item.accent && count > 0;
            const fg = isActive ? "#14B8A6" : hasAlert ? item.accent! : "var(--text-muted)";

            return (
              <button
                key={item.key}
                onClick={() => setFilter(item.key)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 8,
                  padding: "0.5rem 0.6rem", borderRadius: 8,
                  border: "none",
                  background: isActive ? "rgba(20,184,166,0.08)" : "transparent",
                  color: fg,
                  fontFamily: "inherit",
                  fontSize: "0.8rem", fontWeight: isActive ? 700 : 500,
                  cursor: "pointer", textAlign: "left",
                  transition: "background 0.1s",
                }}
              >
                <span style={{ flexShrink: 0, opacity: isActive ? 1 : 0.65 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {count > 0 && (
                  <span style={{
                    fontSize: "0.58rem", fontWeight: 700, padding: "1px 6px", borderRadius: 99,
                    background: isActive
                      ? "rgba(20,184,166,0.15)"
                      : item.key === "waiting"
                        ? "rgba(245,158,11,0.1)"
                        : item.key === "disputes"
                          ? "rgba(239,68,68,0.08)"
                          : "rgba(128,128,128,0.07)",
                    color: fg,
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* ── Content ──────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0, padding: "1.25rem 1.25rem 3rem" }}>

          {/* Mobile scrollable tabs */}
          <div
            className="ord-mob-tabs"
            style={{ display: "none", gap: 6, marginBottom: "1rem", overflowX: "auto", paddingBottom: 2 }}
          >
            {NAV_CFG.map(item => {
              const count    = counts[item.key];
              const isActive = filter === item.key;
              const hasAlert = item.accent && count > 0;
              return (
                <button
                  key={item.key}
                  onClick={() => setFilter(item.key)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "5px 12px", borderRadius: 99, flexShrink: 0,
                    border: `1px solid ${isActive ? "rgba(20,184,166,0.4)" : hasAlert ? `${item.accent}40` : "var(--card-border)"}`,
                    background: isActive ? "rgba(20,184,166,0.08)" : "transparent",
                    color: isActive ? "#14B8A6" : hasAlert ? item.accent! : "var(--text-muted)",
                    fontSize: "0.72rem", fontWeight: isActive ? 700 : 500,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {item.label}
                  {count > 0 && (
                    <span style={{
                      fontSize: "0.6rem", fontWeight: 700,
                      background: "rgba(128,128,128,0.1)", padding: "0 5px", borderRadius: 99,
                      color: "inherit",
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Section heading */}
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "0.9rem" }}>
            <div>
              <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "var(--foreground)" }}>
                {activeCfg.label}
              </span>
              {filter === "waiting" && filtered.length > 0 && (
                <span style={{ fontSize: "0.7rem", color: "#f59e0b", fontWeight: 600, marginLeft: 8 }}>
                  {filtered.length} need{filtered.length === 1 ? "s" : ""} attention
                </span>
              )}
            </div>
            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
              {filtered.length} order{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
              {filtered.map(o => (
                <OrderCard key={`${o.id}-${o.role}`} order={o} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Order Card ─────────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: any }) {
  const { role, other } = order;
  const hasEscrow  = !!order.txHash;
  const color      = statusColor(order.status, role);
  const label      = statusLabel(order.status, role);
  const escrow     = escrowLabel(order.status);
  const cta        = primaryCta(order.status, role, order.id);
  const stepIdx    = stepIndex(order.status, hasEscrow);
  const totalSteps = hasEscrow ? 5 : 4;
  const isUrgent   = cta?.urgent ?? false;
  const otherName  = other?.name ?? other?.twitterHandle ?? "Unknown";

  const platformFee  = Math.floor((order.amount * 1_000) / 10_000);
  const totalPayment = order.amount + platformFee;

  return (
    <div style={{
      borderRadius: 12,
      border: `1px solid ${isUrgent ? `${color}45` : "var(--card-border)"}`,
      background: "var(--card-bg)",
      overflow: "hidden",
    }}>

      {/* Urgent banner */}
      {isUrgent && (
        <div style={{
          background: `${color}0d`, borderBottom: `1px solid ${color}25`,
          padding: "4px 14px", display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }} />
          <span style={{ fontSize: "10px", fontWeight: 700, color }}>{label}</span>
        </div>
      )}

      <div style={{ padding: "0.8rem 1rem", display: "flex", gap: "0.8rem", alignItems: "flex-start" }}>

        {/* Avatar */}
        <div style={{
          width: 34, height: 34, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
          background: "rgba(20,184,166,0.08)", border: "1px solid var(--card-border)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {other?.image
            ? <img src={other.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: 11, fontWeight: 700, color: "#14B8A6" }}>{otherName[0]?.toUpperCase()}</span>
          }
        </div>

        {/* Body */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Row 1: Title + amounts */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <div style={{
              fontSize: "13px", fontWeight: 700, color: "var(--foreground)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
            }}>
              {order.gig.title}
            </div>
            <div style={{ flexShrink: 0, textAlign: "right" }}>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--foreground)" }}>${order.amount}</div>
              <div style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: 1 }}>+${platformFee} fee · ${totalPayment} total</div>
            </div>
          </div>

          {/* Row 2: Role + counterpart */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
            <span style={{
              fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
              padding: "2px 6px", borderRadius: 99,
              background: role === "buyer" ? "rgba(59,130,246,0.08)" : "rgba(20,184,166,0.08)",
              color: role === "buyer" ? "#3b82f6" : "#14B8A6",
              border: `1px solid ${role === "buyer" ? "rgba(59,130,246,0.18)" : "rgba(20,184,166,0.18)"}`,
            }}>
              {role === "buyer" ? "Client" : "Freelancer"}
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              with <span style={{ fontWeight: 600, color: "var(--foreground)" }}>{otherName}</span>
            </span>
            {order.gig.category && (
              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>· {order.gig.category}</span>
            )}
          </div>

          {/* Row 3: Status + escrow + progress step */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7, flexWrap: "wrap" }}>
            {!isUrgent && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 3,
                padding: "2px 7px", borderRadius: 99,
                background: `${color}10`, border: `1px solid ${color}30`,
              }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: color }} />
                <span style={{ fontSize: "10px", fontWeight: 600, color }}>{label}</span>
              </span>
            )}

            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: "10px", fontWeight: 600, color: escrow.color }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              {escrow.text}
            </span>

            {stepIdx > 0 && !["cancelled","disputed"].includes(order.status) && (
              <span style={{ fontSize: "10px", color: "var(--text-muted)", marginLeft: "auto" }}>
                step {stepIdx}/{totalSteps}
              </span>
            )}
          </div>

          {/* Progress bar */}
          {stepIdx > 0 && !["cancelled","disputed"].includes(order.status) && (
            <div style={{ marginTop: 6, height: 2, background: "var(--card-border)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${(stepIdx / totalSteps) * 100}%`,
                background: stepIdx === totalSteps ? "#22c55e" : color,
                borderRadius: 99,
                transition: "width 0.3s",
              }} />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        borderTop: "1px solid var(--card-border)",
        padding: "0.5rem 1rem",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
      }}>
        <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
          Updated {timeAgo(order.updatedAt)}
        </span>
        {cta && (
          <Link
            href={cta.href}
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "5px 13px", borderRadius: 7, fontSize: "11px", fontWeight: 700,
              textDecoration: "none",
              background: isUrgent ? color : "transparent",
              color: isUrgent ? "#fff" : color,
              border: `1px solid ${color}`,
              flexShrink: 0,
            }}
          >
            {cta.label} →
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: FilterKey }) {
  const msgs: Record<FilterKey, { title: string; sub: string; link?: { href: string; label: string } }> = {
    all:       { title: "No orders yet",             sub: "Orders you place or receive will appear here.", link: { href: "/talent", label: "Browse talent →" } },
    active:    { title: "No active orders",          sub: "Start by hiring a freelancer or posting a service.", link: { href: "/talent", label: "Browse talent →" } },
    waiting:   { title: "Nothing needs your action", sub: "You're all caught up." },
    completed: { title: "No completed orders yet",   sub: "Completed orders appear here once paid out." },
    disputes:  { title: "No disputes",               sub: "Disputes are raised when buyer and seller disagree." },
    cancelled: { title: "No cancelled orders",       sub: "Cancelled orders will appear here." },
  };
  const m = msgs[filter];
  return (
    <div style={{
      padding: "2.5rem 1.5rem", borderRadius: 12, textAlign: "center",
      border: "1px solid var(--card-border)", background: "var(--card-bg)",
    }}>
      <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--foreground)", marginBottom: 5 }}>{m.title}</div>
      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: m.link ? "0.85rem" : 0 }}>{m.sub}</div>
      {m.link && (
        <Link href={m.link.href} style={{ fontSize: "12px", fontWeight: 700, color: "#14B8A6", textDecoration: "none" }}>
          {m.link.label}
        </Link>
      )}
    </div>
  );
}
