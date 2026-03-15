"use client";

import { useEffect } from "react";

// Reads theme + lang from localStorage on mount and applies them.
// Must be rendered inside <body> — no SSR flash because it runs after hydration.
export default function ThemeProvider() {
  useEffect(() => {
    // v2: default changed to light — reset dark preference unless user explicitly chose it after v2
    const themeVersion = localStorage.getItem("cb-theme-v");
    if (!themeVersion) {
      // First visit on v2 — clear any old dark default, force light
      localStorage.setItem("cb-theme", "light");
      localStorage.setItem("cb-theme-v", "2");
    }
    const theme = localStorage.getItem("cb-theme") ?? "light";
    const lang = localStorage.getItem("cb-lang") ?? "en";

    if (theme === "dark") document.body.classList.add("dark");
    else document.body.classList.remove("dark");

    document.documentElement.lang = lang;
  }, []);

  return null;
}
