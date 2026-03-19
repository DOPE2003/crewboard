"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleGigStatus, deleteGig } from "@/actions/gigs";

interface Props {
  gigId: string;
  currentStatus: string;
}

export default function GigOwnerActions({ gigId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      await toggleGigStatus(gigId, currentStatus);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this gig? This cannot be undone.")) return;
    setLoading(true);
    try {
      await deleteGig(gigId);
      router.push("/gigs");
    } catch (e: any) {
      alert(e.message);
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
      <button
        className="btn-secondary"
        onClick={handleToggle}
        disabled={loading}
        style={{ flex: 1 }}
      >
        {loading ? "..." : currentStatus === "active" ? "Pause Gig" : "Activate Gig"}
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        style={{
          flex: 1,
          padding: "0.7rem 1.25rem",
          borderRadius: 8,
          border: "1px solid rgba(239,68,68,0.4)",
          background: "rgba(239,68,68,0.06)",
          color: "#ef4444",
          fontFamily: "Inter, sans-serif",
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
