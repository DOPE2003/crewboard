"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { label: "Find Talent", href: "/talent" },
  { label: "Browse Projects", href: "/projects" },
  { label: "Whitepaper", href: "/whitepaper" },
];

const CATEGORIES = [
  { label: "Smart Contracts", href: "/talent?category=smart-contracts" },
  { label: "DeFi & Protocol",  href: "/talent?category=defi" },
  { label: "NFT & Gaming",     href: "/talent?category=nft" },
  { label: "Frontend",         href: "/talent?category=frontend" },
  { label: "Design & UI",      href: "/talent?category=design" },
  { label: "Community",        href: "/talent?category=community" },
  { label: "Marketing",        href: "/talent?category=marketing" },
  { label: "Research",         href: "/talent?category=research" },
];

export default function NavMobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      {/* Hamburger button */}
      <button
        className="nav-hamburger"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        )}
      </button>

      {/* Drawer */}
      {open && (
        <div className="nav-mobile-drawer">
          {/* Main nav links */}
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="nav-mobile-link">
              {l.label}
            </Link>
          ))}

          <div className="nav-mobile-divider" />

          {/* Category links */}
          <div className="nav-mobile-section-label">Categories</div>
          {CATEGORIES.map((c) => (
            <Link key={c.href} href={c.href} className="nav-mobile-link nav-mobile-cat">
              {c.label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
