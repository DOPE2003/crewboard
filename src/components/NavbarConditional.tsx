"use client";
import { usePathname } from "next/navigation";

export default function NavbarConditional({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <>{children}</>;
}
