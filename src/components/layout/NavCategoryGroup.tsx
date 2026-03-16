"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Item = { label: string; href: string };

interface Props {
  label: string;
  color: string;
  items: Item[];
}

export default function NavCategoryGroup({ label, color, items }: Props) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const hide = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => {
    return () => { if (closeTimer.current) clearTimeout(closeTimer.current); };
  }, []);

  return (
    <li
      style={{ position: "relative", listStyle: "none" }}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <button
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "inherit",
          fontSize: "clamp(0.65rem, 2.2vw, 0.82rem)",
          fontFamily: "Rajdhani, sans-serif",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
          whiteSpace: "nowrap",
          transition: "color 0.2s",
          padding: "0.5rem 0.6rem",
        }}
      >
        {label}
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

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
            padding: "0.6rem",
            zIndex: 9999,
            minWidth: "200px",
          }}
        >
          {/* arrow */}
          <div style={{
            position: "absolute",
            top: -6,
            left: "50%",
            transform: "translateX(-50%)",
            width: 12,
            height: 12,
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.09)",
            borderBottom: "none",
            borderRight: "none",
            rotate: "45deg",
          }} />

          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.45rem 0.65rem",
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
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: color,
                  flexShrink: 0,
                }} />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </li>
  );
}
