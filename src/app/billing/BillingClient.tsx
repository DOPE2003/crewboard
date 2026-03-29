"use client";

import { useState } from "react";

type Order = {
  id: string;
  amount: number;
  status: string;
  buyerId: string;
  createdAt: string;
  gig: { title: string } | null;
};

type Props = {
  walletAddress: string | null;
  totalEarned: number;
  totalPending: number;
  userId: string;
  orders: Order[];
};

function fmt(n: number) {
  if (n === 0) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n}`;
}

export default function BillingClient({ walletAddress, totalEarned, totalPending, userId, orders }: Props) {
  const [copied, setCopied] = useState(false);

  function copyAddress() {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f8fa", fontFamily: "Inter, sans-serif" }}>
      <style>{`
        @media (max-width: 768px) {
          .billing-container { padding: 24px 16px 80px !important; }
          .billing-max-width { max-width: 100% !important; }
          .billing-stats { gap: 8px !important; }
          .billing-stat-card { padding: 12px 8px !important; }
          .billing-stat-value { font-size: 18px !important; }
          .billing-wallet-card { padding: 20px 16px !important; border-radius: 16px !important; }
          .billing-wallet-address { font-size: 17px !important; }
          .billing-buttons { flex-wrap: wrap !important; gap: 8px !important; }
          .billing-buttons button,
          .billing-buttons a { flex: 1 !important; min-width: 120px !important; justify-content: center !important; min-height: 44px !important; }
          .billing-history-row { padding: 14px 16px !important; }
          .billing-history-title { font-size: 12px !important; }
          .billing-icon-box { width: 32px !important; height: 32px !important; font-size: 12px !important; }
        }
        @media (max-width: 380px) {
          .billing-stat-value { font-size: 15px !important; }
          .billing-wallet-address { font-size: 15px !important; }
        }
      `}</style>

      <div className="billing-max-width" style={{ maxWidth: 480, margin: "0 auto", width: "100%" }}>
        <div className="billing-container" style={{ padding: "48px 24px 80px" }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 6px" }}>
              Account
            </p>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "#111827", margin: "0 0 6px" }}>My Wallet</h1>
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
              Manage your Solana wallet and payments
            </p>
          </div>

          {/* Wallet card */}
          <div className="billing-wallet-card" style={{
            background: "linear-gradient(135deg, #0d9488 0%, #0f766e 50%, #065f46 100%)",
            borderRadius: 20,
            padding: "28px 24px",
            marginBottom: 20,
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(20, 184, 166, 0.3), 0 2px 8px rgba(0,0,0,0.4)",
          }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.08)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -20, right: 40, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />

            <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 8px" }}>
              Connected Wallet
            </p>
            <p className="billing-wallet-address" style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", margin: "0 0 4px", letterSpacing: "0.02em" }}>
              {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "No wallet connected"}
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", margin: "0 0 20px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: walletAddress ? "#4ade80" : "#6b7280", display: "inline-block", flexShrink: 0 }} />
              {walletAddress ? "Solana · Linked" : "Not connected"}
            </p>
            <div className="billing-buttons" style={{ display: "flex", gap: 10 }}>
              {walletAddress ? (
                <>
                  <button onClick={copyAddress} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, padding: "10px 16px", color: "#ffffff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", minHeight: 44 }}>
                    {copied ? "✓ Copied" : "Copy Address"}
                  </button>
                  <a href="/settings" style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 10, padding: "10px 16px", color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: 44 }}>
                    Manage
                  </a>
                </>
              ) : (
                <a href="/settings" style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, padding: "10px 16px", color: "#ffffff", fontSize: 12, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: 44 }}>
                  Connect Wallet →
                </a>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="billing-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Total Earned", value: fmt(totalEarned), color: "#14B8A6" },
              { label: "Pending",      value: fmt(totalPending), color: "#f59e0b" },
              { label: "Withdrawn",    value: "$0",              color: "#6b7280" },
            ].map((stat) => (
              <div key={stat.label} className="billing-stat-card" style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "16px 14px", textAlign: "center" }}>
                <p className="billing-stat-value" style={{ fontSize: 24, fontWeight: 800, color: stat.color, margin: "0 0 4px" }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: 11, color: "#9ca3af", margin: 0, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Payment history */}
          <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
              <h2 className="billing-history-title" style={{ fontSize: 12, fontWeight: 700, color: "#111827", margin: 0, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Payment History
              </h2>
            </div>

            {orders.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <p style={{ fontSize: 32, margin: "0 0 12px" }}>💳</p>
                <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>No transactions yet</p>
              </div>
            ) : (
              orders.map((order, i) => {
                const isOutgoing = order.buyerId === userId;
                return (
                  <div key={order.id} className="billing-history-row" style={{
                    padding: "16px 20px",
                    borderBottom: i < orders.length - 1 ? "1px solid #f9fafb" : "none",
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      <div className="billing-icon-box" style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: isOutgoing ? "#fef2f2" : "#f0fdfa",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, color: isOutgoing ? "#ef4444" : "#14B8A6",
                      }}>
                        {isOutgoing ? "↑" : "↓"}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {order.gig?.title ? (order.gig.title.length > 28 ? order.gig.title.slice(0, 28) + "…" : order.gig.title) : "Order"}
                        </p>
                        <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
                          {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px", color: isOutgoing ? "#ef4444" : "#14B8A6" }}>
                        {isOutgoing ? "-" : "+"}${order.amount}
                      </p>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
                        background: order.status === "completed" ? "#dcfce7" : "#fef3c7",
                        color: order.status === "completed" ? "#16a34a" : "#d97706",
                      }}>
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
