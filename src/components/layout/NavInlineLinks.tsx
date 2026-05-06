"use client";

import Link from "next/link";
import { useMode } from "@/components/ModeProvider";
import { usePathname } from "next/navigation";

export default function NavInlineLinks() {
  const { mode } = useMode();
  const pathname = usePathname();
  const isHiring = mode === "hiring";

  return (
    <div className="hidden md:flex" style={{ alignItems: "center", gap: 2, flexShrink: 0 }}>
      <Link
        href="/"
        className="nav-inline-link"
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "5px 10px", fontSize: 12.5,
          fontWeight: pathname === "/" ? 700 : 500,
          color: pathname === "/" ? "var(--foreground)" : "var(--text-muted)",
          textDecoration: "none", whiteSpace: "nowrap", borderRadius: 6,
        }}
      >
        Home
      </Link>

      {isHiring ? (
        <Link
          href="/talent"
          className="nav-inline-link"
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "5px 10px", fontSize: 12.5,
            fontWeight: pathname === "/talent" ? 700 : 500,
            color: pathname === "/talent" ? "var(--foreground)" : "var(--text-muted)",
            textDecoration: "none", whiteSpace: "nowrap", borderRadius: 6,
          }}
        >
          Find Talent
        </Link>
      ) : (
        <Link
          href="/jobs"
          className="nav-inline-link"
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "5px 10px", fontSize: 12.5,
            fontWeight: pathname.startsWith("/jobs") ? 700 : 500,
            color: pathname.startsWith("/jobs") ? "var(--foreground)" : "var(--text-muted)",
            textDecoration: "none", whiteSpace: "nowrap", borderRadius: 6,
          }}
        >
          Find Work
        </Link>
      )}

      <Link
        href="/how"
        className="nav-inline-link"
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "5px 10px", fontSize: 12.5,
          fontWeight: pathname === "/how" ? 700 : 500,
          color: pathname === "/how" ? "var(--foreground)" : "var(--text-muted)",
          textDecoration: "none", whiteSpace: "nowrap", borderRadius: 6,
        }}
      >
        How it Works
      </Link>

      <style>{`.nav-inline-link:hover { color: #14B8A6 !important; background: rgba(20,184,166,0.07) !important; }`}</style>
    </div>
  );
}
