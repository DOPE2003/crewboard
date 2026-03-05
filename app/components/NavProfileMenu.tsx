"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface Props {
  image: string | null;
  name: string | null;
  twitterHandle?: string | null;
  role?: string | null;
  availability?: string | null;
}

const AVAILABILITY_COLORS: Record<string, string> = {
  available: "#22c55e",
  open: "#f59e0b",
  busy: "#ef4444",
};

const AVAILABILITY_LABELS: Record<string, string> = {
  available: "Available",
  open: "Open to offers",
  busy: "Busy",
};

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        width: "100%",
        padding: "0.52rem 0.75rem",
        borderRadius: "8px",
        fontFamily: "Outfit, sans-serif",
        fontSize: "0.83rem",
        fontWeight: 600,
        color: "#111",
        textDecoration: "none",
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.05)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {children}
    </Link>
  );
}

export default function NavProfileMenu({ image, name, twitterHandle, role, availability }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const availColor = availability ? (AVAILABILITY_COLORS[availability] ?? "#94a3b8") : null;
  const availLabel = availability ? (AVAILABILITY_LABELS[availability] ?? availability) : null;

  return (
    <div ref={wrapRef} style={{ position: "relative", flexShrink: 0 }}>

      {/* Avatar trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Profile menu"
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center" }}
      >
        {image ? (
          <Image
            src={image}
            alt="Profile"
            width={36}
            height={36}
            style={{
              borderRadius: "50%",
              objectFit: "cover",
              border: open ? "2px solid #14b8a6" : "2px solid rgba(0,0,0,0.1)",
              transition: "border-color 0.2s",
            }}
          />
        ) : (
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(0,0,0,0.08)",
            border: open ? "2px solid #14b8a6" : "2px solid rgba(0,0,0,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "border-color 0.2s",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="nav-profile-dropdown" style={{
          position: "absolute",
          top: "calc(100% + 10px)",
          right: 0,
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.09)",
          borderRadius: "14px",
          boxShadow: "0 16px 48px rgba(0,0,0,0.14)",
          minWidth: "230px",
          zIndex: 9999,
          overflow: "hidden",
        }}>

          {/* ── HEADER: mini profile ── */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.8rem",
            padding: "1rem",
            borderBottom: "1px solid rgba(0,0,0,0.07)",
          }}>
            {image ? (
              <Image src={image} alt="" width={44} height={44}
                style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "rgba(0,0,0,0.08)", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
            )}

            <div style={{ minWidth: 0 }}>
              {/* Name */}
              <div style={{
                fontFamily: "Outfit, sans-serif",
                fontSize: "0.9rem",
                fontWeight: 700,
                color: "#000",
                lineHeight: 1.2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {name ?? twitterHandle ?? "User"}
              </div>

              {/* Handle */}
              {twitterHandle && (
                <div style={{
                  fontFamily: "Space Mono, monospace",
                  fontSize: "0.67rem",
                  color: "rgba(0,0,0,0.4)",
                  letterSpacing: "0.03em",
                  marginTop: 2,
                }}>
                  @{twitterHandle}
                </div>
              )}

              {/* Role + availability row */}
              {(role || availColor) && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: 5, flexWrap: "wrap" }}>
                  {role && (
                    <span style={{
                      fontFamily: "Outfit, sans-serif",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      color: "#fff",
                      background: "#000",
                      borderRadius: "999px",
                      padding: "1px 8px",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}>
                      {role}
                    </span>
                  )}
                  {availColor && availLabel && (
                    <span style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontFamily: "Outfit, sans-serif",
                      fontSize: "0.68rem",
                      fontWeight: 600,
                      color: availColor,
                    }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: availColor, flexShrink: 0,
                      }} />
                      {availLabel}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── NAV LINKS ── */}
          <div style={{ padding: "0.5rem" }}>
            <MenuLink href="/dashboard">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
              Dashboard
            </MenuLink>

            <MenuLink href={twitterHandle ? `/u/${twitterHandle}` : "/dashboard"}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              View Full Profile
            </MenuLink>

            <MenuLink href="/projects?mine=1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              My Projects
            </MenuLink>
          </div>

          {/* ── SIGN OUT ── */}
          <div style={{ padding: "0 0.5rem 0.5rem", borderTop: "1px solid rgba(0,0,0,0.07)" }}>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                width: "100%",
                padding: "0.52rem 0.75rem",
                borderRadius: "8px",
                fontFamily: "Outfit, sans-serif",
                fontSize: "0.83rem",
                fontWeight: 600,
                color: "#dc2626",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.12s",
                marginTop: "0.5rem",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(220,38,38,0.06)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign Out
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
