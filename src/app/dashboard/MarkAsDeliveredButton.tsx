"use client";

import { useState } from "react";
import { markOrderDelivered } from "@/actions/orders";

export default function MarkAsDeliveredButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!confirm("Are you sure? This will notify the buyer that you have finished the work.")) return;
    setLoading(true);
    try {
      await markOrderDelivered(orderId);
      window.location.reload();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="btn-secondary"
      style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem", height: "auto" }}
    >
      {loading ? "SAVING..." : "MARK AS DELIVERED"}
    </button>
  );
}
