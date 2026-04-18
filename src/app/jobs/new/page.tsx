"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createJob } from "@/actions/jobs";

const CHAINS = ["ETH", "SOL", "BASE", "ARB", "AVAX", "BNB"];
const CHAIN_COLORS: Record<string, string> = {
  ETH: "#627EEA", SOL: "#9945FF", BASE: "#0052FF",
  ARB: "#28A0F0", AVAX: "#E84142", BNB: "#F3BA2F",
};
const CATEGORIES = ["Development", "Design", "Marketing", "Community", "Research", "Other"];
const LEVELS = ["Junior", "Mid", "Senior", "Lead"];
const JOB_TYPES = ["Remote", "Full-time", "Part-time", "Contract"];

function PickerRow({
  label, options, value, onChange, colors,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  colors?: Record<string, string>;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map(opt => {
          const active = value === opt;
          const color = colors?.[opt] ?? "#14B8A6";
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "7px 16px", borderRadius: 99, cursor: "pointer",
                border: `1.5px solid ${active ? color : "var(--card-border)"}`,
                background: active ? color : "transparent",
                color: active ? "#fff" : "var(--foreground)",
                fontFamily: "Inter, sans-serif", fontWeight: 700,
                fontSize: "0.75rem", transition: "all 0.15s",
              }}
            >
              {colors && (
                <span style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: active ? "rgba(255,255,255,0.7)" : color,
                  flexShrink: 0,
                }} />
              )}
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", height: 46, padding: "0 14px",
  border: "1px solid var(--card-border)", borderRadius: 12,
  background: "var(--background)", color: "var(--foreground)",
  fontSize: 14, outline: "none", boxSizing: "border-box",
  fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontFamily: "Inter, sans-serif", fontWeight: 600,
  fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 6,
  textTransform: "uppercase", letterSpacing: "0.06em",
};

export default function PostJobPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [chain, setChain] = useState("ETH");
  const [category, setCategory] = useState("Development");
  const [level, setLevel] = useState("Senior");
  const [jobType, setJobType] = useState("Remote");
  const [milestones, setMilestones] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    fd.set("chain", chain);
    fd.set("category", category);
    fd.set("level", level);
    fd.set("jobType", jobType);
    fd.set("milestones", String(milestones));

    startTransition(async () => {
      try {
        await createJob(fd);
      } catch (err: any) {
        if (err?.message?.includes("NEXT_REDIRECT")) return;
        setError(err?.message ?? "Something went wrong.");
      }
    });
  }

  return (
    <main className="page" style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "2.5rem 1.5rem 6rem" }}>

        {/* Back link */}
        <Link href="/jobs" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontFamily: "Inter, sans-serif", fontSize: "0.8rem", textDecoration: "none", marginBottom: 28 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back to Job Board
        </Link>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.55rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
            WEB3 · JOB BOARD
          </div>
          <h1 style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "clamp(1.6rem, 4vw, 2.2rem)", color: "var(--foreground)", lineHeight: 1, margin: 0 }}>
            Post a Job
          </h1>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 8, marginBottom: 0 }}>
            Find top Web3 freelancers for your project.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>

          {/* Title */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Job Title *</label>
            <input name="title" placeholder="e.g. Solidity Smart Contract Developer" required style={inputStyle} />
          </div>

          {/* Company */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Company / Project *</label>
            <input name="company" placeholder="e.g. DeFi Protocol" required style={inputStyle} />
          </div>

          {/* Budget + Duration row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div>
              <label style={labelStyle}>Budget *</label>
              <input name="budget" placeholder="e.g. $2,000 USDC" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Duration</label>
              <input name="duration" placeholder="e.g. 2 weeks" style={inputStyle} />
            </div>
          </div>

          {/* Chain */}
          <PickerRow label="Chain" options={CHAINS} value={chain} onChange={setChain} colors={CHAIN_COLORS} />

          {/* Category */}
          <PickerRow label="Category" options={CATEGORIES} value={category} onChange={setCategory} />

          {/* Level */}
          <PickerRow label="Experience Level" options={LEVELS} value={level} onChange={setLevel} />

          {/* Job Type */}
          <PickerRow label="Job Type" options={JOB_TYPES} value={jobType} onChange={setJobType} />

          {/* Skills / Tags */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Skills / Tags</label>
            <input name="tags" placeholder="Solidity, React, TypeScript (comma-separated)" style={inputStyle} />
          </div>

          {/* Description */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Description *</label>
            <textarea
              name="description"
              placeholder="Describe the role, responsibilities, and what you're looking for..."
              required
              rows={5}
              style={{
                ...inputStyle, height: "auto", padding: "12px 14px",
                resize: "vertical", lineHeight: 1.65,
              }}
            />
          </div>

          {/* Milestone toggle */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", borderRadius: 12,
            border: "1px solid var(--card-border)",
            background: "var(--dropdown-bg)",
            marginBottom: 28,
          }}>
            <div>
              <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.88rem", color: "var(--foreground)", margin: 0 }}>
                Milestone Payments
              </p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: "var(--text-muted)", margin: "3px 0 0" }}>
                Split payment across project milestones
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMilestones(v => !v)}
              style={{
                width: 44, height: 26, borderRadius: 99,
                background: milestones ? "#14B8A6" : "var(--card-border)",
                border: "none", cursor: "pointer",
                position: "relative", transition: "background 0.2s", flexShrink: 0,
              }}
            >
              <span style={{
                position: "absolute", top: 3,
                left: milestones ? 21 : 3,
                width: 20, height: 20, borderRadius: "50%",
                background: "#fff",
                transition: "left 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }} />
            </button>
          </div>

          {error && (
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "#ef4444", marginBottom: 16, margin: "0 0 16px" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            style={{
              height: 50, borderRadius: 14,
              background: isPending ? "var(--card-border)" : "#14B8A6",
              color: "#fff", border: "none", cursor: isPending ? "not-allowed" : "pointer",
              fontFamily: "Inter, sans-serif", fontWeight: 700,
              fontSize: "0.95rem", letterSpacing: "0.02em",
              transition: "background 0.15s",
            }}
          >
            {isPending ? "Posting..." : "Post Job"}
          </button>
        </form>
      </div>
    </main>
  );
}
