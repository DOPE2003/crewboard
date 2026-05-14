"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className="nav-inline-link"
      style={{
        display: "inline-flex", alignItems: "center",
        padding: "5px 10px", fontSize: 12.5,
        fontWeight: active ? 800 : 600,
        color: active ? "var(--foreground)" : "var(--text-muted)",
        textDecoration: "none", whiteSpace: "nowrap", borderRadius: 6,
      }}
    >
      {label}
    </Link>
  );
}

export default function NavInlineLinks({ isLoggedIn: _ }: { isLoggedIn: boolean }) {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex" style={{ alignItems: "center", gap: 2, flexShrink: 0 }}>
      <NavLink href="/" label="Home" active={pathname === "/"} />
      <NavLink href="/dashboard" label="Dashboard" active={pathname === "/dashboard"} />
      <NavLink href="/how" label="How it Works" active={pathname === "/how"} />
    </div>
  );
}
