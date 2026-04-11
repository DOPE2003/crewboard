"use client";

export default function ScrollToTrustButton() {
  return (
    <button
      onClick={() => document.getElementById("trust")?.scrollIntoView({ behavior: "smooth" })}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
        fontSize: "0.68rem",
        color: "#14B8A6",
        fontWeight: 600,
        textDecoration: "underline",
        textUnderlineOffset: 3,
        opacity: 0.8,
      }}
    >
      How escrow works ↓
    </button>
  );
}
