"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { respondToOffer, withdrawOffer } from "@/actions/offers";

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:  { label: "Pending",  color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)"  },
  accepted: { label: "Accepted", color: "#14B8A6", bg: "rgba(20,184,166,0.08)",  border: "rgba(20,184,166,0.2)"  },
  declined: { label: "Declined", color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)"   },
};

function timeAgo(date: string | Date) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "just now";
}

export default function OfferCard({ offer: initialOffer, type }: { offer: any; type: "sent" | "received" }) {
  const [offer, setOffer]         = useState(initialOffer);
  const [withdrawn, setWithdrawn] = useState(false);
  const [responding, setResponding] = useState<"accept" | "decline" | "withdraw" | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const cfg         = STATUS_CFG[offer.status] ?? STATUS_CFG.pending;
  const counterpart = type === "sent" ? offer.receiver : offer.sender;
  const displayName = counterpart?.name ?? counterpart?.twitterHandle ?? "Unknown";

  const servicePrice = offer.amount;
  const platformFee  = Math.floor((servicePrice * 1_000) / 10_000);
  const totalPayment = servicePrice + platformFee;

  const isPendingReceived = offer.status === "pending" && type === "received";

  function respond(action: "accept" | "decline") {
    setResponding(action);
    setError(null);
    startTransition(async () => {
      try {
        const res = await respondToOffer(offer.id, action);
        if ("error" in res) { setError(res.error); return; }
        setOffer((prev: any) => ({
          ...prev,
          status: res.status,
          order: res.status === "accepted" && res.orderId ? { id: res.orderId } : prev.order,
        }));
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setResponding(null);
      }
    });
  }

  function withdraw() {
    if (!confirm("Withdraw this offer? It will be permanently deleted.")) return;
    setResponding("withdraw");
    setError(null);
    startTransition(async () => {
      try {
        const res = await withdrawOffer(offer.id);
        if (!res.ok) { setError(res.error ?? "Failed to withdraw."); return; }
        setWithdrawn(true);
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setResponding(null);
      }
    });
  }

  if (withdrawn) return null;

  return (
    <div style={{
      background: "var(--card-bg)",
      border: `1px solid ${isPendingReceived ? "rgba(245,158,11,0.3)" : "var(--card-border)"}`,
      borderRadius: 14,
      padding: "0.95rem 1.2rem",
      display: "flex", flexDirection: "column", gap: 8,
    }}>

      {/* ── Row 1: Avatar + name + role  |  amount + status ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0, flex: 1, overflow: "hidden" }}>
          <div style={{
            width: 26, height: 26, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
            background: "#14B8A6", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {counterpart?.image
              ? <img src={counterpart.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>{displayName[0]?.toUpperCase()}</span>
            }
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayName}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>
            {type === "sent" ? "· you sent" : "· sent to you"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: "#14B8A6" }}>${offer.amount}</span>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 99,
            background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
            whiteSpace: "nowrap",
          }}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* ── Row 2: Title  |  delivery · age ── */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <div style={{
          fontSize: 14, fontWeight: 700, color: "var(--foreground)",
          flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {offer.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {offer.deliveryDays}d
          </span>
          <span style={{ fontSize: 10, color: "var(--card-border)" }}>·</span>
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{timeAgo(offer.createdAt)}</span>
        </div>
      </div>

      {/* ── Row 3: Description ── */}
      {offer.description && (
        <div style={{
          fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 1, WebkitBoxOrient: "vertical",
        }}>
          {offer.description}
        </div>
      )}

      {/* ── Row 4: Compact fee breakdown ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
        padding: "6px 10px", borderRadius: 8,
        background: "rgba(20,184,166,0.04)", border: "1px solid rgba(20,184,166,0.09)",
      }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
          Service&nbsp;<strong style={{ color: "var(--foreground)", fontWeight: 700 }}>${servicePrice}</strong>
        </span>
        <span style={{ fontSize: 10, color: "var(--text-muted)", opacity: 0.4 }}>·</span>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
          Fee&nbsp;<strong style={{ fontWeight: 600 }}>+${platformFee}</strong>
        </span>
        <span style={{ fontSize: 10, color: "var(--text-muted)", opacity: 0.4 }}>·</span>
        <span style={{ fontSize: 11, color: "var(--foreground)", fontWeight: 700 }}>
          Total&nbsp;<strong style={{ color: "#14B8A6" }}>${totalPayment}</strong>
        </span>
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span style={{ fontSize: 10, color: "#14B8A6" }}>Escrow secured</span>
        </span>
      </div>

      {/* ── Row 5: Status hint ── */}
      {isPendingReceived && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "5px 9px", borderRadius: 7,
          background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)",
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span style={{ fontSize: 11, color: "#f59e0b" }}>Action required — accept or decline this offer.</span>
        </div>
      )}
      {offer.status === "accepted" && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "5px 9px", borderRadius: 7,
          background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.12)",
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span style={{ fontSize: 11, color: "#14B8A6" }}>
            {type === "sent"
              ? "Accepted. Go to the order to fund escrow and start work."
              : "Accepted. The client will fund the escrow — check the order for updates."}
          </span>
        </div>
      )}

      {error && <p style={{ margin: 0, fontSize: 12, color: "#ef4444" }}>{error}</p>}

      {/* ── Row 6: Actions ── */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <Link
          href={`/messages/${offer.conversationId}`}
          style={{
            padding: "6px 12px", borderRadius: 7, fontSize: 11, fontWeight: 600,
            background: "transparent", border: "1px solid var(--card-border)",
            color: "var(--text-muted)", textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: 4,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Chat
        </Link>

        {offer.status === "accepted" && offer.order?.id && (
          <Link
            href={`/orders/${offer.order.id}`}
            style={{
              padding: "6px 14px", borderRadius: 7, fontSize: 11, fontWeight: 700,
              background: "#14B8A6", color: "#fff", textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 4,
            }}
          >
            {type === "sent" ? "Fund Escrow →" : "View Order →"}
          </Link>
        )}

        {isPendingReceived && (
          <>
            <button
              onClick={() => respond("decline")}
              disabled={!!responding || isPending}
              style={{
                padding: "6px 14px", borderRadius: 7, fontSize: 11, fontWeight: 700,
                border: "1px solid var(--card-border)", background: "transparent",
                color: "var(--text-muted)", cursor: "pointer", fontFamily: "inherit",
                opacity: responding === "decline" ? 0.6 : 1,
              }}
            >
              {responding === "decline" ? "…" : "Decline"}
            </button>
            <button
              onClick={() => respond("accept")}
              disabled={!!responding || isPending}
              style={{
                padding: "6px 16px", borderRadius: 7, fontSize: 11, fontWeight: 700,
                border: "none", background: "#14B8A6", color: "#fff",
                cursor: "pointer", fontFamily: "inherit",
                opacity: responding === "accept" ? 0.7 : 1,
                display: "inline-flex", alignItems: "center", gap: 5,
              }}
            >
              {responding === "accept" ? "Accepting…" : (
                <>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Accept
                </>
              )}
            </button>
          </>
        )}

        {offer.status === "declined" && type === "sent" && (
          <Link
            href={`/messages/${offer.conversationId}`}
            style={{
              padding: "6px 14px", borderRadius: 7, fontSize: 11, fontWeight: 700,
              background: "rgba(245,158,11,0.08)", color: "#d97706",
              border: "1px solid rgba(245,158,11,0.2)", textDecoration: "none",
            }}
          >
            Send New Offer →
          </Link>
        )}

        {offer.status === "pending" && type === "sent" && (
          <>
            <Link
              href={`/messages/${offer.conversationId}`}
              style={{
                padding: "6px 14px", borderRadius: 7, fontSize: 11, fontWeight: 700,
                background: "rgba(20,184,166,0.07)", color: "#14B8A6",
                border: "1px solid rgba(20,184,166,0.18)", textDecoration: "none",
              }}
            >
              View in Chat
            </Link>
            <button
              onClick={withdraw}
              disabled={!!responding || isPending}
              style={{
                padding: "6px 12px", borderRadius: 7, fontSize: 11, fontWeight: 600,
                background: "transparent", color: "#ef4444",
                border: "1px solid rgba(239,68,68,0.25)",
                cursor: responding === "withdraw" ? "not-allowed" : "pointer",
                opacity: responding === "withdraw" ? 0.5 : 1,
                fontFamily: "inherit",
              }}
            >
              {responding === "withdraw" ? "…" : "Withdraw"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
