"use client";

import Link from "next/link";
import { useMode } from "@/components/ModeProvider";
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

export default function NavInlineLinks({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { mode } = useMode();
  const pathname = usePathname();

  return (
    <div className="hidden md:flex" style={{ alignItems: "center", gap: 2, flexShrink: 0 }}>
      <NavLink href="/" label="Home" active={pathname === "/"} />
      {isLoggedIn ? (
        mode === "hiring"
          ? <NavLink href="/jobs/new" label="Post a Job" active={pathname === "/jobs/new"} />
          : <NavLink href="/gigs/mine" label="My Gigs" active={pathname === "/gigs/mine"} />
      ) : (
        <NavLink href="/talent" label="Find Talent" active={pathname === "/talent"} />
      )}
      <NavLink href="/how" label="How it Works" active={pathname === "/how"} />
    </div>
  );
}
