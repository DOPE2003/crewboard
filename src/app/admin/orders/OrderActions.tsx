"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminUpdateOrderStatus } from "@/actions/admin";

const STATUSES = ["pending", "accepted", "funded", "delivered", "completed", "cancelled"];

export function OrderActions({ orderId, status }: { orderId: string; status: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function update(newStatus: string) {
    if (newStatus === status) return;
    setLoading(true);
    try { await adminUpdateOrderStatus(orderId, newStatus); router.refresh(); }
    catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  }

  return (
    <select
      disabled={loading}
      value={status}
      onChange={(e) => update(e.target.value)}
      style={{
        padding: "0.4rem 0.75rem", borderRadius: 6, fontSize: "0.7rem", fontWeight: 700,
        border: "1px solid var(--card-border)", background: "var(--card-bg)",
        color: "var(--foreground)", cursor: "pointer", outline: "none",
      }}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
      ))}
    </select>
  );
}
