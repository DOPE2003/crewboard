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
        fontWeight: active ? 700 : 500,
        color: active ? "var(--foreground)" : "var(--text-muted)",
        textDecoration: "none", whiteSpace: "nowrap", borderRadius: 6,
      }}
    >
      {label}
    </Link>
  );
}

export default function NavInlineLinks() {
  const { mode } = useMode();
  const pathname = usePathname();

  return (
    <div className="hidden md:flex" style={{ alignItems: "center", gap: 2, flexShrink: 0 }}>
      <NavLink href="/" label="Home" active={pathname === "/"} />
      {mode === "hiring"
        ? <NavLink href="/talent" label="Find Talent" active={pathname === "/talent"} />
        : <NavLink href="/jobs"   label="Find Work"   active={pathname.startsWith("/jobs")} />
      }
      <NavLink href="/how" label="How it Works" active={pathname === "/how"} />
    </div>
  );
}
