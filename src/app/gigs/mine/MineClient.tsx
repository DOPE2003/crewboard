"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteGig } from "@/actions/gigs";

type Gig = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  deliveryDays: number;
  status: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

type OrderUser = {
  id: string;
  name: string | null;
  twitterHandle: string | null;
  image: string | null;
};

type Order = {
  id: string;
  status: string;
  amount: number;
  gig: { id: string; title: string };
  buyer?: OrderUser;
  seller?: OrderUser;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  gigs: Gig[];
  sellerOrders: Order[];
  buyerOrders: Order[];
};

function GigCard({ gig }: { gig: Gig }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this service? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteGig(gig.id);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
      setDeleting(false);
    }
  }

  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: 16,
      padding: "1rem",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
      opacity: deleting ? 0.5 : 1,
    }}>
      {/* Category + Price */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "4px 12px",
          borderRadius: 99, background: "#E1F5EE", color: "#0F6E56",
          whiteSpace: "nowrap",
        }}>
          {gig.category}
        </span>
        <span style={{ fontSize: 20, fontWeight: 800, color: "#14B8A6", flexShrink: 0 }}>
          ${gig.price}
        </span>
      </div>

      {/* Title */}
      <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0, lineHeight: 1.4 }}>
        {gig.title}
      </p>

      {/* Description */}
      <p style={{
        fontSize: 13, color: "#6b7280", margin: 0, lineHeight: 1.6,
        overflow: "hidden", display: "-webkit-box",
        WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
      }}>
        {gig.description}
      </p>

      {/* Tags */}
      {gig.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {gig.tags.slice(0, 4).map((tag) => (
            <span key={tag} style={{
              fontSize: 11, padding: "3px 10px", borderRadius: 99,
              background: "#f3f4f6", color: "#6b7280", fontWeight: 500,
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Status row */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        paddingTop: "0.65rem", borderTop: "1px solid #f3f4f6",
      }}>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
          background: gig.status === "active" ? "#dcfce7" : "#f3f4f6",
          color:      gig.status === "active" ? "#16a34a" : "#9ca3af",
        }}>
          {gig.status.toUpperCase()}
        </span>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>{gig.deliveryDays}d delivery</span>
      </div>

      {/* Action buttons — side by side */}
      <div style={{ display: "flex", gap: 8 }}>
        <a
          href={`/gigs/${gig.id}`}
          style={{
            flex: 1, textAlign: "center",
            padding: "9px 0", borderRadius: 10,
            border: "1px solid #e5e7eb",
            fontSize: 13, fontWeight: 600, color: "#6b7280",
            textDecoration: "none", minHeight: 40,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          View
        </a>
        <a
          href={`/gigs/${gig.id}/edit`}
          style={{
            flex: 1, textAlign: "center",
            padding: "9px 0", borderRadius: 10,
            border: "1px solid #14B8A6",
            fontSize: 13, fontWeight: 700, color: "#14B8A6",
            textDecoration: "none", minHeight: 40,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          Edit →
        </a>
      </div>

      {/* Delete — full width, easy tap */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        style={{
          width: "100%", padding: "10px", borderRadius: 10,
          border: "1px solid rgba(239,68,68,0.25)",
          background: "rgba(239,68,68,0.04)",
          color: "#ef4444", fontSize: 13, fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit",
          minHeight: 40,
          opacity: deleting ? 0.5 : 1,
        }}
      >
        {deleting ? "Deleting…" : "Delete Service"}
      </button>
    </div>
  );
}

export default function MineClient({ gigs, sellerOrders, buyerOrders }: Props) {
  return (
    <div style={{ minHeight: "100vh", background: "#f7f8fa", fontFamily: "Inter, sans-serif", overflowX: "hidden" }}>
      <style>{`
        /*
         * Mobile-first grid:
         * - Default (mobile): 1 column, sections stack vertically
         * - ≥768px: 2 columns
         * - ≥1100px: 3 columns
         *
         * NOTE: gridTemplateColumns is NOT set inline so these rules
         * are the only source — no specificity conflict.
         */
        .mine-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          align-items: start;
        }
        @media (min-width: 768px) {
          .mine-grid { grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
        }
        @media (min-width: 1100px) {
          .mine-grid { grid-template-columns: repeat(3, 1fr); }
        }

        /* Section heading */
        .mine-section-label {
          font-size: 11px;
          font-weight: 700;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 0 0 14px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        /* Header: stack on very small screens */
        .mine-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }
        .mine-post-btn {
          background: #14B8A6;
          color: white;
          padding: 11px 20px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          min-height: 44px;
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(1.5rem,5vw,2.5rem) 1rem 5rem" }}>

        {/* Header */}
        <div className="mine-header">
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 6px" }}>
              Dashboard
            </p>
            <h1 style={{ fontSize: "clamp(1.5rem,4vw,2rem)", fontWeight: 800, color: "#111827", margin: 0 }}>
              My Services
            </h1>
          </div>
          <a href="/gigs/new" className="mine-post-btn">
            + Post a Service
          </a>
        </div>

        {/* 3-section grid — 1 col mobile, 2 col tablet, 3 col desktop */}
        <div className="mine-grid">

          {/* Column 1: My Offered Services */}
          <div>
            <h2 className="mine-section-label">My Offered Services</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {gigs.length === 0 ? (
                <EmptyState label="No services posted yet" />
              ) : (
                gigs.map((gig) => <GigCard key={gig.id} gig={gig} />)
              )}
            </div>
          </div>

          {/* Column 2: Services I'm Working On (seller orders) */}
          <div>
            <h2 className="mine-section-label">Services I&apos;m Working On</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {sellerOrders.length === 0 ? (
                <EmptyState label="No active orders to deliver" />
              ) : (
                sellerOrders.map((order) => (
                  <OrderCard key={order.id} order={order} other={order.buyer} />
                ))
              )}
            </div>
          </div>

          {/* Column 3: Services I Requested (buyer orders) */}
          <div>
            <h2 className="mine-section-label">Services I Requested</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {buyerOrders.length === 0 ? (
                <EmptyState label="You haven&apos;t hired anyone yet" />
              ) : (
                buyerOrders.map((order) => (
                  <OrderCard key={order.id} order={order} other={order.seller} />
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div style={{
      background: "#ffffff",
      border: "1px dashed #e5e7eb",
      borderRadius: 16,
      padding: "3rem 1.5rem",
      display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
    }}>
      <span style={{ fontSize: 36, marginBottom: 10 }}>📭</span>
      <p style={{ fontSize: 13, color: "#9ca3af", margin: 0, fontWeight: 500 }}>{label}</p>
    </div>
  );
}

function OrderCard({ order, other }: { order: Order; other?: OrderUser }) {
  const statusBg =
    order.status === "completed" ? "#dcfce7" :
    order.status === "pending"   ? "#fef3c7" :
    order.status === "cancelled" ? "#f3f4f6" :
    order.status === "disputed"  ? "#fee2e2" : "#ccfbf1";

  const statusColor =
    order.status === "completed" ? "#16a34a" :
    order.status === "pending"   ? "#d97706" :
    order.status === "cancelled" ? "#9ca3af" :
    order.status === "disputed"  ? "#dc2626" : "#0f766e";

  return (
    <a
      href={`/orders/${order.id}`}
      style={{
        display: "block",
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: "1rem",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        textDecoration: "none",
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        {/* Avatar */}
        {other?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={other.image}
            alt=""
            style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid #f3f4f6" }}
          />
        ) : (
          <div style={{
            width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
            background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid #e5e7eb",
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#14B8A6" }}>
              {(other?.name ?? other?.twitterHandle ?? "?")[0].toUpperCase()}
            </span>
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: "0 0 3px", lineHeight: 1.4 }}>
            {order.gig.title}
          </p>
          <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 10px" }}>
            with {other?.name ?? (other?.twitterHandle ? `@${other.twitterHandle}` : "Unknown")}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#14B8A6" }}>${order.amount}</span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
              background: statusBg, color: statusColor,
              whiteSpace: "nowrap",
            }}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
