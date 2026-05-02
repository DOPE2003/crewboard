"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const HOMEPAGE_LINKS = [
  { label: "Browse Talent", id: "browse" },
  { label: "How It Works",  id: "how-it-works" },
];

const INNER_LINKS = [
  { label: "Browse Talent", href: "/talent" },
  { label: "How It Works",  href: "/#how-it-works" },
];

export default function NavCenterLinks() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  if (isHome) {
    return (
      <div className="nav-center-links">
        {HOMEPAGE_LINKS.map(({ label, id }) => (
          <button
            key={id}
            onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="nav-center-btn"
          >
            {label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="nav-center-links">
      {INNER_LINKS.map(({ label, href }) => (
        <Link key={label} href={href} className="nav-center-btn nav-center-link">
          {label}
        </Link>
      ))}
    </div>
  );
}
