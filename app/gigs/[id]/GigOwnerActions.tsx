"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  gigId: string;
  currentStatus: string;
}

export default function GigOwnerActions({ gigId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggleStatus() {
    setLoading(true);
    const newStatus = currentStatus === "active" ? "paused" : "active";
    await fetch(`/api/gigs/${gigId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
    setLoading(false);
  }

  async function deleteGig() {
    if (!confirm("Delete this gig? This cannot be undone.")) return;
    setLoading(true);
    await fetch(`/api/gigs/${gigId}`, { method: "DELETE" });
    router.push("/gigs");
  }

  return (
    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
      <button
        className="btn-secondary"
        onClick={toggleStatus}
        disabled={loading}
        style={{ flex: 1 }}
      >
        {loading ? "..." : currentStatus === "active" ? "Pause Gig" : "Activate Gig"}
      </button>
      <button
        onClick={deleteGig}
        disabled={loading}
        style={{
          flex: 1,
          padding: "0.7rem 1.25rem",
          borderRadius: 8,
          border: "1px solid rgba(239,68,68,0.4)",
          background: "rgba(239,68,68,0.06)",
          color: "#ef4444",
          fontFamily: "Space Mono, monospace",
          fontSize: "0.75rem",
          letterSpacing: "0.08em",
          cursor: "pointer",
        }}
      >
        Delete Gig
      </button>
    </div>
  );
}
