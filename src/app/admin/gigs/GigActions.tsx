"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deactivateGig, activateGig } from "@/actions/admin";

export function GigActions({ gigId, status }: { gigId: string; status: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle() {
    setLoading(true);
    try {
      if (status === "active") await deactivateGig(gigId);
      else await activateGig(gigId);
      router.refresh();
    } catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  }

  return (
    <button onClick={toggle} disabled={loading} style={{
      padding: "0.4rem 0.85rem", borderRadius: 6, fontSize: "0.7rem", fontWeight: 700,
      border: "1px solid",
      borderColor: status === "active" ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)",
      background: status === "active" ? "rgba(239,68,68,0.06)" : "rgba(34,197,94,0.06)",
      color: status === "active" ? "#ef4444" : "#22c55e",
      cursor: "pointer",
    }}>
      {loading ? "..." : status === "active" ? "Deactivate" : "Activate"}
    </button>
  );
}
