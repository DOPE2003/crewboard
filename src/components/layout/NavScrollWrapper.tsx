"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function NavScrollWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  // On homepage: fully transparent at top, frosted glass on scroll
  // On all pages: add shadow/border on scroll
  const transparent = isHome && !scrolled;

  return (
    <nav
      data-transparent={transparent ? "true" : undefined}
      data-scrolled={!transparent && scrolled ? "true" : undefined}
    >
      {children}
    </nav>
  );
}
