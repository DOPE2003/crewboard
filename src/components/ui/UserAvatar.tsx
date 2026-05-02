"use client";

import { useState } from "react";

interface Props {
  src?: string | null;
  name?: string | null;
  size?: number;
  style?: React.CSSProperties;
}

function initials(name?: string | null): string {
  if (!name) return "?";
  return name.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function hashColor(name?: string | null): string {
  const colors = ["#14b8a6","#0d9488","#0891b2","#7c3aed","#db2777","#ea580c","#16a34a"];
  if (!name) return colors[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return colors[h % colors.length];
}

export default function UserAvatar({ src, name, size = 40, style }: Props) {
  const [broken, setBroken] = useState(false);

  const base: React.CSSProperties = {
    width: size, height: size, borderRadius: "50%",
    overflow: "hidden", flexShrink: 0, display: "flex",
    alignItems: "center", justifyContent: "center",
    background: hashColor(name),
    fontSize: size * 0.36, fontWeight: 700, color: "#fff",
    ...style,
  };

  if (src && !broken) {
    return (
      <div style={base}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name ?? ""}
          onError={() => setBroken(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    );
  }

  return <div style={base}>{initials(name)}</div>;
}
