"use client";

import { useState, useEffect } from "react";
import type { Mode } from "@/lib/mode";

export function useDashboardMode(hasGigs: boolean) {
  const [mode, setModeState] = useState<Mode>("working");

  useEffect(() => {
    const saved = localStorage.getItem("cb_mode") as Mode | null;
    setModeState(saved === "hiring" || saved === "working" ? saved : hasGigs ? "working" : "hiring");
  }, [hasGigs]);

  function setMode(m: Mode) {
    setModeState(m);
    localStorage.setItem("cb_mode", m);
  }

  return [mode, setMode] as const;
}
