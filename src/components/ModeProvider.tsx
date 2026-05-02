"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Mode = "hiring" | "working";

interface ModeCtx {
  mode: Mode;
  setMode: (m: Mode) => void;
}

const ModeContext = createContext<ModeCtx>({ mode: "working", setMode: () => {} });

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>("working");

  useEffect(() => {
    const saved = localStorage.getItem("cb_mode") as Mode | null;
    if (saved === "hiring" || saved === "working") setModeState(saved);
  }, []);

  function setMode(m: Mode) {
    setModeState(m);
    localStorage.setItem("cb_mode", m);
  }

  return <ModeContext.Provider value={{ mode, setMode }}>{children}</ModeContext.Provider>;
}

export function useMode() {
  return useContext(ModeContext);
}
