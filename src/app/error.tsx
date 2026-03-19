"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ textAlign: "center", maxWidth: 420, padding: "2rem 1.5rem" }}>
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 12 }}>
          Something went wrong
        </div>
        <h2 style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "#0f172a", margin: "0 0 0.75rem" }}>
          Unexpected Error
        </h2>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "rgba(0,0,0,0.5)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
          Something went wrong loading this page. This is likely a temporary issue.
        </p>
        <button
          onClick={reset}
          style={{
            fontFamily: "Inter, sans-serif", fontSize: "0.72rem", fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase",
            background: "#0f172a", color: "#fff",
            border: "none", borderRadius: 8, padding: "0.65rem 1.5rem", cursor: "pointer",
          }}
        >
          Try again
        </button>
      </div>
    </main>
  );
}
