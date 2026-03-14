"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/lib/i18n";

const NAV_LINKS: { key: TranslationKey; href: string }[] = [
  { key: "cat.kol",       href: "/talent?role=KOL+Manager" },
  { key: "cat.exchange",  href: "/talent?role=Exchange+Listings+Manager" },
  { key: "cat.web3design",href: "/talent?role=Web3+Web+Designer" },
  { key: "cat.social",    href: "/talent?role=Social+Marketing" },
  { key: "cat.artist",    href: "/talent?role=Artist" },
  { key: "cat.video",     href: "/talent?role=Video+%26+Animation" },
  { key: "cat.coding",    href: "/talent?role=Coding+%26+Tech" },
  { key: "cat.ai",        href: "/talent?role=AI+Engineer" },
  { key: "cat.content",   href: "/talent?role=Content+Creator" },
  { key: "cat.graphic",   href: "/talent?role=Graphic+%26+Design" },
];

export default function NavMobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useLanguage();

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
              {t(l.key)}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
