"use client";

import { useState, useEffect, useTransition, CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { extendDeadline, requestExtension } from "@/actions/orders";

function formatDuration(ms: number): string {
  const abs = Math.abs(ms);
  const days = Math.floor(abs / 86_400_000);
  const hrs  = Math.floor((abs % 86_400_000) / 3_600_000);
  const mins = Math.floor((abs % 3_600_000) / 60_000);
  if (days > 0) return `${days} day${days !== 1 ? "s" : ""}${hrs > 0 ? ` ${hrs}h` : ""}`;
  if (hrs > 0)  return `${hrs} hour${hrs !== 1 ? "s" : ""}${mins > 0 ? ` ${mins}m` : ""}`;
  return `${mins} minute${mins !== 1 ? "s" : ""}`;
}

const BTN: CSSProperties = {
  padding: "6px 13px", borderRadius: 7, fontSize: "0.72rem", fontWeight: 700,
  cursor: "pointer", fontFamily: "inherit", textDecoration: "none",
  display: "inline-flex", alignItems: "center", gap: 4,
  border: "1px solid transparent", background: "transparent",
};

interface Props {
  orderId: string;
  deliveryDeadline: string | null;
  orderStatus: string;
  isBuyer: boolean;
  isSeller: boolean;
  convId: string | null;
}

export default function OrderOverdueBanner({
  orderId, deliveryDeadline, orderStatus, isBuyer, isSeller, convId,
}: Props) {
  const router = useRouter();
  const [, setTick]              = useState(0);
  const [isPending, startTx]     = useTransition();
  const [error, setError]        = useState<string | null>(null);
  const [extRequested, setExtReq] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!deliveryDeadline || orderStatus !== "accepted") return null;

  const msLeft   = new Date(deliveryDeadline).getTime() - Date.now();
  const isOverdue = msLeft <= 0;
  const isWarning = !isOverdue && msLeft < 24 * 3_600_000;

  if (!isOverdue && !isWarning) return null;

  function handleExtend(days: number) {
    setError(null);
    startTx(async () => {
      const res = await extendDeadline(orderId, days);
      if ("error" in res) { setError(res.error); return; }
      router.refresh();
    });
  }

  function handleRequestExt() {
    if (extRequested) return;
    setError(null);
    startTx(async () => {
      const res = await requestExtension(orderId);
      if ("error" in res) { setError(res.error); return; }
      setExtReq(true);
    });
  }

  return (
    <div style={{
      background: isOverdue ? "rgba(245,158,11,0.05)" : "rgba(245,158,11,0.03)",
      border: `1px solid ${isOverdue ? "rgba(245,158,11,0.28)" : "rgba(245,158,11,0.15)"}`,
      borderRadius: 14,
      padding: "1rem 1.4rem",
      marginBottom: "1rem",
    }}>

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#f59e0b", fontFamily: "Inter, sans-serif" }}>
          {isOverdue
            ? `Delivery overdue by ${formatDuration(msLeft)}`
            : `Due in ${formatDuration(msLeft)}`}
        </span>
      </div>

      <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "0 0 0.85rem", lineHeight: 1.55, fontFamily: "Inter, sans-serif" }}>
        {isOverdue
          ? "Delivery time expired. Choose how you'd like to proceed."
          : "Delivery is due soon — make sure to submit on time."}
      </p>

      {/* Action buttons */}
      {isOverdue && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {isBuyer && (
            <>
              {[1, 3, 7].map(d => (
                <button
                  key={d}
                  onClick={() => handleExtend(d)}
                  disabled={isPending}
                  style={{ ...BTN, color: "#14B8A6", border: "1px solid rgba(20,184,166,0.3)", opacity: isPending ? 0.55 : 1 }}
                >
                  +{d} day{d !== 1 ? "s" : ""}
                </button>
              ))}
              <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", margin: "0 3px" }}>or</span>
              <a
                href="#order-actions"
                style={{ ...BTN, color: "#ef4444", border: "1px solid rgba(239,68,68,0.22)", background: "rgba(239,68,68,0.05)" }}
              >
                Open Dispute →
              </a>
            </>
          )}
          {isSeller && (
            <>
              <a
                href="#order-actions"
                style={{ ...BTN, background: "#14B8A6", color: "#fff", border: "1px solid #14B8A6" }}
              >
                Deliver Now →
              </a>
              <button
                onClick={handleRequestExt}
                disabled={isPending || extRequested}
                style={{ ...BTN, color: "var(--text-muted)", border: "1px solid var(--card-border)", opacity: (isPending || extRequested) ? 0.6 : 1 }}
              >
                {extRequested ? "✓ Extension Requested" : "Request Extension"}
              </button>
              {convId && (
                <Link
                  href={`/messages/${convId}`}
                  style={{ ...BTN, color: "var(--text-muted)", border: "1px solid var(--card-border)" }}
                >
                  Contact Buyer →
                </Link>
              )}
            </>
          )}
        </div>
      )}

      {error && (
        <p style={{ margin: "0.5rem 0 0", fontSize: "0.7rem", color: "#ef4444", fontFamily: "Inter, sans-serif" }}>{error}</p>
      )}
    </div>
  );
}
