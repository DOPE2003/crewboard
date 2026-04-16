"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { getNavDropdownData } from "@/actions/nav";
import { unlinkWallet } from "@/actions/wallet";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

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

/* ── Section label ── */
function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 7,
      padding: "14px 18px 6px",
      fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#14B8A6",
    }}>
      <span style={{ color: "#14B8A6" }}>{icon}</span>
      {children}
    </div>
  );
}

/* ── Row item inside a card block ── */
function Row({
  icon, label, href, onClick, danger, badge, toggle, toggleOn, rightEl,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
  badge?: string | number | null;
  toggle?: boolean;
  toggleOn?: boolean;
  rightEl?: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);

  const inner = (
    <div style={{
      display: "flex", alignItems: "center", gap: 13,
      padding: "14px 18px",
      background: hovered && !danger ? "rgba(20,184,166,0.04)" : hovered && danger ? "rgba(239,68,68,0.04)" : "transparent",
      cursor: "pointer", transition: "background 0.1s",
    }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ width: 24, height: 24, borderRadius: 8, background: danger ? "rgba(239,68,68,0.1)" : "rgba(20,184,166,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: danger ? "#ef4444" : "#14B8A6" }}>
        {icon}
      </span>
      <span style={{ flex: 1, fontSize: 14, color: danger ? "#ef4444" : "var(--foreground)", fontWeight: 500 }}>{label}</span>
      {badge != null && String(badge) !== "0" && (
        <span style={{ background: "#ef4444", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "1px 7px" }}>{badge}</span>
      )}
      {toggle ? (
        <div style={{ width: 44, height: 26, borderRadius: 99, background: toggleOn ? "#14B8A6" : "#d1d5db", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
          <div style={{ position: "absolute", top: 3, width: 20, height: 20, borderRadius: "50%", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.25)", left: toggleOn ? 21 : 3, transition: "left 0.2s" }} />
        </div>
      ) : rightEl ? rightEl : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )}
    </div>
  );

  if (href) return <Link href={href} onClick={onClick} style={{ textDecoration: "none", display: "block" }}>{inner}</Link>;
  return <button onClick={onClick} style={{ width: "100%", background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer" }}>{inner}</button>;
}

/* ── Card block wrapper ── */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ margin: "0 12px 8px", background: "var(--card-bg, #fff)", border: "1px solid var(--card-border, #e5e7eb)", borderRadius: 14, overflow: "hidden" }}>
      {children}
    </div>
  );
}

function RowDivider() {
  return <div style={{ height: 1, background: "var(--card-border, #f3f4f6)", margin: "0 18px" }} />;
}

/* ── Icons ── */
const I = {
  wallet:       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  history:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  dispute:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  disconnect:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  saved:        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
  applications: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  sent:         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  inbox:        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
  moon:         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  globe:        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  bell:         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  ai:           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  privacy:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  help:         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  signout:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  admin:        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>,
  appSettings:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M4.93 4.93l1.41 1.41M1 12h2m18 0h2M12 1v2m0 18v2"/></svg>,
  account:      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
};

export default function NavProfileDropdown({
  isOpen, onClose, anchorRef,
  image, name, twitterHandle, role, availability, unreadCount, gigsCount,
}: Props) {
  const [extra, setExtra]         = useState<ExtraData>(null);
  const [isDark, setIsDark]       = useState(false);
  const [pos, setPos]             = useState({ top: 0, right: 0 });
  const [showPro, setShowPro]     = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [isMobile, setIsMobile]   = useState(false);
  const [mounted, setMounted]     = useState(false);
  const [walletMsg, setWalletMsg] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const { publicKey, connected, disconnect, wallets } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();

  // Detect mobile
  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (isOpen && extra === null) getNavDropdownData().then(setExtra).catch(() => {});
  }, [isOpen, extra]);

  useEffect(() => {
    if (isOpen && anchorRef.current && !isMobile) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 10, right: window.innerWidth - rect.right });
    }
  }, [isOpen, anchorRef, isMobile]);

  useEffect(() => {
    if (isOpen) setIsDark(document.body.classList.contains("dark"));
  }, [isOpen]);

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobile, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (showPro) return;
      if (isMobile) return; // mobile closes via backdrop tap
      if (dropRef.current && !dropRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose, anchorRef, showPro, isMobile]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (showPro) setShowPro(false); else onClose(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [showPro, onClose]);

  const toggleDark = useCallback(() => {
    const next = !isDark;
    if (next) { document.body.classList.add("dark"); localStorage.setItem("cb-theme", "dark"); }
    else      { document.body.classList.remove("dark"); localStorage.setItem("cb-theme", "light"); }
    localStorage.setItem("cb-theme-v", "2");
    setIsDark(next);
  }, [isDark]);

  async function handleDisconnectWallet() {
    if (!confirm("Disconnect your wallet?")) return;
    setDisconnecting(true);
    try {
      await disconnect();
      try { localStorage.removeItem("walletName"); } catch { /* ignore */ }
      await unlinkWallet();
      setExtra((prev) => prev ? { ...prev, walletAddress: null } : prev);
      onClose();
      window.location.href = "/dashboard";
    } catch { /* ignore */ }
    finally { setDisconnecting(false); }
  }

  const memberSince = extra?.createdAt
    ? new Date(extra.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "";

  const avgRating = extra?.avgRating;
  const ratingDisplay = avgRating != null ? avgRating.toFixed(1) : "—";

  if (!isOpen || !mounted || typeof document === "undefined") return null;

  /* ── Shared inner content ── */
  const content = (
    <>
      {/* ── HEADER: teal gradient ── */}
      <div style={{ background: "linear-gradient(135deg, #14B8A6 0%, #0F6E56 100%)", padding: "20px 18px 14px", borderRadius: isMobile ? "20px 20px 0 0" : "20px 20px 0 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              width: isMobile ? 58 : 52, height: isMobile ? 58 : 52, borderRadius: "50%", border: "2.5px solid white",
              backgroundColor: image ? "white" : "#0d9488",
              backgroundImage: image ? `url(${image})` : "none",
              backgroundSize: "cover", backgroundPosition: "center",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {!image && <span style={{ fontSize: isMobile ? 22 : 20, color: "white", fontWeight: 700 }}>{initials(name, twitterHandle)}</span>}
            </div>
            {extra?.walletAddress && (
              <div style={{ position: "absolute", bottom: 0, right: 0, width: 16, height: 16, borderRadius: "50%", background: "#22c55e", border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "white", fontWeight: 700 }}>✓</div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: isMobile ? 18 : 16, fontWeight: 700, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {name ?? twitterHandle ?? "User"}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 1 }}>
              {twitterHandle ? `@${twitterHandle}` : ""}{memberSince ? ` · ${memberSince}` : ""}
            </div>
            <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
              {extra?.isOG && <span style={{ background: "rgba(255,255,255,0.22)", color: "white", borderRadius: 20, padding: "2px 9px", fontSize: 10, fontWeight: 700 }}>★ OG</span>}
              {extra?.twitterHandle === "saad190914"
                ? <span style={{ background: "linear-gradient(135deg,rgba(20,184,166,0.6),rgba(15,118,110,0.6))", color: "white", borderRadius: 20, padding: "2px 9px", fontSize: 10, fontWeight: 700 }}>OWNER</span>
                : extra?.role === "ADMIN"
                  ? <span style={{ background: "rgba(239,68,68,0.35)", color: "white", borderRadius: 20, padding: "2px 9px", fontSize: 10, fontWeight: 700 }}>ADMIN</span>
                  : extra?.role === "SUPPORT"
                    ? <span style={{ background: "rgba(99,102,241,0.45)", color: "white", borderRadius: 20, padding: "2px 9px", fontSize: 10, fontWeight: 700 }}>SUPPORT</span>
                    : null
              }
              {twitterHandle && (
                <Link href={`/u/${twitterHandle}`} onClick={onClose} style={{ background: "rgba(255,255,255,0.18)", color: "white", borderRadius: 20, padding: "2px 9px", fontSize: 10, fontWeight: 700, textDecoration: "none", marginLeft: "auto" }}>
                  View Profile →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Profile completion bar */}
        <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "8px 12px", marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>Profile Completion</span>
            <span style={{ fontSize: 11, color: "white", fontWeight: 700 }}>{extra?.profileCompletion ?? 0}%</span>
          </div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.2)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${extra?.profileCompletion ?? 0}%`, background: "white", borderRadius: 99, transition: "width 0.4s" }} />
          </div>
          {(extra?.profileCompletion ?? 0) < 100 && (
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginTop: 5 }}>
              Complete your profile to get hired faster
            </div>
          )}
        </div>

        {/* Stats: Jobs Done | Rating | Chain */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", background: "rgba(0,0,0,0.15)", borderRadius: 10 }}>
          {[
            { val: extra?.ordersCompleted ?? 0, label: "Jobs Done" },
            { val: ratingDisplay,                label: "Rating"   },
            { val: "SOL",                        label: "Chain"    },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center", padding: "12px 4px", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
              <div style={{ fontSize: isMobile ? 18 : 15, fontWeight: 800, color: "white" }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ padding: "10px 0 12px" }}>

        {/* Staff dashboard shortcut */}
        {(extra?.twitterHandle === "saad190914" || extra?.role === "ADMIN" || extra?.role === "SUPPORT") && (() => {
          const isOwner   = extra?.twitterHandle === "saad190914";
          const isSupport = !isOwner && extra?.role === "SUPPORT";
          const label = isOwner ? "Owner Dashboard" : isSupport ? "Support Dashboard" : "Admin Dashboard";
          const color = isOwner ? "#0f766e" : isSupport ? "#6366f1" : "#ef4444";
          const bg    = isOwner ? "linear-gradient(135deg,rgba(20,184,166,0.12),rgba(20,184,166,0.06))" : isSupport ? "linear-gradient(135deg,rgba(99,102,241,0.1),rgba(99,102,241,0.05))" : "linear-gradient(135deg,rgba(239,68,68,0.1),rgba(239,68,68,0.05))";
          const badge = isOwner ? "OWNER" : isSupport ? "SUPPORT" : "STAFF";
          return (
            <div style={{ margin: "0 12px 8px" }}>
              <Link href="/admin" onClick={onClose} style={{
                display: "flex", alignItems: "center", gap: 10, textDecoration: "none",
                background: bg, border: `1px solid ${color}40`, borderRadius: 12, padding: "10px 14px",
              }}>
                <span style={{ color }}>{I.admin}</span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color }}>{label}</span>
                <span style={{ fontSize: 9, fontWeight: 700, background: color, color: "white", padding: "2px 7px", borderRadius: 99 }}>{badge}</span>
              </Link>
            </div>
          );
        })()}

        {/* WALLET & PAYMENTS */}
        <SectionLabel icon={I.wallet}>Wallet & Payments</SectionLabel>
        <Card>
          <Row icon={I.wallet} label="Wallet Overview" onClick={() => {
            // DB is source of truth — no Phantom check needed to view the page
            if (!extra?.walletAddress) { setWalletMsg(true); setTimeout(() => setWalletMsg(false), 3000); }
            else { onClose(); window.location.href = "/billing"; }
          }} />
          {walletMsg && (
            <div style={{ margin: "0 18px 10px", padding: "8px 12px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 11, fontWeight: 700, color: "#ef4444", letterSpacing: "0.05em", textAlign: "center" }}>
              CONNECT A PHANTOM WALLET FIRST
            </div>
          )}
          <RowDivider />
          <Row icon={I.history}    label="Payment History"  href="/payments" onClick={onClose} />
          <RowDivider />
          <Row icon={I.dispute}    label="Disputes"         href="/orders"   onClick={onClose} />
          <RowDivider />
          {extra?.walletAddress ? (
            <Row icon={I.disconnect} label={disconnecting ? "Disconnecting…" : "Disconnect Wallet"}
              onClick={handleDisconnectWallet} danger />
          ) : (
            <Row icon={I.wallet} label="Connect Wallet" onClick={() => {
              onClose();
              // Open the wallet adapter modal — works across all browsers
              setWalletModalVisible(true);
            }} />
          )}
        </Card>

        {/* JOBS & OFFERS */}
        <SectionLabel icon={I.saved}>Jobs & Offers</SectionLabel>
        <Card>
          <Row icon={I.saved}        label="Saved Jobs"       href="/saved-talents" onClick={onClose} />
          <RowDivider />
          <Row icon={I.applications} label="My Applications"  href="/gigs/mine"     onClick={onClose} badge={gigsCount > 0 ? gigsCount : null} />
          <RowDivider />
          <Row icon={I.sent}         label="Offers Sent"      href="/orders?tab=sent"      onClick={onClose} />
          <RowDivider />
          <Row icon={I.inbox}        label="Offers Received"  href="/orders?tab=received"  onClick={onClose} badge={unreadCount > 0 ? unreadCount : null} />
        </Card>

        {/* APP */}
        <SectionLabel icon={I.appSettings}>App</SectionLabel>
        <Card>
          <div onClick={toggleDark} style={{ cursor: "pointer" }}>
            <Row icon={I.moon} label="Dark Mode" toggle toggleOn={isDark} />
          </div>
          <RowDivider />
          <Row icon={I.globe} label="Language" rightEl={<span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>EN</span>} onClick={() => {}} />
          <RowDivider />
          <Row icon={I.bell}  label="Notifications" href="/notifications" onClick={onClose} badge={unreadCount > 0 ? unreadCount : null} />
          <RowDivider />
          <Row icon={I.ai}    label="Crew Assistant" onClick={() => setShowPro(true)} rightEl={<span style={{ fontSize: 9, background: "#ccfbf1", color: "#0f766e", fontWeight: 700, padding: "2px 7px", borderRadius: 99 }}>SOON</span>} />
        </Card>

        {/* ACCOUNT */}
        <SectionLabel icon={I.account}>Account</SectionLabel>
        <Card>
          <Row icon={I.privacy} label="Privacy"       href="/privacy"                      onClick={onClose} />
          <RowDivider />
          <Row icon={I.help}    label="Help & Support" href="mailto:support@crewboard.fun"  onClick={onClose} />
          <RowDivider />
          <Row icon={I.signout} label="Sign Out" onClick={async () => {
            onClose();
            // Disconnect wallet so it doesn't auto-link to the next user
            try { await disconnect(); } catch { /* ignore */ }
            try { localStorage.removeItem("walletName"); } catch { /* ignore */ }
            signOut({ callbackUrl: "/login" });
          }} danger />
        </Card>

      </div>
    </>
  );

  /* ── Pro modal ── */
  const PRO_FEATURES = [
    { title: "Priority in search results",        sub: "Get seen first by hirers" },
    { title: "Verified Pro badge on profile",     sub: "Stand out with a blue checkmark" },
    { title: "Advanced analytics dashboard",      sub: "Profile views, click rates, hire conversion" },
    { title: "Unlimited services",                sub: "Free plan: 3 services max" },
    { title: "Reduced platform fee",              sub: "5% instead of 10%" },
    { title: "AI-powered bio writer",             sub: "Let AI craft your perfect bio" },
    { title: "Featured in weekly newsletter",     sub: "Sent to 10,000+ Web3 hirers" },
  ];

  const proModal = showPro ? (
    <div style={{ position: "fixed", inset: 0, zIndex: 10001, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setShowPro(false)}>
      <div style={{ background: "var(--background)", borderRadius: 20, padding: 32, width: "100%", maxWidth: 440, maxHeight: "90vh", overflowY: "auto", position: "relative", boxShadow: "0 24px 80px rgba(0,0,0,0.25)", animation: "dropIn 0.2s ease" }} onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setShowPro(false)} style={{ position: "absolute", top: 16, right: 16, background: "var(--card-bg)", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 16 }}>✕</button>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✦</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--foreground)", margin: "0 0 8px" }}>Crew Assistant</h2>
          <span style={{ background: "#ccfbf1", color: "#0f766e", borderRadius: 99, padding: "3px 12px", fontSize: 12, fontWeight: 600 }}>Coming soon</span>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 12, lineHeight: 1.6 }}>Your AI-powered assistant for writing bios, pitching to clients, and navigating Crewboard.</p>
        </div>
        {PRO_FEATURES.map((f, i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "9px 0", borderBottom: i < PRO_FEATURES.length - 1 ? "1px solid var(--card-border)" : "none" }}>
            <span style={{ color: "#14B8A6", fontSize: 15, flexShrink: 0 }}>✓</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{f.title}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{f.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : null;

  /* ── Mobile bottom sheet ── */
  if (isMobile) {
    const mobileSheet = (
      <>
        <style>{`
          @keyframes dropIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
          @keyframes slideUp { from { transform:translateY(100%); } to { transform:translateY(0); } }
        `}</style>

        {/* Backdrop */}
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 9998,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            animation: "fadeIn 0.2s ease",
          }}
        />

        {/* Sheet */}
        <div
          ref={dropRef}
          style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            zIndex: 9999,
            background: "var(--background, #f7f8fa)",
            borderRadius: "20px 20px 0 0",
            maxHeight: "92vh",
            overflowY: "auto",
            scrollbarWidth: "none",
            animation: "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle + close row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 16px 0", position: "relative" }}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: "var(--card-border, #d1d5db)" }} />
            <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: 18, fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", color: "var(--foreground, #111)", whiteSpace: "nowrap" }}>
              My Account
            </span>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                position: "absolute", right: 16, top: 6,
                width: 32, height: 32, borderRadius: "50%",
                background: "var(--card-bg, #f3f4f6)",
                border: "1px solid var(--card-border, #e5e7eb)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "var(--text-muted, #6b7280)",
                fontSize: 16, lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
          <div style={{ height: 28 }} />
          {content}
          {/* Bottom safe area spacing */}
          <div style={{ height: "env(safe-area-inset-bottom, 16px)", minHeight: 16 }} />
        </div>
      </>
    );

    return (
      <>
        {createPortal(mobileSheet, document.body)}
        {showPro && createPortal(proModal, document.body)}
      </>
    );
  }

  /* ── Desktop dropdown ── */
  const desktop = (
    <div
      ref={dropRef}
      style={{
        position: "fixed", top: pos.top, right: pos.right,
        width: 320, borderRadius: 20,
        background: "var(--background, #f7f8fa)",
        boxShadow: "0 8px 48px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.06)",
        maxHeight: "88vh", overflowY: "auto", zIndex: 9999,
        animation: "dropIn 0.18s ease",
        scrollbarWidth: "none",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <style>{`
        @keyframes dropIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
      {content}
    </div>
  );

  return (
    <>
      {createPortal(desktop, document.body)}
      {showPro && createPortal(proModal, document.body)}
    </>
  );
}
