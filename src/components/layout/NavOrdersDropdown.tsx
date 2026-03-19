"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  pending:   "#f59e0b",
  accepted:  "#3b82f6",
  funded:    "#3b82f6",
  delivered: "#8b5cf6",
  completed: "#22c55e",
  cancelled: "#94a3b8",
  disputed:  "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  pending:   "Pending",
  accepted:  "In Progress",
  funded:    "In Progress",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
  disputed:  "Disputed",
};

interface OrderUser {
  id: string;
  name: string | null;
  twitterHandle: string;
  image: string | null;
}

export interface NavOrder {
  id: string;
  status: string;
  amount: number;
  createdAt: string;
  gigTitle: string;
  gigCategory: string;
  role: "buyer" | "seller";
  other: OrderUser | null;
}

interface Props {
  orders: NavOrder[];
  activeCount: number;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export default function NavOrdersDropdown({ orders, activeCount, isOpen, onOpen, onClose }: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 60, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 767);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!isOpen || isMobile) return;
    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) setPanelPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [isOpen, isMobile]);

  const panelInner = (
    <>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px",
        borderBottom: "1px solid var(--card-border)",
        flexShrink: 0,
      }}>
        <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1rem", letterSpacing: "0.04em", color: "var(--foreground)" }}>
          Orders
          {activeCount > 0 && (
            <span style={{ background: "#f59e0b", color: "#fff", borderRadius: "999px", fontSize: "0.55rem", fontWeight: 700, padding: "1px 6px", marginLeft: 6, fontFamily: "Inter, sans-serif" }}>
              {activeCount} active
            </span>
          )}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link
            href="/orders"
            onClick={onClose}
            style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: "#14b8a6", textDecoration: "none", fontWeight: 600 }}
          >
            View all
          </Link>
          {isMobile && (
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--text-muted)", display: "flex" }}
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Order list */}
      <div style={{ overflowY: "auto", flex: 1 }}>
        {orders.length === 0 ? (
          <div style={{ padding: "2rem 1rem", textAlign: "center", fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "var(--text-muted)" }}>
            No orders yet.{" "}
            <Link href="/gigs" onClick={onClose} style={{ color: "#14b8a6", textDecoration: "none" }}>
              Browse gigs →
            </Link>
          </div>
        ) : (
          orders.slice(0, isMobile ? 5 : 8).map((o) => {
            const color = STATUS_COLORS[o.status] ?? "#94a3b8";
            const label = STATUS_LABELS[o.status] ?? o.status;
            return (
              <Link
                key={o.id}
                href={`/orders/${o.id}`}
                onClick={onClose}
                style={{
                  display: "flex", alignItems: "center", gap: "0.75rem",
                  padding: isMobile ? "0 16px" : "0.75rem 1rem", minHeight: isMobile ? 64 : "auto",
                  borderBottom: "1px solid var(--card-border)",
                  background: "transparent",
                  transition: "background 0.12s",
                  width: "100%", cursor: "pointer", textDecoration: "none",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {/* Avatar */}
                <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, overflow: "hidden", background: "var(--avatar-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {o.other?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={o.other.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {o.gigTitle}
                  </div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 1 }}>
                    {o.role === "buyer" ? "Seller" : "Buyer"}: {o.other?.name ?? o.other?.twitterHandle ?? "Unknown"}
                  </div>
                </div>

                {/* Right: price + status */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "#2DD4BF" }}>
                    ${o.amount}
                  </div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 3, padding: "1px 7px", borderRadius: 99, background: `${color}18`, border: `1px solid ${color}40` }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: color }} />
                    <span style={{ fontSize: "0.56rem", fontWeight: 600, color, letterSpacing: "0.04em", fontFamily: "Inter, sans-serif" }}>{label}</span>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "0.75rem 16px", borderTop: "1px solid var(--card-border)", flexShrink: 0 }}>
        <Link
          href="/orders"
          onClick={onClose}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            height: isMobile ? 52 : "auto",
            width: "100%",
            fontFamily: "Inter, sans-serif", fontWeight: 700,
            fontSize: isMobile ? "0.85rem" : "0.72rem",
            letterSpacing: "0.1em", textTransform: "uppercase",
            color: isMobile ? "var(--dropdown-bg)" : "var(--foreground)",
            background: isMobile ? "var(--foreground)" : "none",
            borderRadius: isMobile ? 12 : 0,
            textDecoration: "none",
          }}
        >
          View All Orders
        </Link>
      </div>
    </>
  );

  const desktopStyle: React.CSSProperties = {
    position: "fixed",
    top: panelPos.top,
    right: panelPos.right,
    width: 340,
    borderRadius: 16,
    zIndex: 9999,
    background: "var(--dropdown-bg)",
    border: "1px solid var(--card-border)",
    boxShadow: "var(--shadow-dropdown)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  };

  const mobileStyle: React.CSSProperties = {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: "20px 20px 0 0",
    zIndex: 9999,
    background: "var(--dropdown-bg)",
    maxHeight: "75vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 -8px 40px rgba(0,0,0,0.25)",
  };

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        onClick={() => isOpen ? onClose() : onOpen()}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 34, height: 34, borderRadius: 8, background: "none",
          border: "none", cursor: "pointer", position: "relative",
          color: "var(--text-muted)",
          transition: "color 0.2s, background 0.2s",
        }}
        className="nav-orders-link"
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-hover)"; e.currentTarget.style.color = "var(--foreground)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-muted)"; }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
        </svg>
        {activeCount > 0 && (
          <span style={{
            position: "absolute", top: 4, right: 4,
            minWidth: 15, height: 15, borderRadius: "999px",
            background: "#f59e0b",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "Inter, sans-serif",
            fontSize: "0.46rem", fontWeight: 700,
            color: "#fff", lineHeight: 1, padding: "0 3px",
          }}>
            {activeCount > 99 ? "99+" : activeCount}
          </span>
        )}
      </button>

      {/* Portal — desktop dropdown + mobile bottom sheet */}
      {isOpen && createPortal(
        <>
          <div
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9998,
              background: isMobile ? "rgba(0,0,0,0.4)" : "transparent",
            }}
          />
          <div style={isMobile ? mobileStyle : desktopStyle}>
            {isMobile && (
              <div style={{ display: "flex", justifyContent: "center", padding: "0.75rem 0 0.25rem", flexShrink: 0 }}>
                <div style={{ width: 40, height: 4, borderRadius: 99, background: "var(--card-border)" }} />
              </div>
            )}
            {panelInner}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
