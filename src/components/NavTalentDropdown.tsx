"use client";

import { useRef, useState } from "react";
import Link from "next/link";

const TALENT_CATEGORIES = [
  { label: "KOL Manager",                href: "/talent?role=KOL+Manager" },
  { label: "Exchange Listings",          href: "/talent?role=Exchange+Listings+Manager" },
  { label: "Web3 Web Designer",          href: "/talent?role=Web3+Web+Designer" },
  { label: "Social Marketing",           href: "/talent?role=Social+Marketing" },
  { label: "Artist",                     href: "/talent?role=Artist" },
  { label: "Video & Animation",          href: "/talent?role=Video+%26+Animation" },
  { label: "Coding & Tech",              href: "/talent?role=Coding+%26+Tech" },
  { label: "AI Engineer",               href: "/talent?role=AI+Engineer" },
  { label: "Content Creator",           href: "/talent?role=Content+Creator" },
  { label: "Graphic & Design",          href: "/talent?role=Graphic+%26+Design" },
];

export default function NavTalentDropdown() {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const hide = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <li style={{ position: "relative", listStyle: "none" }}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <Link
        href="/talent"
        style={{
          color: "inherit",
          textDecoration: "none",
          fontSize: "0.82rem",
          fontFamily: "Rajdhani, sans-serif",
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          display: "flex",
          alignItems: "center",
          gap: "0.3rem",
          transition: "color 0.2s",
        }}
      >
        Find Talent
        {/* chevron */}
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </Link>

      {open && (
        <div
          onMouseEnter={show}
          onMouseLeave={hide}
          style={{
            position: "absolute",
            top: "calc(100% + 14px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.09)",
            borderRadius: "14px",
            boxShadow: "0 16px 48px rgba(0,0,0,0.12)",
            padding: "0.75rem",
            zIndex: 9999,
            minWidth: "340px",
          }}
        >
          {/* arrow */}
          <div style={{
            position: "absolute",
            top: -6,
            left: "50%",
            transform: "translateX(-50%)",
            width: 12, height: 12,
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.09)",
            borderBottom: "none",
            borderRight: "none",
            rotate: "45deg",
          }} />

          {/* Category grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2px",
          }}>
            {TALENT_CATEGORIES.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 0.65rem",
                  borderRadius: "8px",
                  fontFamily: "Outfit, sans-serif",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#111",
                  textDecoration: "none",
                  transition: "background 0.12s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: "#14b8a6", flexShrink: 0,
                }} />
                {cat.label}
              </Link>
            ))}
          </div>

          {/* Footer link */}
          <div style={{
            borderTop: "1px solid rgba(0,0,0,0.07)",
            marginTop: "0.5rem",
            paddingTop: "0.5rem",
          }}>
            <Link
              href="/talent"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                padding: "0.45rem",
                borderRadius: "8px",
                fontFamily: "Space Mono, monospace",
                fontSize: "0.58rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "rgba(0,0,0,0.45)",
                textDecoration: "none",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#000")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(0,0,0,0.45)")}
            >
              Browse all talent →
            </Link>
          </div>
        </div>
      )}
    </li>
  );
}
