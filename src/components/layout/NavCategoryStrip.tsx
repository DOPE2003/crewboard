"use client";

import Link from "next/link";
import { useMode } from "@/components/ModeProvider";

export default function NavCategoryStrip() {
  const { mode } = useMode();
  const isHiring = mode === "hiring";

  return (
    <div
      className="cb-cat-strip"
      style={{
        background: "var(--nav-bg, #ffffff)",
        borderBottom: "1px solid var(--nav-border, #e5e7eb)",
        overflowX: "auto",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      } as React.CSSProperties}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 24px",
          maxWidth: 1280,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Home — always visible */}
        <Link
          href="/"
          className="cb-cat-link cb-intent-link"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "11px 14px", fontSize: 12, fontWeight: 500, color: "var(--text-muted, #6b7280)", textDecoration: "none", whiteSpace: "nowrap", borderBottom: "2px solid transparent", transition: "color 0.15s, border-color 0.15s", flexShrink: 0 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Home
        </Link>

        {/* Find Talent — hiring mode only */}
        {isHiring && (
          <Link
            href="/talent"
            className="cb-cat-link cb-intent-link"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "11px 14px", fontSize: 12, fontWeight: 700, color: "var(--foreground, #111)", textDecoration: "none", whiteSpace: "nowrap", borderBottom: "2px solid transparent", transition: "color 0.15s, border-color 0.15s", flexShrink: 0 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Find Talent
          </Link>
        )}

        {/* Find Work — working mode only */}
        {!isHiring && (
          <Link
            href="/jobs"
            className="cb-cat-link cb-intent-link"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "11px 14px", fontSize: 12, fontWeight: 700, color: "var(--foreground, #111)", textDecoration: "none", whiteSpace: "nowrap", borderBottom: "2px solid transparent", transition: "color 0.15s, border-color 0.15s", flexShrink: 0 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            </svg>
            Find Work
          </Link>
        )}

        {/* How it Works — always visible */}
        <Link
          href="/how"
          className="cb-cat-link"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "11px 14px", fontSize: 12, fontWeight: 500, color: "var(--text-muted, #6b7280)", textDecoration: "none", whiteSpace: "nowrap", borderBottom: "2px solid transparent", transition: "color 0.15s, border-color 0.15s", flexShrink: 0 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          How it Works
        </Link>
      </div>

      <style>{`
        .cb-cat-link:hover {
          color: #14B8A6 !important;
          border-bottom-color: #14B8A6 !important;
        }
        nav ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
