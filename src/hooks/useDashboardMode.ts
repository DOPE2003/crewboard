"use client";

import { useEffect } from "react";
import { useMode } from "@/components/ModeProvider";

export function useDashboardMode(hasGigs: boolean) {
  const { mode, setMode } = useMode();

  useEffect(() => {
    const saved = localStorage.getItem("cb_mode");
    if (!saved) {
      setMode(hasGigs ? "working" : "hiring");
    }
  }, [hasGigs]);

  return [mode, setMode] as const;
}
