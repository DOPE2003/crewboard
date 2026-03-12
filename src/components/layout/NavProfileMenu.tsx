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

function MenuLink({ href, icon, children, badge }: { href: string; icon: React.ReactNode; children: React.ReactNode; badge?: number }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex", alignItems: "center", gap: "0.65rem", width: "100%",
        padding: "0.55rem 0.85rem", borderRadius: "9px",
        fontFamily: "Outfit, sans-serif", fontSize: "0.84rem", fontWeight: 500,
        color: "#1a1a1a", textDecoration: "none", transition: "background 0.12s",
        position: "relative",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.05)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <span style={{ color: "#64748b", display: "flex", alignItems: "center" }}>{icon}</span>
      {children}
      {badge != null && badge > 0 && (
        <span style={{
          marginLeft: "auto", background: "#14b8a6", color: "#fff",
          borderRadius: "999px", fontSize: "0.62rem", fontWeight: 700,
          padding: "1px 6px", fontFamily: "Space Mono, monospace",
        }}>{badge}</span>
      )}
    </Link>
  );
}

export default function NavProfileMenu({
  image, name, twitterHandle, role, availability, unreadCount = 0,
}: Props) {
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
        <div style={{
          position: "absolute", top: "calc(100% + 10px)", right: 0,
          background: "#fff", border: "1px solid rgba(0,0,0,0.09)",
          borderRadius: "16px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          minWidth: "240px", zIndex: 9999, overflow: "hidden",
        }}>

          {/* Profile header */}
          <div style={{
            display: "flex", alignItems: "center", gap: "0.85rem",
            padding: "1rem 1rem 0.85rem", borderBottom: "1px solid rgba(0,0,0,0.07)",
          }}>
            {image ? (
              <Image src={image} alt="" width={46} height={46}
                style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{
                width: 46, height: 46, borderRadius: "50%", background: "rgba(0,0,0,0.08)", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "Outfit, sans-serif", fontSize: "0.92rem", fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {name ?? twitterHandle ?? "User"}
              </div>
              {twitterHandle && (
                <div style={{ fontFamily: "Space Mono, monospace", fontSize: "0.65rem", color: "rgba(0,0,0,0.4)", marginTop: 2 }}>
                  @{twitterHandle}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: 5, flexWrap: "wrap" }}>
                {role && (
                  <span style={{ fontFamily: "Outfit, sans-serif", fontSize: "0.66rem", fontWeight: 700, color: "#fff", background: "#14b8a6", borderRadius: "999px", padding: "2px 9px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
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
            </div>
          </div>

          {/* Main nav links */}
          <div style={{ padding: "0.5rem" }}>
            <MenuLink href={twitterHandle ? `/u/${twitterHandle}` : "/dashboard"} icon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            }>My Profile</MenuLink>

            <MenuLink href="/gigs" icon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
            }>My Jobs</MenuLink>

            <MenuLink href="/messages" icon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            } badge={unreadCount}>Messages</MenuLink>

            <MenuLink href="/talent" icon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            }>Saved Talents</MenuLink>
          </div>

          {/* Account section */}
          <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)", padding: "0.5rem" }}>
            <div style={{ fontFamily: "Space Mono, monospace", fontSize: "0.56rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#94a3b8", padding: "0.3rem 0.85rem 0.4rem" }}>
              Account
            </div>

            <MenuLink href="/settings" icon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            }>Settings</MenuLink>

            <MenuLink href="/billing" icon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            }>Billing &amp; Wallet</MenuLink>

            <MenuLink href="/dashboard" icon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            }>Switch to Client</MenuLink>

            <MenuLink href="/help" icon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            }>Help &amp; Support</MenuLink>
          </div>

          {/* Sign out */}
          <div style={{ padding: "0 0.5rem 0.5rem", borderTop: "1px solid rgba(0,0,0,0.07)" }}>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              style={{
                display: "flex", alignItems: "center", gap: "0.65rem", width: "100%",
                padding: "0.55rem 0.85rem", borderRadius: "9px",
                fontFamily: "Outfit, sans-serif", fontSize: "0.84rem", fontWeight: 500,
                color: "#dc2626", background: "transparent", border: "none", cursor: "pointer",
                textAlign: "left", transition: "background 0.12s", marginTop: "0.4rem",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(220,38,38,0.06)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
