"use client";

import { useMode, setMode, type Mode } from "@/components/ModeProvider";

const OPTIONS: { mode: Mode; label: string; hint: string }[] = [
  { mode: "hiring",  label: "HIRE",      hint: "Post jobs & find talent" },
  { mode: "working", label: "FREELANCE", hint: "Browse jobs & get paid"  },
];

export default function ModeToggle() {
  const { mode } = useMode();

  return (
    <div
      style={{
        display: "inline-flex",
        background: "var(--card-bg)",
        border: "1px solid var(--card-border)",
        borderRadius: 10,
        padding: 3,
        gap: 2,
      }}
    >
      {OPTIONS.map((o) => {
        const active = mode === o.mode;
        return (
          <button
            key={o.mode}
            onClick={() => setMode(o.mode)}
            title={o.hint}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer",
              transition: "all 0.15s",
              background: active ? "#14b8a6" : "transparent",
              color: active ? "#fff" : "var(--text-muted)",
            }}
          >
            <span style={{ fontSize: "0.63rem", fontWeight: 800, letterSpacing: "0.04em", lineHeight: 1.2 }}>
              {o.label}
            </span>
            <span style={{ fontSize: "0.52rem", fontWeight: 500, opacity: active ? 0.85 : 0.7, lineHeight: 1.2, whiteSpace: "nowrap" }}>
              {o.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}
