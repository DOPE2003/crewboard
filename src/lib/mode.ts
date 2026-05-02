export type Mode = "hiring" | "working";

export function setAppMode(m: Mode) {
  if (typeof window !== "undefined") localStorage.setItem("cb_mode", m);
}
