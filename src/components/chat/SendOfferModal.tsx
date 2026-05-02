"use client";

import { useState } from "react";
import { createOffer } from "@/actions/offers";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  receiverId: string;
  receiverName: string;
}

export default function SendOfferModal({ isOpen, onClose, conversationId, receiverId, receiverName }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const canSend = title.trim() && description.trim() && Number(amount) >= 1 && Number(deliveryDays) >= 1 && !sending;

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    setError(null);
    try {
      await createOffer({
        conversationId,
        receiverId,
        title: title.trim(),
        description: description.trim(),
        amount: Math.round(Number(amount)),
        deliveryDays: Math.round(Number(deliveryDays)),
      });
      // Reset and close
      setTitle("");
      setDescription("");
      setAmount("");
      setDeliveryDays("");
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Failed to send offer");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 10000,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 10001,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16, pointerEvents: "none",
      }}>
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            pointerEvents: "auto",
            background: "var(--background)",
            borderRadius: 20,
            width: "100%",
            maxWidth: 460,
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
            animation: "offerModalIn 0.2s ease",
          }}
        >
          <style>{`@keyframes offerModalIn { from { opacity:0; transform:scale(0.95) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>

          {/* Header */}
          <div style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid var(--card-border)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#14B8A6", marginBottom: 4 }}>
                New Offer
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--foreground)", margin: 0 }}>
                Send Offer to {receiverName}
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "var(--card-bg)", border: "1px solid var(--card-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "var(--text-muted)", fontSize: 16,
              }}
            >
              x
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Title */}
            <div>
              <label style={labelStyle}>What do you need?</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Design a landing page"
                maxLength={120}
                style={inputStyle}
              />
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Describe the work</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what you need, deliverables, style preferences..."
                maxLength={1000}
                rows={4}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            {/* Amount + Delivery side by side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Budget (USDC)</label>
                <div style={{ position: "relative" }}>
                  <span style={{
                    position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                    fontSize: 15, fontWeight: 700, color: "#14B8A6",
                  }}>$</span>
                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="50"
                    style={{ ...inputStyle, paddingLeft: 28 }}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Delivery (days)</label>
                <input
                  type="number"
                  min="1"
                  value={deliveryDays}
                  onChange={(e) => setDeliveryDays(e.target.value)}
                  placeholder="7"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Summary preview */}
            {title.trim() && Number(amount) > 0 && (
              <div style={{
                padding: "12px 16px", borderRadius: 12,
                background: "rgba(20,184,166,0.06)",
                border: "1px solid rgba(20,184,166,0.15)",
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#14B8A6", marginBottom: 6 }}>
                  Offer Preview
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>{title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "#14B8A6" }}>${amount}</span>
                  {Number(deliveryDays) > 0 && (
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {deliveryDays} day{Number(deliveryDays) !== 1 ? "s" : ""} delivery
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: 10,
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                fontSize: 13, fontWeight: 600, color: "#ef4444",
              }}>
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: "16px 24px 20px",
            borderTop: "1px solid var(--card-border)",
            display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10,
          }}>
            <button
              onClick={onClose}
              style={{
                padding: "10px 20px", borderRadius: 10,
                background: "transparent", border: "1px solid var(--card-border)",
                color: "var(--text-muted)", fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={!canSend}
              style={{
                padding: "10px 24px", borderRadius: 10,
                background: canSend ? "#14B8A6" : "var(--card-border)",
                border: "none",
                color: "#fff", fontSize: 14, fontWeight: 700,
                cursor: canSend ? "pointer" : "not-allowed",
                fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              {sending ? (
                "Sending..."
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  Send Offer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  display: "block",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--card-border)",
  background: "var(--background)",
  color: "var(--foreground)",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
};
