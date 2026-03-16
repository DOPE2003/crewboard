"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
}

export default function NavOrdersDropdown({ orders, activeCount }: Props) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 767);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  // Close when another nav popup opens
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (e.detail.id !== "orders") setOpen(false);
    };
    window.addEventListener("nav-popup-open", handler as EventListener);
    return () => window.removeEventListener("nav-popup-open", handler as EventListener);
  }, []);

  // Click-outside (desktop only)
  useEffect(() => {
    if (isMobile) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isMobile]);

  // Body scroll lock on mobile
  useEffect(() => {
    if (open && isMobile) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open, isMobile]);

  function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next) window.dispatchEvent(new CustomEvent("nav-popup-open", { detail: { id: "orders" } }));
  }

  const panelStyle: React.CSSProperties = isMobile ? {
    position: "fixed", bottom: 0, left: 0, right: 0,
    background: "#fff", borderRadius: "20px 20px 0 0",
    boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
    zIndex: 9999, maxHeight: "80vh",
    display: "flex", flexDirection: "column",
  } : {
    position: "absolute", top: "calc(100% + 10px)", right: 0,
    width: 340, borderRadius: 16, zIndex: 9999,
    background: "#fff",
    border: "1px solid rgba(0,0,0,0.1)",
    boxShadow: "0 12px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
    overflow: "hidden",
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", flexShrink: 0 }}>
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        style={{
          fontFamily: "Rajdhani, sans-serif", fontWeight: 700,
          fontSize: "0.78rem", letterSpacing: "0.06em", textTransform: "uppercase",
          color: open ? "#000" : "rgba(0,0,0,0.65)",
          background: open ? "rgba(0,0,0,0.06)" : "none",
          border: "none", cursor: "pointer",
          padding: "0.3rem 0.7rem", borderRadius: 6,
          transition: "background 0.15s, color 0.15s",
          position: "relative",
          display: "flex", alignItems: "center", gap: 5,
        }}
        className="nav-orders-link"
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.06)"; e.currentTarget.style.color = "#000"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = open ? "rgba(0,0,0,0.06)" : "none"; e.currentTarget.style.color = open ? "#000" : "rgba(0,0,0,0.65)"; }}
      >
        Orders
        {activeCount > 0 && (
          <span style={{
            minWidth: 15, height: 15, borderRadius: "999px",
            background: "#f59e0b",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontFamily: "Space Mono, monospace",
            fontSize: "0.46rem", fontWeight: 700,
            color: "#fff", lineHeight: 1, padding: "0 3px",
          }}>
            {activeCount > 99 ? "99+" : activeCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop — mobile only */}
          {isMobile && (
            <div
              onClick={() => setOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.35)" }}
            />
          )}

          {/* Panel */}
          <div style={panelStyle}>
            {/* Drag handle */}
            {isMobile && (
              <div style={{ display: "flex", justifyContent: "center", padding: "0.75rem 0 0.25rem", flexShrink: 0 }}>
                <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(0,0,0,0.15)" }} />
              </div>
            )}

            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0.85rem 1rem 0.6rem",
              borderBottom: "1px solid rgba(0,0,0,0.07)",
              flexShrink: 0,
            }}>
              <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "1rem", letterSpacing: "0.04em", color: "#0f172a" }}>
                Orders
                {activeCount > 0 && (
                  <span style={{ background: "#f59e0b", color: "#fff", borderRadius: "999px", fontSize: "0.55rem", fontWeight: 700, padding: "1px 6px", marginLeft: 6, fontFamily: "Space Mono, monospace" }}>
                    {activeCount} active
                  </span>
                )}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Link
                  href="/orders"
                  onClick={() => setOpen(false)}
                  style={{ fontFamily: "Outfit, sans-serif", fontSize: "0.72rem", color: "#14b8a6", textDecoration: "none", fontWeight: 600 }}
                >
                  View all
                </Link>
                {isMobile && (
                  <button
                    onClick={() => setOpen(false)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "rgba(0,0,0,0.4)", display: "flex" }}
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
                <div style={{ padding: "2rem 1rem", textAlign: "center", fontFamily: "Outfit, sans-serif", fontSize: "0.82rem", color: "rgba(0,0,0,0.4)" }}>
                  No orders yet.{" "}
                  <Link href="/gigs" onClick={() => setOpen(false)} style={{ color: "#14b8a6", textDecoration: "none" }}>
                    Browse gigs →
                  </Link>
                </div>
              ) : (
                orders.map((o) => {
                  const color = STATUS_COLORS[o.status] ?? "#94a3b8";
                  const label = STATUS_LABELS[o.status] ?? o.status;
                  return (
                    <Link
                      key={o.id}
                      href={`/orders/${o.id}`}
                      onClick={() => setOpen(false)}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.75rem",
                        padding: "0.75rem 1rem", textDecoration: "none",
                        borderBottom: "1px solid rgba(0,0,0,0.05)",
                        background: "transparent",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.04)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* Avatar */}
                      <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, overflow: "hidden", background: "rgba(0,0,0,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {o.other?.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={o.other.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                          </svg>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "Outfit, sans-serif", fontSize: "0.82rem", fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {o.gigTitle}
                        </div>
                        <div style={{ fontFamily: "Outfit, sans-serif", fontSize: "0.68rem", color: "rgba(0,0,0,0.45)", marginTop: 1 }}>
                          {o.role === "buyer" ? "Seller" : "Buyer"}: {o.other?.name ?? o.other?.twitterHandle ?? "Unknown"}
                        </div>
                      </div>

                      {/* Right: price + status */}
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontFamily: "Space Mono, monospace", fontWeight: 700, fontSize: "0.82rem", color: "#2DD4BF" }}>
                          ${o.amount}
                        </div>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 3, padding: "1px 7px", borderRadius: 99, background: `${color}18`, border: `1px solid ${color}40` }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: color }} />
                          <span style={{ fontSize: "0.56rem", fontWeight: 600, color, letterSpacing: "0.04em", fontFamily: "Space Mono, monospace" }}>{label}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "0.6rem 1rem", borderTop: "1px solid rgba(0,0,0,0.07)", textAlign: "center", flexShrink: 0 }}>
              <Link
                href="/orders"
                onClick={() => setOpen(false)}
                style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#0f172a", textDecoration: "none" }}
              >
                View All Orders
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
