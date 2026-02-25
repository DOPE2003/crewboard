"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ThemeRouteClass() {
  const pathname = usePathname();

  useEffect(() => {
    const body = document.body;
    const isWhitepaper = pathname === "/whitepaper";

    if (isWhitepaper) body.classList.add("whitepaper-invert");
    else body.classList.remove("whitepaper-invert");

    return () => {
      body.classList.remove("whitepaper-invert");
    };
  }, [pathname]);

  return null;
}