"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptApplication, rejectApplication } from "@/actions/jobs";

export default function ApplicationActions({
  appId,
  applicantId,
  applicantHandle,
  initialStatus,
  jobStatus,
}: {
  appId: string;
  applicantId: string;
  applicantHandle: string;
  initialStatus: string;
  jobStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState<"accept" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const jobFilled = jobStatus === "in_progress" || jobStatus === "closed";
  const isAccepted = status === "accepted";
  const isRejected = status === "rejected";
  const isPending = !isAccepted && !isRejected;

  async function handleAccept() {
    if (!confirm("Accept this applicant? All other applicants will be notified they were not selected.")) return;
    setLoading("accept");
    setError(null);
    const res = await acceptApplication(appId);
    if (res.ok) {
      setStatus("accepted");
      router.refresh();
    } else {
      setError(res.error ?? "Failed");
    }
    setLoading(null);
  }

  async function handleReject() {
    setLoading("reject");
    setError(null);
    const res = await rejectApplication(appId);
    if (res.ok) {
      setStatus("rejected");
      router.refresh();
    } else {
      setError(res.error ?? "Failed");
    }
    setLoading(null);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {error && (
        <span style={{ fontSize: 12, color: "#ef4444" }}>{error}</span>
      )}

      {isAccepted && (
        <>
          <span style={{ padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700, color: "#22c55e", background: "rgba(34,197,94,0.1)" }}>
            ✓ Accepted
          </span>
          <a
            href={`/messages?with=${applicantId}`}
            style={{
              padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: "#14b8a6", color: "#0f172a", textDecoration: "none", whiteSpace: "nowrap",
            }}
          >
            Send Offer →
          </a>
        </>
      )}

      {isRejected && (
        <span style={{ padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700, color: "#ef4444", background: "rgba(239,68,68,0.1)" }}>
          ✕ Rejected
        </span>
      )}

      {isPending && !jobFilled && (
        <>
          <button
            onClick={handleAccept}
            disabled={loading !== null}
            style={{
              padding: "6px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700,
              background: loading === "accept" ? "rgba(34,197,94,0.5)" : "#22c55e",
              color: "#0f172a", border: "none", cursor: loading !== null ? "wait" : "pointer",
              whiteSpace: "nowrap", transition: "opacity 0.15s",
            }}
          >
            {loading === "accept" ? "Accepting…" : "✓ Accept"}
          </button>
          <button
            onClick={handleReject}
            disabled={loading !== null}
            style={{
              padding: "6px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700,
              background: "transparent",
              color: "#ef4444", border: "1px solid rgba(239,68,68,0.4)",
              cursor: loading !== null ? "wait" : "pointer",
              whiteSpace: "nowrap", transition: "opacity 0.15s",
            }}
          >
            {loading === "reject" ? "Rejecting…" : "✕ Reject"}
          </button>
        </>
      )}

      {isPending && jobFilled && (
        <span style={{ padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600, color: "var(--text-muted)", background: "var(--card-border)" }}>
          Position filled
        </span>
      )}
    </div>
  );
}
