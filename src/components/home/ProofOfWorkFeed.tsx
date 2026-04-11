"use client";

import { useRouter } from "next/navigation";

interface OrderGig {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
}

interface OrderSeller {
  id: string;
  name: string | null;
  twitterHandle: string;
  image: string | null;
}

interface OrderReview {
  rating: number;
  body: string | null;
}

export interface CompletedOrder {
  id: string;
  amount: number;
  txHash: string | null;
  gig: OrderGig;
  seller: OrderSeller;
  reviews: OrderReview[];
}

export default function ProofOfWorkFeed({ orders }: { orders: CompletedOrder[] }) {
  const router = useRouter();
  if (orders.length === 0) return null;

  return (
    <section className="relative overflow-hidden" style={{
      background: "linear-gradient(180deg, #f0fdf9 0%, #f8fafc 55%, #f1f5f9 100%)",
      padding: "96px 24px 112px",
      position: "relative",
    }}>
      {/* Gradient fade — blends hero cards into this section */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: 120,
        background: "linear-gradient(to bottom, rgba(255,255,255,0.95) 0%, transparent 100%)",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes pow-fadein {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pow-pulse-dot {
          0%, 100% { box-shadow: 0 0 0 0 rgba(20,184,166,0.55); }
          50%       { box-shadow: 0 0 0 6px rgba(20,184,166,0); }
        }
        @keyframes pow-badge-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(22,163,74,0.4); }
          50%       { box-shadow: 0 0 0 5px rgba(22,163,74,0); }
        }
        @keyframes pow-border-shift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .pow-section-enter { animation: pow-fadein 0.65s ease both; }
        .pow-section-enter-2 { animation: pow-fadein 0.65s 0.12s ease both; }
        .pow-section-enter-3 { animation: pow-fadein 0.65s 0.22s ease both; }

        .pow-card {
          position: relative;
          display: flex;
          flex-direction: column;
          background: rgba(255,255,255,0.78);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-radius: 20px;
          overflow: hidden;
          text-decoration: none;
          cursor: pointer;
          /* animated gradient border via outline trick */
          box-shadow:
            0 0 0 1.5px rgba(20,184,166,0.22),
            0 2px 10px rgba(0,0,0,0.05),
            inset 0 1px 0 rgba(255,255,255,0.9);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .pow-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 20px;
          padding: 1.5px;
          background: linear-gradient(135deg, #14B8A6, #6366f1, #0ea5e9, #14B8A6);
          background-size: 300% 300%;
          animation: pow-border-shift 6s ease infinite;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0.35;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        .pow-card:hover {
          transform: translateY(-5px) scale(1.025);
          box-shadow:
            0 0 0 1.5px rgba(20,184,166,0.4),
            0 24px 56px rgba(20,184,166,0.16),
            0 8px 24px rgba(0,0,0,0.08),
            inset 0 1px 0 rgba(255,255,255,0.9);
        }
        .pow-card:hover::after { opacity: 0.8; }
        .pow-card:hover .pow-price {
          transform: scale(1.06);
          text-shadow: 0 0 24px rgba(13,148,136,0.55);
        }

        .pow-price {
          font-size: 22px;
          font-weight: 800;
          color: #0d9488;
          letter-spacing: -0.03em;
          line-height: 1;
          text-shadow: 0 0 16px rgba(20,184,166,0.3);
          transition: transform 0.3s ease, text-shadow 0.3s ease;
          display: inline-block;
        }

        .pow-escrow-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.04em;
          padding: 3px 9px 3px 7px;
          border-radius: 99px;
          background: linear-gradient(135deg, #dcfce7, #d1fae5);
          color: #15803d;
          border: 1px solid rgba(22,163,74,0.18);
          animation: pow-badge-pulse 2.8s ease-in-out infinite;
        }

        .pow-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #14B8A6;
          flex-shrink: 0;
          animation: pow-pulse-dot 2.2s ease-in-out infinite;
          box-shadow: 0 0 6px rgba(20,184,166,0.6);
        }

        .pow-category {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          padding: 3px 10px;
          border-radius: 99px;
          background: rgba(20,184,166,0.08);
          color: #0d9488;
          border: 1px solid rgba(20,184,166,0.18);
        }

        .pow-quote {
          background: linear-gradient(135deg, rgba(240,253,250,0.9), rgba(239,246,255,0.7));
          border-left: 2.5px solid #14B8A6;
          border-radius: 0 10px 10px 0;
          padding: 9px 13px;
          margin-bottom: 14px;
        }

        .pow-tx {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-top: 10px;
          font-size: 10px;
          color: #94a3b8;
          text-decoration: none;
          font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
          transition: color 0.2s;
        }
        .pow-tx:hover { color: #14B8A6; }

        .pow-view-all {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 13px 32px;
          border-radius: 14px;
          border: 1.5px solid rgba(20,184,166,0.5);
          color: #0d9488;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          letter-spacing: 0.01em;
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(8px);
          box-shadow: 0 2px 12px rgba(20,184,166,0.08);
          transition: all 0.25s ease;
        }
        .pow-view-all:hover {
          background: #14B8A6;
          color: white;
          border-color: #14B8A6;
          box-shadow: 0 8px 28px rgba(20,184,166,0.35);
          transform: translateY(-2px);
        }

        .pow-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
        }
        @media (max-width: 1024px) { .pow-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 640px)  { .pow-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* ── Ambient glow blobs ── */}
      <div className="absolute pointer-events-none" style={{
        top: -160, left: "50%", transform: "translateX(-50%)",
        width: 800, height: 500,
        background: "radial-gradient(ellipse at 50% 40%, rgba(20,184,166,0.12) 0%, transparent 65%)",
        filter: "blur(48px)",
      }} />
      <div className="absolute pointer-events-none" style={{
        bottom: -80, right: -80,
        width: 420, height: 420, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)",
        filter: "blur(32px)",
      }} />

      {/* Optional grain overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        opacity: 0.025,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
      }} />

      <div className="relative" style={{ maxWidth: 1240, margin: "0 auto", zIndex: 1 }}>

        {/* ── Header ── */}
        <div className="pow-section-enter" style={{ textAlign: "center", marginBottom: 68 }}>

          {/* Label row */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            marginBottom: 18,
          }}>
            <span className="pow-dot" />
            <span style={{
              fontSize: 10.5, fontWeight: 700, letterSpacing: "0.18em",
              textTransform: "uppercase" as const, color: "#0d9488",
            }}>
              On-Chain Verified
            </span>
            <span className="pow-dot" />
          </div>

          <h2 style={{
            fontSize: "clamp(34px, 4.5vw, 52px)",
            fontWeight: 800,
            color: "#0f172a",
            margin: "0 0 16px",
            letterSpacing: "-0.04em",
            lineHeight: 1.06,
          }}>
            Proof of Work
          </h2>

          <p style={{
            fontSize: 16.5,
            color: "#64748b",
            margin: 0,
            fontWeight: 400,
            lineHeight: 1.65,
            letterSpacing: "0.005em",
          }}>
            Real work.{" "}
            <em style={{ color: "#94a3b8", fontStyle: "italic", fontWeight: 400 }}>
              Real payments.
            </em>{" "}
            Verified on-chain.
          </p>
        </div>

        {/* ── Cards ── */}
        <div className="pow-grid pow-section-enter-2">
          {orders.map((order) => {
            const review = order.reviews[0];
            const rating = Math.min(Math.max(review?.rating ?? 5, 1), 5);
            const sellerDisplay = order.seller.name ?? `@${order.seller.twitterHandle}`;
            const sellerInitial = (order.seller.name ?? order.seller.twitterHandle ?? "U")[0].toUpperCase();

            return (
              <div key={order.id} role="link" tabIndex={0} onClick={() => router.push(`/gigs/${order.gig.id}`)} onKeyDown={(e) => e.key === "Enter" && router.push(`/gigs/${order.gig.id}`)} className="pow-card">

                {/* Top gradient band */}
                <div style={{
                  height: 3, flexShrink: 0,
                  background: "linear-gradient(90deg, #14B8A6 0%, #6366f1 60%, #0ea5e9 100%)",
                }} />

                <div style={{ padding: "20px 20px 18px", display: "flex", flexDirection: "column", flex: 1 }}>

                  {/* Category + escrow */}
                  <div style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between", marginBottom: 14,
                    flexWrap: "wrap", gap: 8,
                  }}>
                    <span className="pow-category">{order.gig.category}</span>
                    <span className="pow-escrow-badge">
                      {/* live green dot */}
                      <span style={{
                        width: 5, height: 5, borderRadius: "50%",
                        background: "#16a34a", flexShrink: 0,
                        boxShadow: "0 0 4px rgba(22,163,74,0.6)",
                        display: "inline-block",
                      }} />
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      Escrow Completed
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{
                    fontSize: 15.5, fontWeight: 700, color: "#0f172a",
                    margin: "0 0 7px", lineHeight: 1.35, letterSpacing: "-0.015em",
                    overflow: "hidden", display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  }}>
                    {order.gig.title}
                  </h3>

                  {/* Description */}
                  <p style={{
                    fontSize: 12.5, color: "#94a3b8", margin: "0 0 14px",
                    lineHeight: 1.65,
                    overflow: "hidden", display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  }}>
                    {order.gig.description}
                  </p>

                  {/* Review */}
                  {review?.body && (
                    <div className="pow-quote">
                      <p style={{
                        fontSize: 11.5, color: "#475569", margin: 0,
                        fontStyle: "italic", lineHeight: 1.55,
                      }}>
                        &ldquo;{review.body}&rdquo;
                      </p>
                    </div>
                  )}

                  <div style={{ flex: 1 }} />

                  {/* Bottom row */}
                  <div style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: 14,
                    borderTop: "1px solid rgba(15,23,42,0.06)",
                    gap: 10,
                  }}>
                    {/* Seller */}
                    <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                      {order.seller.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={order.seller.image}
                          alt={sellerDisplay}
                          style={{
                            width: 33, height: 33, borderRadius: "50%",
                            objectFit: "cover", flexShrink: 0,
                            border: "1.5px solid rgba(20,184,166,0.3)",
                            boxShadow: "0 1px 6px rgba(20,184,166,0.2)",
                          }}
                        />
                      ) : (
                        <div style={{
                          width: 33, height: 33, borderRadius: "50%",
                          background: "linear-gradient(135deg, #14B8A6, #6366f1)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 800, color: "white", flexShrink: 0,
                          boxShadow: "0 2px 8px rgba(20,184,166,0.3)",
                        }}>
                          {sellerInitial}
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <p style={{
                          fontSize: 12, fontWeight: 600, color: "#1e293b",
                          margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          {sellerDisplay}
                        </p>
                        {/* SVG stars */}
                        <div style={{ display: "flex", gap: 1.5, marginTop: 3 }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <svg key={i} width="9" height="9" viewBox="0 0 24 24"
                              fill={i < rating ? "#f59e0b" : "none"}
                              stroke={i < rating ? "#f59e0b" : "#e2e8f0"}
                              strokeWidth="2"
                            >
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <span className="pow-price">${order.amount}</span>
                      <p style={{
                        fontSize: 9, color: "#94a3b8", margin: "4px 0 0",
                        fontWeight: 600, letterSpacing: "0.07em",
                        textTransform: "uppercase" as const,
                      }}>
                        USDC · Solana
                      </p>
                    </div>
                  </div>

                  {/* TX hash */}
                  {order.txHash && (
                    <a
                      href={`https://explorer.solana.com/tx/${order.txHash}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="pow-tx"
                    >
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                      </svg>
                      <span>{order.txHash.slice(0, 8)}...{order.txHash.slice(-6)}</span>
                      <span style={{ color: "#cbd5e1" }}>· Verified on Solana</span>
                    </a>
                  )}

                </div>
              </div>
            );
          })}
        </div>

        {/* ── View All ── */}
        <div className="pow-section-enter-3" style={{ textAlign: "center", marginTop: 60 }}>
          <a href="/orders" className="pow-view-all">
            View All Completed Work
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </a>
        </div>

      </div>
    </section>
  );
}
