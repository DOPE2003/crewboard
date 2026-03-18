"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const CATEGORIES = [
  {
    label: "Creative",
    color: "#f59e0b",
    items: [
      { label: "Video & Animation", href: "/talent?role=Video+%26+Animation" },
      { label: "Artist",            href: "/talent?role=Artist" },
    ],
  },
  {
    label: "Design",
    color: "#8b5cf6",
    items: [
      { label: "Web3 Designer",    href: "/talent?role=Web3+Web+Designer" },
      { label: "Graphic & Design", href: "/talent?role=Graphic+%26+Design" },
      { label: "Content Creator",  href: "/talent?role=Content+Creator" },
    ],
  },
  {
    label: "Marketing",
    color: "#14b8a6",
    items: [
      { label: "Social Marketing",  href: "/talent?role=Social+Marketing" },
      { label: "KOL Manager",       href: "/talent?role=KOL+Manager" },
      { label: "Exchange Listings", href: "/talent?role=Exchange+Listings+Manager" },
    ],
  },
  {
    label: "Tech",
    color: "#3b82f6",
    items: [
      { label: "Coding & Tech", href: "/talent?role=Coding+%26+Tech" },
      { label: "AI Engineer",   href: "/talent?role=AI+Engineer" },
    ],
  },
];

interface Props {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export default function NavMobileMenu({ isOpen, onOpen, onClose }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  // Reset accordion when drawer closes
  useEffect(() => { if (!isOpen) setExpanded(null); }, [isOpen]);

  function toggleAccordion(label: string) {
    setExpanded((prev) => (prev === label ? null : label));
  }

  return (
    <>
      {/* Hamburger button */}
      <button
        className="nav-hamburger"
        onClick={() => isOpen ? onClose() : onOpen()}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}
      >
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 199,
              background: "rgba(0,0,0,0.35)",
            }}
          />

          {/* Drawer */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 200,
              background: "#fff",
              boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
              overflowY: "auto",
              maxHeight: "85vh",
            }}
          >
            {/* Drawer header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "1rem 1.25rem",
              borderBottom: "1px solid rgba(0,0,0,0.08)",
            }}>
              <span style={{
                fontFamily: "Rajdhani, sans-serif",
                fontWeight: 700,
                fontSize: "1rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#000",
              }}>
                Browse Categories
              </span>
              <button
                onClick={onClose}
                aria-label="Close menu"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 8,
                  color: "#000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 44,
                  minHeight: 44,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Accordion categories */}
            {CATEGORIES.map((cat, i) => (
              <div key={cat.label} style={{ borderBottom: i < CATEGORIES.length - 1 ? "1px solid rgba(0,0,0,0.07)" : "none" }}>
                {/* Category header */}
                <button
                  onClick={() => toggleAccordion(cat.label)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 20px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    minHeight: 52,
                    textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: cat.color,
                      flexShrink: 0,
                    }} />
                    <span style={{
                      fontFamily: "Rajdhani, sans-serif",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "#000",
                    }}>
                      {cat.label}
                    </span>
                  </div>
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="rgba(0,0,0,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transition: "transform 0.2s", transform: expanded === cat.label ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Subcategory items */}
                {expanded === cat.label && (
                  <div style={{ background: "rgba(0,0,0,0.015)", paddingBottom: "0.25rem" }}>
                    {cat.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.6rem",
                          padding: "14px 20px 14px 36px",
                          minHeight: 48,
                          fontFamily: "Outfit, sans-serif",
                          fontSize: "0.88rem",
                          fontWeight: 600,
                          color: "#334155",
                          textDecoration: "none",
                          borderBottom: "1px solid rgba(0,0,0,0.04)",
                        }}
                      >
                        <span style={{
                          width: 5, height: 5, borderRadius: "50%",
                          background: cat.color, flexShrink: 0,
                        }} />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Browse all link */}
            <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid rgba(0,0,0,0.07)" }}>
              <Link
                href="/talent"
                onClick={onClose}
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "0.75rem",
                  borderRadius: 10,
                  background: "#0f172a",
                  color: "#fff",
                  fontFamily: "Rajdhani, sans-serif",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                }}
              >
                Browse All Talent
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
