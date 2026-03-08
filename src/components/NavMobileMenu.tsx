"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { label: "KOL Manager",       href: "/talent?role=KOL+Manager" },
  { label: "Exchange Listings", href: "/talent?role=Exchange+Listings+Manager" },
  { label: "Web3 Designer",     href: "/talent?role=Web3+Web+Designer" },
  { label: "Social Marketing",  href: "/talent?role=Social+Marketing" },
  { label: "Artist",            href: "/talent?role=Artist" },
  { label: "Video & Animation", href: "/talent?role=Video+%26+Animation" },
  { label: "Coding & Tech",     href: "/talent?role=Coding+%26+Tech" },
  { label: "AI Engineer",       href: "/talent?role=AI+Engineer" },
  { label: "Content Creator",   href: "/talent?role=Content+Creator" },
  { label: "Graphic & Design",  href: "/talent?role=Graphic+%26+Design" },
  { label: "Whitepaper",        href: "/whitepaper" },
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
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="nav-mobile-link">
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
