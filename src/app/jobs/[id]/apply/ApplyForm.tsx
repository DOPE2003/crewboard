"use client";

import { useState, useTransition } from "react";
import { applyToJob } from "@/actions/jobs";

interface Props {
  jobId: string;
  serverError?: string;
}

const FIELD: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem 1rem",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--bg-secondary, var(--surface))",
  color: "var(--foreground)",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

export default function ApplyForm({ jobId, serverError }: Props) {
  const [error, setError]       = useState(serverError ?? "");
  const [coverLetter, setCover] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await applyToJob(jobId, fd);
      if (result?.error) setError(result.error);
      // On success, applyToJob redirects — no extra handling needed
    });
  }

  const charCount = coverLetter.length;
  const tooShort  = charCount > 0 && charCount < 40;
  const tooLong   = charCount > 2000;

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Cover letter */}
      <div>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--foreground)", marginBottom: 6 }}>
          Cover letter <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <textarea
          name="coverLetter"
          required
          rows={7}
          placeholder="Tell the poster why you're a great fit. Mention relevant experience, what you'd bring to this role, and your availability."
          value={coverLetter}
          onChange={(e) => setCover(e.target.value)}
          disabled={isPending}
          style={{
            ...FIELD,
            resize: "vertical",
            lineHeight: 1.6,
            borderColor: tooShort || tooLong ? "#ef4444" : "var(--border)",
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontSize: 12, color: tooShort ? "#ef4444" : "var(--text-muted)" }}>
            {tooShort ? `${40 - charCount} more characters needed` : "Min 40 characters"}
          </span>
          <span style={{ fontSize: 12, color: tooLong ? "#ef4444" : "var(--text-muted)" }}>
            {charCount}/2000
          </span>
        </div>
      </div>

      {/* Proposed rate */}
      <div>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--foreground)", marginBottom: 6 }}>
          Proposed rate <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span>
        </label>
        <input
          name="proposedRate"
          type="text"
          placeholder="e.g. $500 fixed, $80/hr, open to discussion"
          disabled={isPending}
          style={FIELD}
        />
      </div>

      {/* Portfolio link */}
      <div>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--foreground)", marginBottom: 6 }}>
          Portfolio link <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span>
        </label>
        <input
          name="portfolioURL"
          type="url"
          placeholder="https://your-portfolio.com"
          disabled={isPending}
          style={FIELD}
        />
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: "0.75rem 1rem", borderRadius: 8,
          background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)",
          fontSize: 13, color: "#ef4444", lineHeight: 1.5,
        }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || tooShort || tooLong || charCount === 0}
        style={{
          padding: "0.85rem 1.5rem", borderRadius: 10, fontSize: 15, fontWeight: 700,
          background: "#14b8a6", color: "#0f172a", border: "none",
          cursor: isPending || tooShort || tooLong || charCount === 0 ? "not-allowed" : "pointer",
          opacity: isPending || tooShort || tooLong || charCount === 0 ? 0.6 : 1,
          transition: "opacity 0.15s",
        }}
      >
        {isPending ? "Submitting…" : "Submit Application"}
      </button>

      <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
        Your Crewboard profile will be shared with the poster alongside this application.
      </p>

    </form>
  );
}
