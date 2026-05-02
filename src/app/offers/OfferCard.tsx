"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { respondToOffer, withdrawOffer } from "@/actions/offers";

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:  { label: "Pending",  color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)"  },
  accepted: { label: "Accepted", color: "#14B8A6", bg: "rgba(20,184,166,0.08)",  border: "rgba(20,184,166,0.2)"  },
  declined: { label: "Declined", color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)"   },
};

export default function OfferCard({ offer: initialOffer, type }: { offer: any; type: "sent" | "received" }) {
  const [offer, setOffer] = useState(initialOffer);
  const [withdrawn, setWithdrawn] = useState(false);
  const [responding, setResponding] = useState<"accept" | "decline" | "withdraw" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const cfg = STATUS_CFG[offer.status] ?? STATUS_CFG.pending;
  const counterpart = type === "sent" ? offer.receiver : offer.sender;
  const displayName = counterpart?.name ?? counterpart?.twitterHandle ?? "Unknown";

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

  const hints: Record<string, Record<string, string>> = {
    pending: {
      sent: "Waiting for the other party to accept. You can follow up in the chat.",
      received: "Action required — accept or decline this offer.",
    },
    accepted: {
      sent: "Accepted. Go to the order to fund escrow and start work.",
      received: "Accepted. The client will fund the escrow — check the order for updates.",
    },
    declined: {
      sent: "This offer was declined. You can send a revised offer in the chat.",
      received: "You declined this offer. Open the chat to negotiate.",
    },
  };
  const hint = hints[offer.status]?.[type];
  const hintColor = offer.status === "pending" && type === "received" ? "#f59e0b" : "var(--text-muted)";

  return (
    <div style={{
      background: "var(--card-bg)",
      border: "1px solid var(--card-border)",
      borderRadius: 16,
      padding: "1.25rem 1.5rem",
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
              background: "#14B8A6", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {counterpart?.image
                ? <img src={counterpart.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{displayName[0]?.toUpperCase()}</span>
              }
            </div>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>{displayName}</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6 }}>
                {type === "sent" ? "— you sent" : "— sent to you"}
              </span>
            </div>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>{offer.title}</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {offer.description}
          </div>
        </div>

        <span style={{
          fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
          background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
          flexShrink: 0, whiteSpace: "nowrap",
        }}>
          {cfg.label}
        </span>
      </div>

      {/* Amount + delivery + date */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: "#14B8A6" }}>${offer.amount}</span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {offer.deliveryDays} day{offer.deliveryDays !== 1 ? "s" : ""} delivery
        </span>
        <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>
          {new Date(offer.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Hint */}
      {hint && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: "0.55rem 0.75rem", borderRadius: 8, background: "var(--background)", border: "1px solid var(--card-border)" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={hintColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span style={{ fontSize: 12, color: hintColor, lineHeight: 1.5 }}>{hint}</span>
        </div>
      )}

      {/* Inline Accept/Decline for pending received */}
      {offer.status === "pending" && type === "received" && (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => respond("decline")}
            disabled={!!responding || isPending}
            style={{
              flex: 1, padding: "9px 0", borderRadius: 9, fontSize: 13, fontWeight: 700,
              border: "1px solid var(--card-border)", background: "transparent",
              color: "var(--text-muted)", cursor: "pointer", fontFamily: "inherit",
              opacity: responding === "decline" ? 0.6 : 1,
            }}
          >
            {responding === "decline" ? "..." : "Decline"}
          </button>
          <button
            onClick={() => respond("accept")}
            disabled={!!responding || isPending}
            style={{
              flex: 2, padding: "9px 0", borderRadius: 9, fontSize: 13, fontWeight: 700,
              border: "none", background: "#14B8A6", color: "#fff",
              cursor: "pointer", fontFamily: "inherit",
              opacity: responding === "accept" ? 0.7 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            {responding === "accept" ? "Accepting..." : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Accept Offer
              </>
            )}
          </button>
        </div>
      )}

      {error && <p style={{ margin: 0, fontSize: 12, color: "#ef4444", textAlign: "center" }}>{error}</p>}

      {/* CTA row */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Link
          href={`/messages/${offer.conversationId}`}
          style={{
            padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: "transparent", border: "1px solid var(--card-border)",
            color: "var(--text-muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5,
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          View Chat
        </Link>

        {/* Accepted — link to order */}
        {offer.status === "accepted" && offer.order?.id && (
          <Link
            href={`/orders/${offer.order.id}`}
            style={{
              padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: "#14B8A6", color: "#fff", textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 5,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            {type === "sent" ? "Fund Escrow →" : "View Order →"}
          </Link>
        )}

        {/* Declined sender → resend */}
        {offer.status === "declined" && type === "sent" && (
          <Link
            href={`/messages/${offer.conversationId}`}
            style={{
              padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: "rgba(245,158,11,0.1)", color: "#d97706",
              border: "1px solid rgba(245,158,11,0.2)", textDecoration: "none",
            }}
          >
            Send New Offer →
          </Link>
        )}

        {/* Pending sent or declined received → view offer process link */}
        {(offer.status === "pending" && type === "sent") ||
         (offer.status === "declined" && type === "received") ? (
          <Link
            href={`/messages/${offer.conversationId}`}
            style={{
              padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: "rgba(20,184,166,0.08)", color: "#14B8A6",
              border: "1px solid rgba(20,184,166,0.2)", textDecoration: "none",
            }}
          >
            View Offer in Chat →
          </Link>
        ) : null}

        {/* Withdraw — only sender, only while pending */}
        {offer.status === "pending" && type === "sent" && (
          <button
            onClick={withdraw}
            disabled={!!responding || isPending}
            style={{
              padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: "transparent", color: "#ef4444",
              border: "1px solid rgba(239,68,68,0.3)",
              cursor: responding === "withdraw" ? "not-allowed" : "pointer",
              opacity: responding === "withdraw" ? 0.5 : 1,
              fontFamily: "inherit",
            }}
          >
            {responding === "withdraw" ? "Withdrawing…" : "Withdraw Offer"}
          </button>
        )}
      </div>
    </div>
  );
}
