"use client";

type Mode = "hiring" | "working";

export default function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div style={{ display: "inline-flex", background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 10, padding: 3, gap: 2 }}>
      {(["hiring", "working"] as Mode[]).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          style={{
            padding: "5px 14px", borderRadius: 7, border: "none", cursor: "pointer",
            fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
            transition: "all 0.15s",
            background: mode === m ? "#14b8a6" : "transparent",
            color: mode === m ? "#fff" : "var(--text-muted)",
          }}
        >
          {m === "hiring" ? "Hiring" : "Working"}
        </button>
      ))}
    </div>
  );
}
