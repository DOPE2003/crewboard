"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useMode } from "@/components/ModeProvider";

export default function NavCenterLinks() {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";
  const { mode } = useMode();
  const isHiring = mode === "hiring";

  if (isHome) {
    return (
      <div className="nav-center-links">
        {isHiring ? (
          <button
            onClick={() => document.getElementById("browse")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="nav-center-btn"
          >
            Find Talent
          </button>
        ) : (
          <button
            onClick={() => router.push("/jobs")}
            className="nav-center-btn"
          >
            Find Work
          </button>
        )}
        <button
          onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="nav-center-btn"
        >
          How It Works
        </button>
      </div>
    );
  }

  return (
    <div className="nav-center-links">
      <Link href={isHiring ? "/talent" : "/jobs"} className="nav-center-btn nav-center-link">
        {isHiring ? "Find Talent" : "Find Work"}
      </Link>
      <Link href="/#how-it-works" className="nav-center-btn nav-center-link">
        How It Works
      </Link>
    </div>
  );
}
