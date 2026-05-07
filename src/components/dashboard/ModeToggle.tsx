"use client";

import { useMode, setMode, type Mode } from "@/components/ModeProvider";

export default function ModeToggle() {
  const { mode } = useMode();

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
          onClick={() => setMode(m)}
          style={{
            padding: "3px 10px", borderRadius: 6, border: "none", cursor: "pointer",
            fontSize: "0.63rem", fontWeight: 700, letterSpacing: "0.04em",
            transition: "all 0.15s",
            background: mode === m ? "#14b8a6" : "transparent",
            color: mode === m ? "#fff" : "var(--text-muted)",
          }}
        >
          {m === "hiring" ? "I'M HIRING" : "I'M OFFERING"}
        </button>
      ))}
    </div>
  );
}
