"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "5px 11px",
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        color: active ? "var(--foreground)" : "var(--text-muted)",
        textDecoration: "none",
        whiteSpace: "nowrap",
        borderRadius: 8,
        letterSpacing: "-0.01em",
        transition: "color 0.15s, background 0.12s",
        background: active ? "rgba(0,0,0,0.05)" : "transparent",
        fontFamily: "inherit",
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
      }}
    >
      {label}
    </Link>
  );
}

export default function NavInlineLinks({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex" style={{ alignItems: "center", gap: 2, flexShrink: 0 }}>
      <NavLink href="/talent"     label="Browse Talent"   active={pathname === "/talent"} />
      <NavLink href="/gigs"       label="Browse Services" active={pathname.startsWith("/gigs")} />
      <NavLink href="/#how-it-works" label="How it Works" active={false} />
      {isLoggedIn && (
        <NavLink href="/dashboard" label="Dashboard" active={pathname === "/dashboard"} />
      )}
    </div>
  );
}
