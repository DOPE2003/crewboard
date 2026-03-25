"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { getNavDropdownData } from "@/actions/nav";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  image: string | null;
  name: string | null;
  twitterHandle: string | null;
  role: string | null;
  availability: string | null;
  unreadCount: number;
  gigsCount: number;
}

type ExtraData = Awaited<ReturnType<typeof getNavDropdownData>>;

function initials(name: string | null, handle: string | null) {
  const src = name ?? handle ?? "";
  return src.slice(0, 2).toUpperCase() || "??";
}

function StarRating({ rating }: { rating: number | null }) {
  if (rating === null) return <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>No reviews yet</span>;
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: i <= full ? "#ffd700" : (i === full + 1 && half ? "#ffd700" : "rgba(255,255,255,0.3)"), fontSize: 12 }}>
          {i <= full ? "★" : i === full + 1 && half ? "½" : "☆"}
        </span>
      ))}
      <span style={{ fontSize: 12, color: "white", fontWeight: 700, marginLeft: 2 }}>{rating.toFixed(1)}</span>
    </span>
  );
}

function NavItem({
  href,
  icon,
  label,
  badge,
  badgeColor = "teal",
  onClick,
}: {
  href?: string;
  icon: React.ReactNode;
  label: string;
  badge?: string | number | null;
  badgeColor?: "red" | "teal";
  onClick?: () => void;
}) {
  const inner = (
    <>
      <span style={{ width: 20, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", flexShrink: 0 }}>
        {icon}
      </span>
      <span style={{ flex: 1, fontSize: 14, color: "var(--foreground)" }}>{label}</span>
      {badge != null && String(badge) !== "0" && (
        <span style={{
          background: badgeColor === "red" ? "#ef4444" : "#ccfbf1",
          color: badgeColor === "red" ? "white" : "#0f766e",
          borderRadius: 99, fontSize: 10, fontWeight: 700,
          padding: "1px 7px",
        }}>{badge}</span>
      )}
    </>
  );

  const style: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 12,
    padding: "11px 18px", cursor: "pointer",
    textDecoration: "none", background: "transparent", border: "none",
    width: "100%", textAlign: "left",
  };

  if (href) {
    return (
      <Link href={href} style={style}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#f0fdfb")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        onClick={onClick}
      >
        {inner}
      </Link>
    );
  }
  return (
    <button style={style}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f0fdfb")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      onClick={onClick}
    >
      {inner}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8", padding: "8px 18px 4px", fontWeight: 600 }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: "0.5px", background: "var(--border)", margin: "4px 0" }} />;
}

export default function NavProfileDropdown({
  isOpen, onClose, anchorRef,
  image, name, twitterHandle, role, availability, unreadCount, gigsCount,
}: Props) {
  const [extra, setExtra] = useState<ExtraData>(null);
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const [showPro, setShowPro] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Load extra data when first opened
  useEffect(() => {
    if (isOpen && extra === null) {
      getNavDropdownData().then(setExtra).catch(() => {});
    }
  }, [isOpen, extra]);

  // Position dropdown below avatar
  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 10,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isOpen, anchorRef]);

  // Sync dark mode state
  useEffect(() => {
    if (isOpen) setIsDark(document.body.classList.contains("dark"));
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (showPro) return; // Pro modal is open — don't close dropdown
      if (
        dropRef.current && !dropRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose, anchorRef]);

  // ESC closes Pro modal then dropdown
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showPro) setShowPro(false);
        else onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [showPro, onClose]);

  const toggleDark = useCallback(() => {
    const next = !isDark;
    if (next) { document.body.classList.add("dark"); localStorage.setItem("cb-theme", "dark"); }
    else { document.body.classList.remove("dark"); localStorage.setItem("cb-theme", "light"); }
    localStorage.setItem("cb-theme-v", "2");
    setIsDark(next);
  }, [isDark]);

  const copyWallet = useCallback(() => {
    if (extra?.walletAddress) {
      navigator.clipboard.writeText(extra.walletAddress).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    }
  }, [extra?.walletAddress]);

  const memberSince = extra?.createdAt
    ? new Date(extra.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "";

  const rankLabel = () => {
    const n = extra?.ordersCompleted ?? 0;
    if (n >= 50) return "Top 5%";
    if (n >= 20) return "Top 10%";
    if (n >= 6) return "Top 25%";
    if (n >= 1) return "Top 50%";
    return "New";
  };

  if (!isOpen || typeof document === "undefined") return null;

  const dropdown = (
    <div
      ref={dropRef}
      style={{
        position: "fixed",
        top: pos.top,
        right: pos.right,
        width: 300,
        borderRadius: 16,
        background: "var(--background)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.13)",
        overflow: "hidden",
        maxHeight: "85vh",
        overflowY: "auto",
        zIndex: 9999,
        opacity: 1,
        animation: "dropIn 0.18s ease",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <style>{`
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── SECTION 1: Teal header ── */}
      <div style={{
        background: "linear-gradient(135deg, #14B8A6 0%, #0F6E56 100%)",
        padding: "20px 20px 0",
      }}>
        {/* Avatar + name row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              border: "2.5px solid white",
              backgroundColor: image ? "white" : "#0d9488",
              backgroundImage: image ? `url(${image})` : "none",
              backgroundSize: "cover", backgroundPosition: "center",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden",
            }}>
              {!image && <span style={{ fontSize: 20, color: "white", fontWeight: 700 }}>{initials(name, twitterHandle)}</span>}
            </div>
            {extra?.walletAddress && (
              <div style={{
                position: "absolute", bottom: 0, right: 0,
                width: 16, height: 16, borderRadius: "50%",
                background: "#22c55e", border: "2px solid white",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 8, color: "white", fontWeight: 700,
              }}>✓</div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {name ?? twitterHandle ?? "User"}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", marginTop: 2 }}>
              {twitterHandle ? `@${twitterHandle}` : ""}{memberSince ? ` · Member since ${memberSince}` : ""}
            </div>
            {/* Badges */}
            <div style={{ display: "flex", gap: 5, marginTop: 7, flexWrap: "wrap" }}>
              {role && (
                <span style={{ background: "rgba(255,255,255,0.22)", color: "white", borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700 }}>
                  {role.toUpperCase()}
                </span>
              )}
              {extra?.isOG && (
                <span style={{ background: "rgba(255,255,255,0.22)", color: "white", borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700 }}>
                  OG
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Availability */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
            background: availability === "available" ? "#22c55e" : "rgba(255,255,255,0.35)",
          }} />
          <span style={{ fontSize: 12, color: "white", fontWeight: 600 }}>
            {availability === "available" ? "Available for work" : "Not available"}
          </span>
        </div>

        {/* Rating */}
        <div style={{ marginBottom: 12 }}>
          <StarRating rating={extra?.avgRating ?? null} />
          {extra?.reviewCount != null && extra.reviewCount > 0 && (
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginLeft: 6 }}>· {extra.reviewCount} Reviews</span>
          )}
        </div>

        {/* Wallet bar */}
        {extra?.walletAddress ? (
          <div style={{
            background: "rgba(0,0,0,0.18)", borderRadius: "10px 10px 0 0",
            padding: "9px 14px", display: "flex", alignItems: "center", gap: 8,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
            </svg>
            <span style={{ flex: 1, fontSize: 10, color: "rgba(255,255,255,0.75)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {extra.walletAddress.slice(0, 6)}...{extra.walletAddress.slice(-4)}
            </span>
            <button
              onClick={copyWallet}
              style={{ fontSize: 9, color: copied ? "#86efac" : "rgba(255,255,255,0.65)", background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 5, padding: "2px 7px", cursor: "pointer", flexShrink: 0 }}
            >
              {copied ? "✓ Copied" : "Copy"}
            </button>
            <span style={{ display: "flex", alignItems: "center", gap: 3, background: "rgba(255,255,255,0.12)", borderRadius: 99, padding: "2px 7px", fontSize: 9, color: "white", flexShrink: 0 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
              Solana
            </span>
          </div>
        ) : (
          <div style={{ background: "rgba(0,0,0,0.18)", borderRadius: "10px 10px 0 0", padding: "9px 14px" }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>No wallet connected</span>
          </div>
        )}
      </div>

      {/* ── SECTION 2: Stats strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "0.5px solid var(--border)" }}>
        {[
          { val: extra?.ordersCompleted ?? "—", label: "Orders" },
          { val: extra ? `$${extra.totalEarned.toLocaleString()}` : "—", label: "Earned", teal: true },
          { val: rankLabel(), label: "Rank" },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: "center", padding: "12px 4px", borderRight: i < 2 ? "0.5px solid var(--border)" : "none" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.teal ? "#14B8A6" : "var(--foreground)" }}>{s.val}</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── SECTION 3: Profile completion ── */}
      {extra && (
        <div style={{ background: "#fffbf0", padding: "9px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: "#92400e", fontWeight: 500, flexShrink: 0 }}>Profile</span>
            <div style={{ flex: 1, height: 5, background: "#fde68a", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${extra.profileCompletion}%`, background: "linear-gradient(90deg, #14B8A6, #0F6E56)", borderRadius: 99, transition: "width 0.4s" }} />
            </div>
            <span style={{ fontSize: 11, color: "#0f766e", fontWeight: 700, flexShrink: 0 }}>{extra.profileCompletion}%</span>
          </div>
        </div>
      )}

      {/* ── SECTION 4: Pending earnings ── */}
      {extra && extra.pendingEarnings > 0 && (
        <div style={{ background: "#f8fff8", padding: "10px 18px", display: "flex", alignItems: "center", gap: 8, borderBottom: "0.5px solid var(--border)" }}>
          <span style={{ fontSize: 14 }}>💰</span>
          <span style={{ flex: 1, fontSize: 12, color: "var(--text-muted)" }}>Pending Earnings</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>${extra.pendingEarnings.toLocaleString()}</span>
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{extra.activeOrderCount} active</span>
        </div>
      )}

      {/* ── SECTION 5: Navigation ── */}
      <div>
        <NavItem href="/dashboard" onClick={onClose} label="Dashboard" icon={
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        } />
        <NavItem href={twitterHandle ? `/u/${twitterHandle}` : "/dashboard"} onClick={onClose} label="My Profile" icon={
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        } />
        <NavItem href="/services/mine" onClick={onClose} label="My Services" badge={gigsCount > 0 ? `${gigsCount} active` : null} icon={
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        } />
        <NavItem href="/orders" onClick={onClose} label="Orders" icon={
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
        } />
        <NavItem href="/messages" onClick={onClose} label="Messages" badge={unreadCount > 0 ? unreadCount : null} badgeColor="red" icon={
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        } />
        <NavItem href="/saved-talents" onClick={onClose} label="Saved Profiles" icon={
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        } />
      </div>

      <Divider />

      {/* ── SECTION 6: Account ── */}
      <div>
        <SectionLabel>Account</SectionLabel>
        <NavItem href="/billing" onClick={onClose} label="Billing & Wallet" icon={
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
        } />
        <NavItem href="/orders" onClick={onClose} label="Transactions" icon={
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        } />
        <NavItem href="/referral" onClick={onClose} label="Referral Program" badge="Earn 15%" icon={
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        } />
      </div>

      <Divider />

      {/* ── SECTION 7: Preferences ── */}
      <div>
        <SectionLabel>Preferences</SectionLabel>

        {/* Crewboard Pro button */}
        <div style={{ padding: "8px 18px" }}>
          <button
            onClick={() => setShowPro(true)}
            style={{
              width: "100%", borderRadius: 12, padding: "12px 16px",
              background: "linear-gradient(135deg, #14B8A6 0%, #0F6E56 100%)",
              color: "white", cursor: "pointer", display: "flex",
              alignItems: "center", gap: 10, border: "none", fontFamily: "inherit",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 16L3 5l5.5 5L12 2l3.5 8L21 5l-2 11H5zm2.7-2h8.6l1.1-5.7-3 2.7L12 6.4l-2.4 4.6-3-2.7L7.7 14z"/>
            </svg>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Crewboard Pro</div>
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 1 }}>Unlock premium features</div>
            </div>
            <span style={{ background: "rgba(255,255,255,0.2)", color: "white", borderRadius: 99, padding: "2px 8px", fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
              Soon
            </span>
          </button>
        </div>

        {/* Dark mode toggle */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", cursor: "pointer" }}
          onClick={toggleDark}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f0fdfb")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <span style={{ width: 20, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isDark
                ? <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>
                : <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              }
            </svg>
          </span>
          <span style={{ flex: 1, fontSize: 14, color: "var(--foreground)" }}>Dark Mode</span>
          {/* Toggle pill */}
          <div style={{
            width: 38, height: 20, borderRadius: 99, background: isDark ? "#14B8A6" : "#e5e7eb",
            position: "relative", transition: "background 0.2s", flexShrink: 0,
          }}>
            <div style={{
              position: "absolute", top: 2, width: 16, height: 16, borderRadius: "50%",
              background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
              left: isDark ? 20 : 2, transition: "left 0.2s",
            }} />
          </div>
        </div>

        <NavItem href="/help" onClick={onClose} label="Help & Support" icon={
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        } />
      </div>

      <Divider />

      {/* ── SECTION 8: Sign out ── */}
      <div style={{ padding: "4px 0 8px" }}>
        <button
          onClick={() => { onClose(); signOut({ callbackUrl: "/" }); }}
          style={{
            display: "flex", alignItems: "center", gap: 12, width: "100%",
            padding: "11px 18px", background: "transparent", border: "none",
            cursor: "pointer", textAlign: "left",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(220,38,38,0.06)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <span style={{ width: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </span>
          <span style={{ fontSize: 14, color: "#dc2626", fontWeight: 500 }}>Sign Out</span>
        </button>
      </div>
    </div>
  );

  const PRO_FEATURES = [
    { title: "Priority in search results", sub: "Get seen first by hirers" },
    { title: "Verified Pro badge on profile", sub: "Stand out with a blue checkmark" },
    { title: "Advanced analytics dashboard", sub: "Profile views, click rates, hire conversion" },
    { title: "Unlimited services", sub: "Free plan: 3 services max" },
    { title: "Custom profile URL", sub: "crewboard.fun/pro/yourname" },
    { title: "Early access to Showcase Feed", sub: "Post before everyone else" },
    { title: "Reduced platform fee", sub: "5% instead of 10%" },
    { title: "AI-powered bio writer", sub: "Let AI craft your perfect bio" },
    { title: "Featured in weekly newsletter", sub: "Sent to 10,000+ Web3 hirers" },
    { title: "Direct Solana payments", sub: "Zero fees on crypto payments" },
  ];

  const proModal = showPro ? (
    <div
      className="mobile-bottom-sheet-overlay"
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
      onClick={() => setShowPro(false)}
    >
      <div
        className="mobile-bottom-sheet-content"
        style={{
          background: "var(--background)",
          borderRadius: 20, padding: 32,
          width: "100%", maxWidth: 480,
          maxHeight: "90vh", overflowY: "auto",
          position: "relative",
          boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
          animation: "dropIn 0.2s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={() => setShowPro(false)}
          style={{
            position: "absolute", top: 16, right: 16,
            background: "var(--bg-secondary)", border: "none",
            borderRadius: "50%", width: 30, height: 30,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--text-muted)", fontSize: 16,
          }}
        >✕</button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✦</div>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: "var(--foreground)", margin: "0 0 8px" }}>
            Crewboard Pro
          </h2>
          <span style={{ background: "#ccfbf1", color: "#0f766e", borderRadius: 99, padding: "3px 12px", fontSize: 12, fontWeight: 600 }}>
            Coming soon
          </span>
          <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 12, marginBottom: 0, lineHeight: 1.6 }}>
            Everything you need to dominate Web3 freelancing.
          </p>
        </div>

        {/* Features */}
        <div style={{ marginBottom: 24 }}>
          {PRO_FEATURES.map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: i < PRO_FEATURES.length - 1 ? "0.5px solid var(--border)" : "none" }}>
              <span style={{ color: "#14B8A6", fontSize: 16, flexShrink: 0, marginTop: 1 }}>✓</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>{f.title}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{f.sub}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  ) : null;

  return (
    <>
      {createPortal(dropdown, document.body)}
      {showPro && createPortal(proModal, document.body)}
    </>
  );
}
