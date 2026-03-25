"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import NavProfileDropdown from "./NavProfileDropdown";

interface Props {
  image: string | null;
  name: string | null;
  twitterHandle?: string | null;
  role?: string | null;
  availability?: string | null;
  unreadCount?: number;
  gigsCount?: number;
}

function initials(name: string | null, handle?: string | null) {
  const src = name ?? handle ?? "";
  return src.slice(0, 2).toUpperCase() || "??";
}

export default function NavProfileMenu({
  image, name, twitterHandle, role, availability, unreadCount = 0, gigsCount = 0,
}: Props) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // Close on navigation
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      {/* Avatar trigger */}
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        aria-label="Profile menu"
        style={{
          background: "none", border: "none", padding: 0,
          cursor: "pointer", display: "flex", alignItems: "center",
        }}
      >
        {image ? (
          <img
            src={image}
            alt="Profile"
            style={{
              borderRadius: "50%", objectFit: "cover", width: 36, height: 36,
              border: open ? "2px solid #14b8a6" : "2px solid var(--card-border)",
              transition: "border-color 0.2s",
            }}
          />
        ) : (
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(var(--foreground-rgb), 0.08)",
            border: open ? "2px solid #14b8a6" : "2px solid var(--card-border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "border-color 0.2s",
            fontSize: 13, fontWeight: 600, color: "#14b8a6",
          }}>
            {initials(name, twitterHandle)}
          </div>
        )}
      </button>

      <NavProfileDropdown
        isOpen={open}
        onClose={() => setOpen(false)}
        anchorRef={btnRef}
        image={image}
        name={name}
        twitterHandle={twitterHandle ?? null}
        role={role ?? null}
        availability={availability ?? null}
        unreadCount={unreadCount}
        gigsCount={gigsCount}
      />
    </div>
  );
}
