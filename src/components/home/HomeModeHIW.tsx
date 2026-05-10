"use client";
import Link from "next/link";
import { useMode } from "@/components/ModeProvider";
import type { ReactNode } from "react";

interface Step {
  step: string;
  title: string;
  desc: string;
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  badge: string;
  badgeColor: string;
}

const CLIENT_STEPS: Step[] = [
  {
    step: "1",
    title: "Post a job",
    desc: "Describe what you need. It takes 2 minutes and it's free.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    ),
    iconBg: "rgba(20,184,166,0.13)",
    iconColor: "#14B8A6",
    badge: "Free to post",
    badgeColor: "#14B8A6",
  },
  {
    step: "2",
    title: "Hire a freelancer",
    desc: "Browse profiles, read reviews, and message candidates directly. Pick the best fit.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    iconBg: "rgba(99,132,200,0.13)",
    iconColor: "#6384C8",
    badge: "Verified talent",
    badgeColor: "#14B8A6",
  },
  {
    step: "3",
    title: "Pay after delivery",
    desc: "Your payment is held safely and only released when you approve the work. No risk.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    iconBg: "rgba(249,115,22,0.13)",
    iconColor: "#f97316",
    badge: "Secure payments",
    badgeColor: "#f97316",
  },
];

const FREELANCER_STEPS: Step[] = [
  {
    step: "1",
    title: "Create your gig",
    desc: "Set up your profile and list your services. Show clients exactly what you offer.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <line x1="12" y1="8" x2="12" y2="16"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    ),
    iconBg: "rgba(20,184,166,0.13)",
    iconColor: "#14B8A6",
    badge: "Free to join",
    badgeColor: "#14B8A6",
  },
  {
    step: "2",
    title: "Get hired",
    desc: "Clients find you through the talent directory or job board. Chat and agree on scope.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    iconBg: "rgba(99,132,200,0.13)",
    iconColor: "#6384C8",
    badge: "Verified clients",
    badgeColor: "#14B8A6",
  },
  {
    step: "3",
    title: "Deliver & earn",
    desc: "Submit your work. Once the client approves, payment is released directly to your wallet.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    iconBg: "rgba(249,115,22,0.13)",
    iconColor: "#f97316",
    badge: "Secure payments",
    badgeColor: "#f97316",
  },
];

const TRUST_ITEMS = [
  {
    label: "Verified professionals",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    label: "Secure payments",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
  },
  {
    label: "Direct communication",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
];

export default function HomeModeHIW({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { mode } = useMode();
  const isClient = mode === "hiring";
  const steps = isClient ? CLIENT_STEPS : FREELANCER_STEPS;

  return (
    <>
      {/* ── Numbered step timeline ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        maxWidth: 620, margin: "0 auto 2.5rem",
        padding: "0 1rem",
      }}>
        {steps.map((s, i) => (
          <div key={s.step} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? "1" : "0" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "#14B8A6", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: "0.9rem", flexShrink: 0,
              boxShadow: "0 2px 8px rgba(20,184,166,0.35)",
            }}>
              {s.step}
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1,
                borderTop: "2px dashed rgba(20,184,166,0.45)",
                margin: "0 6px",
              }} />
            )}
          </div>
        ))}
      </div>

      {/* ── Cards ── */}
      <div style={{ display: "grid", gap: "1.25rem" }} className="hiw-grid">
        {steps.map((item) => (
          <div
            key={item.step}
            className="hiw-card"
            style={{
              display: "flex", flexDirection: "column",
              padding: "1.75rem 1.5rem",
              borderRadius: 16,
              background: "var(--background)",
              border: "1px solid var(--card-border)",
            }}
          >
            {/* Icon */}
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: item.iconBg,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: item.iconColor,
              marginBottom: "1.1rem",
            }}>
              {item.icon}
            </div>

            {/* Step label */}
            <div style={{
              fontSize: "0.6rem", fontWeight: 700,
              letterSpacing: "0.14em", textTransform: "uppercase",
              color: "#14B8A6", marginBottom: "0.35rem",
            }}>
              Step {item.step}
            </div>

            {/* Title */}
            <h3 style={{
              fontFamily: "Inter, sans-serif", fontWeight: 700,
              fontSize: "1.05rem", color: "var(--foreground)",
              margin: "0 0 0.55rem", letterSpacing: "-0.02em",
            }}>
              {item.title}
            </h3>

            {/* Description */}
            <p style={{
              color: "var(--text-muted)", fontSize: "0.83rem",
              lineHeight: 1.65, margin: "0 0 1.25rem", flex: 1,
            }}>
              {item.desc}
            </p>

            {/* Badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              fontSize: "0.75rem", fontWeight: 600,
              color: item.badgeColor,
              border: `1px solid ${item.badgeColor}33`,
              borderRadius: 99, padding: "4px 10px",
              width: "fit-content",
            }}>
              {item.badgeColor === "#f97316" ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              )}
              {item.badge}
            </div>
          </div>
        ))}
      </div>

      {/* ── Trust bar ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        flexWrap: "wrap", gap: "1rem 2.5rem",
        marginTop: "2.5rem",
        padding: "1rem 1.5rem",
        borderRadius: 12,
        background: "var(--surface, rgba(0,0,0,0.025))",
        border: "1px solid var(--card-border)",
      }}>
        {TRUST_ITEMS.map((t) => (
          <div key={t.label} style={{
            display: "flex", alignItems: "center", gap: 7,
            fontSize: "0.82rem", fontWeight: 500, color: "var(--text-muted)",
          }}>
            <span style={{ color: "var(--text-muted)", opacity: 0.7 }}>{t.icon}</span>
            {t.label}
          </div>
        ))}
      </div>

      <style>{`
        .hiw-grid { grid-template-columns: repeat(3, 1fr); }
        @media (max-width: 700px) { .hiw-grid { grid-template-columns: 1fr; } }
        .hiw-card { transition: box-shadow 0.18s, transform 0.18s, border-color 0.18s; }
        .hiw-card:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,0.08); border-color: rgba(20,184,166,0.25) !important; }
      `}</style>
    </>
  );
}
