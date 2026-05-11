"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sendOfferFromProfile } from "@/actions/offers";

interface Props {
  recipientId: string;
  recipientName: string;
  onClose: () => void;
}

export default function SendOfferModal({ recipientId, recipientName, onClose }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [days, setDays] = useState("");
  const [paymentType, setPaymentType] = useState<"single" | "milestone">("single");

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const amt = parseInt(amount, 10);
    const d = parseInt(days, 10);
    if (!title.trim() || !description.trim() || isNaN(amt) || isNaN(d)) {
      setError("Please fill in all fields.");
      return;
    }
    startTransition(async () => {
      try {
        const { conversationId } = await sendOfferFromProfile(recipientId, {
          title: title.trim(),
          description: description.trim(),
          amount: amt,
          deliveryDays: d,
        });
        onClose();
        router.push(`/messages/${conversationId}`);
      } catch (err: any) {
        setError(err?.message ?? "Something went wrong. Try again.");
      }
    });
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    background: "var(--background)",
    border: "1px solid var(--card-border)",
    borderRadius: 10,
    color: "var(--foreground)",
    fontSize: "0.875rem",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div style={{
        background: "var(--dropdown-bg)",
        border: "1px solid var(--card-border)",
        borderRadius: 18,
        padding: "1.75rem",
        width: "100%",
        maxWidth: 520,
        boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
        animation: "of-slide-in 0.18s ease",
      }}>
        <style>{`
          @keyframes of-slide-in {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes of-spin {
            to { transform: rotate(360deg); }
          }
        `}</style>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "var(--foreground)" }}>
              Send Offer
            </h2>
            <p style={{ margin: "3px 0 0", fontSize: "0.78rem", color: "var(--text-muted)" }}>
              to {recipientName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-muted)", padding: 4, borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Title */}
          <div>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
              Job Title
            </label>
            <input
              style={inputStyle}
              placeholder="e.g. Build a Solana staking dashboard"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={120}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
              Description
            </label>
            <textarea
              style={{ ...inputStyle, resize: "vertical", minHeight: 100 }}
              placeholder="Describe the work, requirements, and any important details..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={2000}
            />
          </div>

          {/* Payment type */}
          <div>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
              Payment Type
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {(["single", "milestone"] as const).map(pt => {
                const active = paymentType === pt;
                return (
                  <button
                    key={pt}
                    type="button"
                    onClick={() => setPaymentType(pt)}
                    style={{
                      padding: "9px 12px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                      border: `1px solid ${active ? "rgba(20,184,166,0.5)" : "var(--card-border)"}`,
                      background: active ? "rgba(20,184,166,0.08)" : "var(--background)",
                      color: active ? "#14b8a6" : "var(--text-muted)",
                      fontWeight: active ? 700 : 500, fontSize: "0.8rem",
                      display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2,
                      transition: "all 0.12s",
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>{pt === "single" ? "Single Payment" : "Milestones"}</span>
                    <span style={{ fontSize: "0.66rem", opacity: 0.7 }}>{pt === "single" ? "Pay in full upfront" : "Split into stages"}</span>
                  </button>
                );
              })}
            </div>
            {paymentType === "milestone" && (
              <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", fontSize: "0.72rem", color: "#d97706" }}>
                Milestone schedules are agreed in chat. Set the total budget below.
              </div>
            )}
          </div>

          {/* Amount + Delivery row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                Budget (USD)
              </label>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
                  color: "var(--text-muted)", fontSize: "0.875rem", pointerEvents: "none",
                }}>$</span>
                <input
                  style={{ ...inputStyle, paddingLeft: 26 }}
                  type="number"
                  min={1}
                  placeholder="500"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                Delivery (days)
              </label>
              <input
                style={inputStyle}
                type="number"
                min={1}
                placeholder="7"
                value={days}
                onChange={e => setDays(e.target.value)}
              />
            </div>
          </div>

          {/* Fee breakdown */}
          {Number(amount) > 0 && (() => {
            const servicePrice = parseInt(amount, 10);
            if (isNaN(servicePrice) || servicePrice <= 0) return null;
            const platformFee  = Math.floor((servicePrice * 1_000) / 10_000);
            const totalPayment = servicePrice + platformFee;
            return (
              <div style={{
                padding: "12px 14px", borderRadius: 10,
                background: "rgba(20,184,166,0.04)", border: "1px solid rgba(20,184,166,0.15)",
              }}>
                <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#14b8a6", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Payment Breakdown</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Service Price</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--foreground)" }}>${servicePrice}</span>
                  </div>
                  <div style={{ height: "1px", background: "rgba(20,184,166,0.12)", margin: "2px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Platform Fee <span style={{ fontSize: "0.65rem" }}>(10%)</span></span>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)" }}>+${platformFee}</span>
                  </div>
                  <div style={{ height: "1px", background: "rgba(20,184,166,0.12)", margin: "2px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--foreground)" }}>Total Payment</span>
                    <span style={{ fontSize: "1rem", fontWeight: 800, color: "#14b8a6" }}>${totalPayment}</span>
                  </div>
                </div>
                <div style={{ marginTop: 7, fontSize: "0.68rem", color: "#14b8a6", fontWeight: 600, textAlign: "center" }}>
                  Freelancer receives full amount.
                </div>
                <div style={{ marginTop: 7, display: "flex", alignItems: "flex-start", gap: 5 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span style={{ fontSize: "0.68rem", color: "#14b8a6", lineHeight: 1.4 }}>
                    Funds are securely held in escrow until work is approved.
                  </span>
                </div>
              </div>
            );
          })()}

          {/* How it works hint */}
          <div style={{
            padding: "10px 14px", borderRadius: 10,
            background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.15)",
          }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#14b8a6", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>How it works</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                "Offer lands in your shared conversation",
                "Freelancer accepts or declines",
                "Fund escrow — payment secured on-chain",
                "Release when work is delivered",
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{
                    width: 16, height: 16, borderRadius: "50%",
                    background: "rgba(20,184,166,0.15)", color: "#14b8a6",
                    fontSize: "0.55rem", fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
                  }}>{i + 1}</span>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.4 }}>{s}</span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p style={{ margin: 0, fontSize: "0.78rem", color: "#ef4444", fontWeight: 500 }}>{error}</p>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              style={{
                padding: "10px 20px", borderRadius: 10, fontSize: "0.82rem", fontWeight: 600,
                background: "transparent", border: "1px solid var(--card-border)",
                color: "var(--text-muted)", cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              style={{
                padding: "10px 24px", borderRadius: 10, fontSize: "0.82rem", fontWeight: 700,
                background: pending ? "rgba(20,184,166,0.5)" : "#14b8a6",
                color: "#000", border: "none", cursor: pending ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 7,
                transition: "background 0.15s",
              }}
            >
              {pending ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "of-spin 0.8s linear infinite" }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  Send Offer
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
