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
  unreadCount?: number;
  gigsCount?: number;
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
        display: "flex", alignItems: "center", gap: "0.6rem", width: "100%",
        padding: "0.52rem 0.75rem", borderRadius: "8px",
        fontFamily: "Outfit, sans-serif", fontSize: "0.83rem", fontWeight: 600,
        color: "#111", textDecoration: "none", transition: "background 0.12s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.05)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {children}
    </Link>
  );
}

export default function NavProfileMenu({
  image, name, twitterHandle, role, availability, unreadCount = 0, gigsCount = 0,
}: Props) {
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

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
    <>
      <div ref={wrapRef} style={{ position: "relative", flexShrink: 0 }}>

        {/* Avatar trigger */}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Profile menu"
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          {image ? (
            <Image src={image} alt="Profile" width={36} height={36} style={{
              borderRadius: "50%", objectFit: "cover",
              border: open ? "2px solid #14b8a6" : "2px solid rgba(0,0,0,0.1)",
              transition: "border-color 0.2s",
            }} />
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
            position: "absolute", top: "calc(100% + 10px)", right: 0,
            background: "#fff", border: "1px solid rgba(0,0,0,0.09)",
            borderRadius: "14px", boxShadow: "0 16px 48px rgba(0,0,0,0.14)",
            minWidth: "230px", zIndex: 9999, overflow: "hidden",
          }}>

            {/* Mini profile header */}
            <div style={{
              display: "flex", alignItems: "center", gap: "0.8rem",
              padding: "1rem", borderBottom: "1px solid rgba(0,0,0,0.07)",
            }}>
              {image ? (
                <Image src={image} alt="" width={44} height={44}
                  style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", background: "rgba(0,0,0,0.08)", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "Outfit, sans-serif", fontSize: "0.9rem", fontWeight: 700, color: "#000", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {name ?? twitterHandle ?? "User"}
                </div>
                {twitterHandle && (
                  <div style={{ fontFamily: "Space Mono, monospace", fontSize: "0.67rem", color: "rgba(0,0,0,0.4)", marginTop: 2 }}>
                    @{twitterHandle}
                  </div>
                )}
                {(role || availColor) && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: 5, flexWrap: "wrap" }}>
                    {role && (
                      <span style={{ fontFamily: "Outfit, sans-serif", fontSize: "0.68rem", fontWeight: 700, color: "#fff", background: "#000", borderRadius: "999px", padding: "1px 8px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                        {role}
                      </span>
                    )}
                    {availColor && availLabel && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "Outfit, sans-serif", fontSize: "0.68rem", fontWeight: 600, color: availColor }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: availColor, flexShrink: 0 }} />
                        {availLabel}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Nav links */}
            <div style={{ padding: "0.5rem" }}>
              {/* Dashboard — opens drawer */}
              <button
                onClick={() => { setOpen(false); setDrawerOpen(true); }}
                style={{
                  display: "flex", alignItems: "center", gap: "0.6rem", width: "100%",
                  padding: "0.52rem 0.75rem", borderRadius: "8px",
                  fontFamily: "Outfit, sans-serif", fontSize: "0.83rem", fontWeight: 600,
                  color: "#111", background: "transparent", border: "none", cursor: "pointer",
                  textAlign: "left", transition: "background 0.12s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                Dashboard
              </button>

              <MenuLink href={twitterHandle ? `/u/${twitterHandle}` : "/dashboard"}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                My Profile
              </MenuLink>

              <MenuLink href="/messages">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                Messages
              </MenuLink>
            </div>

            {/* Sign out */}
            <div style={{ padding: "0 0.5rem 0.5rem", borderTop: "1px solid rgba(0,0,0,0.07)" }}>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                style={{
                  display: "flex", alignItems: "center", gap: "0.6rem", width: "100%",
                  padding: "0.52rem 0.75rem", borderRadius: "8px",
                  fontFamily: "Outfit, sans-serif", fontSize: "0.83rem", fontWeight: 600,
                  color: "#dc2626", background: "transparent", border: "none", cursor: "pointer",
                  textAlign: "left", transition: "background 0.12s", marginTop: "0.5rem",
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

      {/* ── Mini Dashboard Drawer ── */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 9998,
              background: "rgba(0,0,0,0.15)", backdropFilter: "blur(2px)",
            }}
          />

          {/* Slide-in panel */}
          <div style={{
            position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 9999,
            width: 300, background: "#fff",
            borderLeft: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "-12px 0 40px rgba(0,0,0,0.1)",
            display: "flex", flexDirection: "column",
            animation: "drawerSlideIn 0.22s cubic-bezier(0.4,0,0.2,1)",
          }}>

            {/* Header */}
            <div style={{ padding: "1.25rem 1.25rem 1rem", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: "Outfit, sans-serif", fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
                    {name?.split(" ")[0] ?? twitterHandle ?? "Builder"}
                  </div>
                  {twitterHandle && (
                    <div style={{ fontFamily: "Space Mono, monospace", fontSize: "0.62rem", color: "#94a3b8", marginTop: 2 }}>
                      @{twitterHandle}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Stats */}
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                {[
                  { label: "Active Gigs", value: gigsCount },
                  { label: "Notifications", value: unreadCount },
                ].map((s) => (
                  <div key={s.label} style={{ borderRadius: 10, padding: "0.85rem 1rem", background: "#f8fafc", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <div style={{ fontFamily: "Space Mono, monospace", fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>{s.value}</div>
                    <div style={{ fontSize: "0.58rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div style={{ padding: "0.75rem 1.25rem", flex: 1 }}>
              <div style={{ fontFamily: "Space Mono, monospace", fontSize: "0.55rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8", marginBottom: "0.6rem" }}>
                Quick Actions
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                {[
                  { href: twitterHandle ? `/u/${twitterHandle}` : "/dashboard", label: "My Profile" },
                  { href: "/messages", label: "Messages" },
                  { href: "/gigs/new", label: "Post a Gig" },
                  { href: "/talent", label: "Explore Talent" },
                  { href: "/gigs", label: "Browse Gigs" },
                ].map((a) => (
                  <Link key={a.href} href={a.href} onClick={() => setDrawerOpen(false)} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "0.55rem 0.75rem", borderRadius: 8, textDecoration: "none",
                    fontFamily: "Outfit, sans-serif", fontSize: "0.8rem", fontWeight: 500,
                    color: "#0f172a", background: "#f8fafc", border: "1px solid rgba(0,0,0,0.05)",
                  }}>
                    {a.label}
                    <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>→</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Full dashboard CTA */}
            <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid rgba(0,0,0,0.07)" }}>
              <Link href="/dashboard" onClick={() => setDrawerOpen(false)} style={{
                display: "block", width: "100%", padding: "0.75rem",
                borderRadius: 99, background: "#0f172a", color: "#fff",
                fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "0.8rem",
                textAlign: "center", textDecoration: "none", letterSpacing: "0.04em",
              }}>
                Open Full Dashboard
              </Link>
            </div>

          </div>
        </>
      )}

      <style>{`
        @keyframes drawerSlideIn {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
