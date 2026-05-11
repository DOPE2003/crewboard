import React from "react";
import Link from "next/link";

const ShieldIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const LockIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const ChatIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const SolanaIcon = () => (
  <svg width="16" height="13" viewBox="0 0 397 312" fill="none">
    <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7zM64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1L333.1 73.8c-2.4 2.4-5.7 3.8-9.2 3.8H6.5C.7 77.6-2.2 70.6 1.9 66.5L64.6 3.8zM333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" fill="#9ca3af"/>
  </svg>
);

const FEATURES = [
  { icon: <ShieldIcon />, iconBg: "#dcfce7", iconColor: "#16a34a", title: "Verified professionals", sub: "Quality you can trust" },
  { icon: <LockIcon />,   iconBg: "#ffedd5", iconColor: "#ea580c", title: "Secure payments",        sub: "Escrow protection on every job" },
  { icon: <ChatIcon />,   iconBg: "#ede9fe", iconColor: "#7c3aed", title: "Direct communication",   sub: "Connect and collaborate easily" },
];

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex", fontFamily: "Inter, sans-serif",
      background: "#ffffff", overflow: "hidden",
    }}>
      {/* ═══════════════════════════════ LEFT PANEL ═══════════════════════════════ */}
      <div style={{
        flex: 1, position: "relative", display: "flex", flexDirection: "column",
        padding: "44px 52px 0", zIndex: 2, overflow: "visible", background: "#ffffff",
      }}>
        {/* Soft teal radial gradient blob */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          background: "radial-gradient(ellipse 85% 65% at 30% 88%, rgba(20,184,166,0.17) 0%, rgba(204,251,241,0.12) 48%, transparent 72%)",
        }} />

        {/* ── Logo ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40, position: "relative", zIndex: 1 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-animated.svg" alt="Crewboard" style={{ width: 42, height: 42 }} />
          <div>
            <div style={{ fontSize: 19, fontWeight: 800, color: "#0a0a0a", letterSpacing: "-0.5px", lineHeight: 1.1 }}>
              <span style={{ fontWeight: 400 }}>crew</span>board
            </div>
            <div style={{ fontSize: 8.5, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.07em", textTransform: "uppercase", marginTop: 2 }}>
              Web3 Talent Marketplace
            </div>
          </div>
        </div>

        {/* ── Badge ── */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "7px 15px", borderRadius: 999,
          background: "rgba(20,184,166,0.09)", border: "1.5px solid rgba(20,184,166,0.26)",
          color: "#0d9488", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.055em",
          textTransform: "uppercase", marginBottom: 24, width: "fit-content",
          position: "relative", zIndex: 1,
        }}>
          <span style={{ fontSize: 11 }}>✦</span>
          The future of work is onchain
        </div>

        {/* ── Headline ── */}
        <h1 style={{
          fontSize: "clamp(2.1rem, 3.6vw, 2.85rem)", fontWeight: 800, color: "#0a0a0a",
          letterSpacing: "-0.04em", lineHeight: 1.07, margin: "0 0 16px",
          maxWidth: 420, position: "relative", zIndex: 1,
        }}>
          The professional<br />
          network <span style={{ color: "#14B8A6" }}>Web3</span><br />
          deserves.
        </h1>

        {/* ── Subtext ── */}
        <p style={{
          fontSize: 14.5, color: "#4b5563", lineHeight: 1.68,
          margin: "0 0 36px", maxWidth: 360, position: "relative", zIndex: 1,
        }}>
          Hire top talent or find meaningful work with secure payments,
          verified profiles, and a trusted community.
        </p>

        {/* ── Features ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22, position: "relative", zIndex: 1 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ display: "flex", alignItems: "center", gap: 15 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: f.iconBg, color: f.iconColor,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {f.icon}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0a0a0a", letterSpacing: "-0.01em", marginBottom: 2 }}>
                  {f.title}
                </div>
                <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.4 }}>
                  {f.sub}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          marginTop: "auto", padding: "24px 0 30px",
          fontSize: 12, color: "#9ca3af", position: "relative", zIndex: 1,
        }}>
          © 2026 Crewboard
          <span style={{ color: "#d1d5db" }}>•</span>
          <SolanaIcon />
          Built on Solana
        </div>

        {/* ── App Mockup Card ── */}
        <div style={{
          position: "absolute", bottom: 0, right: -92,
          width: 268, background: "#ffffff",
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -4px 32px rgba(0,0,0,0.09), 0 -1px 8px rgba(0,0,0,0.06)",
          border: "1px solid rgba(0,0,0,0.07)", borderBottom: "none",
          overflow: "hidden", zIndex: 4,
        }}>
          {/* Mockup header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "14px 16px 12px", borderBottom: "1px solid #f3f4f6",
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: 7, background: "#14B8A6",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 19 7 19 17 12 22 5 17 5 7 12 2"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0a0a0a", letterSpacing: "-0.4px", lineHeight: 1.1 }}>
                crewboard
              </div>
              <div style={{ fontSize: 7.5, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 1 }}>
                Web3 Talent Marketplace
              </div>
            </div>
          </div>

          {/* Mockup freelancer card */}
          <div style={{ padding: "10px 12px" }}>
            <div style={{
              background: "#f9fafb", borderRadius: 14, padding: "12px 13px",
              border: "1px solid #f0f0f0",
            }}>
              {/* User row */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, #14B8A6 0%, #0d9488 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 13, fontWeight: 700,
                }}>
                  AI
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0a", letterSpacing: "-0.2px" }}>
                    AI Expert
                  </div>
                  <div style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 1 }}>
                    @0.x · @talentdropher
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 11.5, color: "#6b7280", marginBottom: 6 }}>
                Smart Contract Developer
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#0a0a0a", letterSpacing: "-0.3px" }}>
                  $80 / hr
                </div>
                <span style={{
                  padding: "3px 11px", borderRadius: 999, fontSize: 10.5,
                  fontWeight: 700, background: "#14B8A6", color: "#fff", cursor: "default",
                }}>
                  Save
                </span>
              </div>
              <div style={{ fontSize: 10.5, color: "#9ca3af", marginBottom: 8 }}>500+ jobs completed</div>
              {/* Stacked avatars */}
              <div style={{ display: "flex", alignItems: "center" }}>
                {["#14B8A6","#f97316","#8b5cf6"].map((c, i) => (
                  <div key={i} style={{
                    width: 22, height: 22, borderRadius: "50%", background: c,
                    border: "2px solid #f9fafb", marginLeft: i === 0 ? 0 : -6,
                    fontSize: 9, fontWeight: 700, color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════ RIGHT PANEL ══════════════════════════════ */}
      <div style={{
        width: "46%", maxWidth: 560, flexShrink: 0, position: "relative", zIndex: 1,
        background: "#ffffff", borderLeft: "1px solid #f0f0f0",
        display: "flex", flexDirection: "column", overflowY: "auto",
      }}>
        {children}
      </div>

      {/* ── Mobile breakpoint ── */}
      <style>{`
        @media (max-width: 767px) {
          .auth-left-panel { display: none !important; }
          .auth-right-panel { width: 100% !important; max-width: 100% !important; border-left: none !important; }
        }
      `}</style>
    </div>
  );
}
