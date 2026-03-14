"use client";

import { useEffect } from "react";

// Reads theme + lang from localStorage on mount and applies them.
// Must be rendered inside <body> — no SSR flash because it runs after hydration.
export default function ThemeProvider() {
  useEffect(() => {
    const theme = localStorage.getItem("cb-theme") ?? "light";
    const lang = localStorage.getItem("cb-lang") ?? "en";

    if (theme === "dark") document.body.classList.add("dark");
    else document.body.classList.remove("dark");

    document.documentElement.lang = lang;
  }, []);

  return null;
}
