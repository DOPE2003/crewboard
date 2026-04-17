"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { getDashboardData } from "@/actions/dashboard";

type User = Awaited<ReturnType<typeof getDashboardData>>;

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { href: "#profile", label: "Profile",   icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  { href: "/notifications", label: "Notifications", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
  { href: "/messages",      label: "Messages",      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  { href: "/gigs",          label: "Services",      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg> },
  { href: "/talent",        label: "Talent",        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { href: "/projects",      label: "Projects",      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg> },
];

export default function DashboardDrawer() {
  const [open, setOpen]     = useState(false);
  const [user, setUser]     = useState<User>(null);
  const [loading, setLoading] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Listen for open event dispatched by NavProfileMenu
  useEffect(() => {
    const handler = () => {
      setOpen(true);
      if (!user) {
        setLoading(true);
        getDashboardData().then((data) => {
          setUser(data);
          setLoading(false);
        });
      }
    };
    window.addEventListener("open-dashboard-drawer", handler);
    return () => window.removeEventListener("open-dashboard-drawer", handler);
  }, [user]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const availColor =
    user?.availability === "available" ? "#22c55e" :
    user?.availability === "open"      ? "#f59e0b" : "#ef4444";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: "fixed", inset: 0, zIndex: 8000,
          background: "rgba(0,0,0,0.25)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "all" : "none",
          transition: "opacity 0.25s ease",
          backdropFilter: open ? "blur(2px)" : "none",
        }}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: 280, zIndex: 9000,
          background: "#fff",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
          display: "flex", flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
          overflowY: "auto",
        }}
      >
        {/* Close button */}
        <button
          onClick={() => setOpen(false)}
          style={{
            position: "absolute", top: 12, right: 12,
            background: "rgba(0,0,0,0.05)", border: "none", borderRadius: 8,
            width: 28, height: 28, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#64748b",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        <div style={{ padding: "1.5rem 1rem 1rem" }}>

          {/* Workspace card */}
          {loading ? (
            <div style={{ height: 64, borderRadius: 12, background: "var(--surface-2)", marginBottom: "1rem" }} />
          ) : user ? (
            <Link
              href={`/u/${user.twitterHandle}`}
              onClick={() => setOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.75rem", borderRadius: 12, marginBottom: "1rem",
                border: "1px solid var(--card-border)", textDecoration: "none",
                background: "var(--surface-2)",
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "var(--avatar-bg)" }}>
                {user.image
                  ? <img src={user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#134e4a,#0f172a)" }} />}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.name ?? "Builder"}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: availColor }} />
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.6rem", color: "var(--text-muted)" }}>
                    @{user.twitterHandle}
                  </span>
                </div>
              </div>
              <svg style={{ marginLeft: "auto", color: "var(--text-hint)", flexShrink: 0 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </Link>
          ) : null}

          {/* Post a Gig */}
          <Link
            href="/gigs/new"
            onClick={() => setOpen(false)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0.7rem", borderRadius: 99, marginBottom: "1.5rem",
              background: "#0f172a", color: "#fff", textDecoration: "none",
              fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.05em",
            }}
          >
            + Post a Service
          </Link>

          {/* Nav */}
          <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.75rem",
                  padding: "0.6rem 0.75rem", borderRadius: 10,
                  color: "var(--text-muted)", textDecoration: "none",
                  fontSize: "0.82rem", fontWeight: 500,
                  transition: "background 0.12s, color 0.12s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover)"; e.currentTarget.style.color = "var(--foreground)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
              >
                <span style={{ opacity: 0.6 }}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Stats at bottom */}
        {user && (
          <div style={{ marginTop: "auto", padding: "1rem", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "1rem" }}>
              {[
                { label: "Services", value: user.gigs?.length ?? 0, color: "#2DD4BF" },
                { label: "Projects", value: 0, color: "#818cf8" },
                { label: "Crew", value: 0, color: "#f59e0b" },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: "center", padding: "0.6rem 0.25rem", borderRadius: 10, background: "var(--surface-2)" }}>
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1rem", color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => { signOut({ callbackUrl: "/" }); setOpen(false); }}
              style={{
                width: "100%", padding: "0.6rem", borderRadius: 10,
                background: "transparent", border: "1px solid rgba(220,38,38,0.2)",
                color: "#dc2626", fontWeight: 600, fontSize: "0.75rem",
                cursor: "pointer",
              }}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </>
  );
}
