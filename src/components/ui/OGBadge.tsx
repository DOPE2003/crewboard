export default function OGBadge({ size = "sm" }: { size?: "sm" | "lg" }) {
  const pad = size === "lg" ? "4px 12px" : "2px 8px";
  const font = size === "lg" ? "0.68rem" : "0.58rem";

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: pad, borderRadius: 99,
      background: "linear-gradient(135deg, #78350f 0%, #92400e 100%)",
      border: "1px solid rgba(251,191,36,0.4)",
      boxShadow: "0 0 8px rgba(251,191,36,0.2)",
      fontSize: font, fontWeight: 700, letterSpacing: "0.06em",
      color: "#fbbf24",
      flexShrink: 0,
      whiteSpace: "nowrap",
    }}>
      <svg width="9" height="9" viewBox="0 0 24 24" fill="#fbbf24" style={{ flexShrink: 0 }}>
        <path d="M2 20h20L12 4 7 14l-5 6zm10-3a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
      </svg>
      OG
    </span>
  );
}
