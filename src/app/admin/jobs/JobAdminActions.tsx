"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { closeJob, reopenJob, adminDeleteJob } from "@/actions/admin";

export function JobAdminActions({ jobId, status }: { jobId: string; status: string }) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  async function run(action: () => Promise<{ ok: boolean }>, key: string) {
    setLoading(key);
    try {
      await action();
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(null);
    }
  }

  const isOpen = status === "open";

  return (
    <div style={{ display: "flex", gap: 6 }}>
      <button
        disabled={!!loading}
        onClick={() => run(isOpen ? () => closeJob(jobId) : () => reopenJob(jobId), "toggle")}
        style={{
          padding: "0.4rem 0.85rem", borderRadius: 6, fontSize: "0.7rem", fontWeight: 700,
          border: "1px solid",
          borderColor: isOpen ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)",
          background: isOpen ? "rgba(239,68,68,0.06)" : "rgba(34,197,94,0.06)",
          color: isOpen ? "#ef4444" : "#22c55e",
          cursor: "pointer",
        }}
      >
        {loading === "toggle" ? "..." : isOpen ? "Close" : "Reopen"}
      </button>
      <button
        disabled={!!loading}
        onClick={() => {
          if (!confirm("Delete this job and all applications permanently?")) return;
          run(() => adminDeleteJob(jobId), "delete");
        }}
        style={{
          padding: "0.4rem 0.85rem", borderRadius: 6, fontSize: "0.7rem", fontWeight: 700,
          border: "1px solid rgba(239,68,68,0.3)",
          background: "rgba(239,68,68,0.06)",
          color: "#ef4444",
          cursor: "pointer",
        }}
      >
        {loading === "delete" ? "..." : "Delete"}
      </button>
    </div>
  );
}
