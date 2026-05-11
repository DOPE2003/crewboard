"use client";

import { useMode, setMode, type Mode } from "@/components/ModeProvider";

const OPTIONS: { mode: Mode; label: string; hint: string }[] = [
  { mode: "hiring",  label: "I'm Hiring",      hint: "Post jobs & find talent" },
  { mode: "working", label: "I'm a Freelancer", hint: "Browse jobs & get paid"  },
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
              padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer",
              transition: "all 0.15s",
              background: active ? "#14b8a6" : "transparent",
              color: active ? "#fff" : "var(--text-muted)",
            }}
          >
            <span style={{ fontSize: "0.82rem", fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.3, whiteSpace: "nowrap" }}>
              {o.label}
            </span>
            <span style={{ fontSize: "0.58rem", fontWeight: 500, opacity: active ? 0.85 : 0.65, lineHeight: 1.2, whiteSpace: "nowrap" }}>
              {o.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}
