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
      background: "#ffffff", border: "1px solid #e5e7eb",
      borderRadius: 16, padding: 20, marginBottom: 16,
      boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
      display: "flex", flexDirection: "column", gap: 12,
      opacity: deleting ? 0.5 : 1,
    }}>
      {/* Category + Price */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 99, background: "#E1F5EE", color: "#0F6E56" }}>
          {gig.category}
        </span>
        <span style={{ fontSize: 22, fontWeight: 800, color: "#14B8A6" }}>${gig.price}</span>
      </div>

      {/* Title */}
      <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0, lineHeight: 1.4 }}>
        {gig.title}
      </p>

      {/* Description */}
      <p style={{
        fontSize: 12, color: "#6b7280", margin: 0, lineHeight: 1.6,
        overflow: "hidden", display: "-webkit-box",
        WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
      }}>
        {gig.description}
      </p>

      {/* Tags */}
      {gig.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {gig.tags.slice(0, 4).map((tag) => (
            <span key={tag} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, background: "#f3f4f6", color: "#6b7280", fontWeight: 500 }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid #f3f4f6" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
            background: gig.status === "active" ? "#dcfce7" : "#f3f4f6",
            color: gig.status === "active" ? "#16a34a" : "#9ca3af",
          }}>
            {gig.status.toUpperCase()}
          </span>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>{gig.deliveryDays}d delivery</span>
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <a href={`/gigs/${gig.id}`} style={{ fontSize: 12, color: "#9ca3af", textDecoration: "none" }}>View</a>
          <a href={`/gigs/${gig.id}/edit`} style={{ fontSize: 12, fontWeight: 700, color: "#14B8A6", textDecoration: "none" }}>Edit →</a>
        </div>
      </div>

      {/* Delete row — full width, easy tap target on mobile */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        style={{
          width: "100%", padding: "10px", borderRadius: 10,
          border: "1px solid rgba(239,68,68,0.25)",
          background: "rgba(239,68,68,0.04)",
          color: "#ef4444", fontSize: 13, fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit",
          opacity: deleting ? 0.5 : 1,
        }}
      >
        {deleting ? "Deleting..." : "Delete Service"}
      </button>
    </div>
  );
}

export default function MineClient({ gigs, sellerOrders, buyerOrders }: Props) {
  return (
    <div style={{ minHeight: "100vh", background: "#f7f8fa", fontFamily: "Inter, sans-serif" }}>
      <style>{`
        @media (max-width: 768px) {
          .mine-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 1024px) {
          .mine-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 6px" }}>
              Dashboard
            </p>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "#111827", margin: 0 }}>My Services</h1>
          </div>
          <a
            href="/gigs/new"
            style={{
              background: "#14B8A6", color: "white", padding: "12px 22px",
              borderRadius: 12, fontWeight: 700, fontSize: 14,
              textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
            }}
          >
            + Post a Service
          </a>
        </div>

        {/* 3-column grid */}
        <div
          className="mine-grid"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}
        >
          {/* Column 1: My Offered Services */}
          <div>
            <h2 style={{
              fontSize: 11, fontWeight: 700, color: "#9ca3af",
              textTransform: "uppercase", letterSpacing: "0.1em",
              margin: "0 0 16px", paddingBottom: 12,
              borderBottom: "1px solid #e5e7eb",
            }}>
              My Offered Services
            </h2>

            {gigs.length === 0 ? (
              <EmptyState label="No services posted yet" />
            ) : (
              gigs.map((gig) => (
                <GigCard key={gig.id} gig={gig} />
              ))
            )}
          </div>

          {/* Column 2: Services I'm Working On (seller) */}
          <div>
            <h2 style={{
              fontSize: 11, fontWeight: 700, color: "#9ca3af",
              textTransform: "uppercase", letterSpacing: "0.1em",
              margin: "0 0 16px", paddingBottom: 12,
              borderBottom: "1px solid #e5e7eb",
            }}>
              Services I&apos;m Working On
            </h2>

            {sellerOrders.length === 0 ? (
              <EmptyState label="No active orders to deliver" />
            ) : (
              sellerOrders.map((order) => (
                <OrderCard key={order.id} order={order} other={order.buyer} />
              ))
            )}
          </div>

          {/* Column 3: Services I Requested (buyer) */}
          <div>
            <h2 style={{
              fontSize: 11, fontWeight: 700, color: "#9ca3af",
              textTransform: "uppercase", letterSpacing: "0.1em",
              margin: "0 0 16px", paddingBottom: 12,
              borderBottom: "1px solid #e5e7eb",
            }}>
              Services I Requested
            </h2>

            {buyerOrders.length === 0 ? (
              <EmptyState label="You haven't hired anyone yet" />
            ) : (
              buyerOrders.map((order) => (
                <OrderCard key={order.id} order={order} other={order.seller} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div style={{
      background: "#ffffff", border: "1px dashed #e5e7eb",
      borderRadius: 16, padding: "48px 24px",
      display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
    }}>
      <span style={{ fontSize: 40, marginBottom: 12 }}>📭</span>
      <p style={{ fontSize: 14, color: "#9ca3af", margin: 0, fontWeight: 500 }}>{label}</p>
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
        borderRadius: 16,
        padding: 18,
        marginBottom: 14,
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        textDecoration: "none",
      }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        {other?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={other.image}
            alt=""
            style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid #f3f4f6" }}
          />
        ) : (
          <div style={{
            width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
            background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid #e5e7eb",
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#14B8A6" }}>
              {(other?.name ?? other?.twitterHandle ?? "?")[0].toUpperCase()}
            </span>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: "0 0 4px", lineHeight: 1.4 }}>
            {order.gig.title}
          </p>
          <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 10px" }}>
            with {other?.name ?? (other?.twitterHandle ? `@${other.twitterHandle}` : "Unknown")}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#14B8A6" }}>${order.amount}</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: statusBg, color: statusColor }}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
