"use client";

import { useMode, type Mode } from "@/components/ModeProvider";

export default function ModeToggle({
  mode: propMode,
  onChange: propOnChange,
}: {
  mode?: Mode;
  onChange?: (m: Mode) => void;
} = {}) {
  const ctx = useMode();
  const mode = propMode !== undefined ? propMode : ctx.mode;
  const onChange = propOnChange ?? ctx.setMode;

  return (
    <div style={{
      display: "inline-flex",
      background: "var(--card-bg)",
      border: "1px solid var(--card-border)",
      borderRadius: 10,
      padding: 3,
      gap: 2,
    }}>
      {(["hiring", "working"] as Mode[]).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          style={{
            padding: "5px 14px", borderRadius: 7, border: "none", cursor: "pointer",
            fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em",
            transition: "all 0.15s",
            background: mode === m ? "#14b8a6" : "transparent",
            color: mode === m ? "#fff" : "var(--text-muted)",
          }}
        >
          {m === "hiring" ? "Client" : "Freelancer"}
        </button>
      ))}
    </div>
  );
}
