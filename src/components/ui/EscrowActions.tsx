"use client";

import { useState } from "react";
import { updateOrderStatus } from "@/actions/orders";

interface Props {
  orderId: string;
  orderStatus: string;
  orderAmount: number;
  isBuyer: boolean;
  isSeller: boolean;
  sellerWallet: string | null;
  buyerWallet: string | null;
}

export default function EscrowActions({
  orderId, orderStatus, orderAmount, isBuyer, isSeller,
}: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const isActive = !["completed", "cancelled", "disputed"].includes(orderStatus);
  if (!isActive) return null;

  async function handle(status: string) {
    setLoading(status);
    setError("");
    try {
      await updateOrderStatus(orderId, status);
      window.location.reload();
    } catch (e: any) {
      setError(e.message ?? "Failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>

        {/* Seller accepts the order */}
        {isSeller && orderStatus === "pending" && (
          <button
            onClick={() => handle("accepted")}
            disabled={!!loading}
            className="btn-primary"
            style={{ fontSize: "0.78rem", padding: "0.6rem 1.4rem", cursor: "pointer" }}
          >
            {loading === "accepted" ? "Accepting…" : "Accept Order"}
          </button>
        )}

        {/* Cancel — pending only */}
        {orderStatus === "pending" && (
          <button
            onClick={() => handle("cancelled")}
            disabled={!!loading}
            className="btn-secondary"
            style={{ fontSize: "0.78rem", padding: "0.6rem 1.4rem", cursor: "pointer" }}
          >
            {loading === "cancelled" ? "Cancelling…" : "Cancel"}
          </button>
        )}

        {/* Seller marks as delivered */}
        {isSeller && orderStatus === "accepted" && (
          <button
            onClick={() => handle("delivered")}
            disabled={!!loading}
            className="btn-primary"
            style={{ fontSize: "0.78rem", padding: "0.6rem 1.4rem", cursor: "pointer" }}
          >
            {loading === "delivered" ? "Marking…" : "Mark as Delivered"}
          </button>
        )}

        {/* Buyer confirms completion */}
        {isBuyer && orderStatus === "delivered" && (
          <button
            onClick={() => handle("completed")}
            disabled={!!loading}
            className="btn-primary"
            style={{ fontSize: "0.78rem", padding: "0.6rem 1.4rem", cursor: "pointer", background: "linear-gradient(135deg, #22c55e, #16a34a)", display: "flex", alignItems: "center", gap: 6 }}
          >
            {loading === "completed" ? "Confirming…" : "Confirm Completion"}
          </button>
        )}

        {/* Open dispute */}
        {["accepted", "delivered"].includes(orderStatus) && (
          <button
            onClick={() => handle("disputed")}
            disabled={!!loading}
            style={{ fontSize: "0.78rem", padding: "0.6rem 1.4rem", cursor: "pointer", borderRadius: 99, background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)", fontWeight: 600 }}
          >
            Open Dispute
          </button>
        )}
      </div>

      {error && (
        <div style={{ fontSize: "0.72rem", color: "#ef4444", padding: "0.6rem 0.85rem", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </div>
      )}

      {/* Buyer info when pending */}
      {isBuyer && orderStatus === "pending" && (
        <div style={{ fontSize: "0.7rem", color: "#94a3b8", padding: "0.6rem 0.85rem", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          Waiting for the freelancer to accept your order. You can cancel anytime before they accept.
        </div>
      )}
    </div>
  );
}
