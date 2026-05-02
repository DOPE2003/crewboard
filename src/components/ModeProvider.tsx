"use client";

import { useState, useEffect, type ReactNode } from "react";

export type Mode = "hiring" | "working";

// Module-level store — bypasses React context / tree hierarchy entirely
let _current: Mode = "working";
const _listeners = new Set<(m: Mode) => void>();

function _read(): Mode {
  if (typeof window !== "undefined") {
    const s = localStorage.getItem("cb_mode") as Mode | null;
    if (s === "hiring" || s === "working") _current = s;
  }
  return _current;
}

export function setMode(m: Mode) {
  _current = m;
  if (typeof window !== "undefined") localStorage.setItem("cb_mode", m);
  _listeners.forEach((l) => l(m));
}

export function useMode() {
  const [mode, setState] = useState<Mode>("working");

  useEffect(() => {
    setState(_read());
    _listeners.add(setState);
    return () => { _listeners.delete(setState); };
  }, []);

  return { mode, setMode };
}

// Kept so layout.tsx import doesn't break — just a passthrough now
export function ModeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
