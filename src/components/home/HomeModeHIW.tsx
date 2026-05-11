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
      {/* ── Cards — mirrors the app's Offer Details step timeline style ── */}
      <div style={{ display: "grid", gap: "1rem" }} className="hiw-grid">
        {steps.map((item) => (
          <div
            key={item.step}
            className="hiw-card"
            style={{
              display: "flex", flexDirection: "column",
              padding: "1.5rem",
              borderRadius: 16,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            {/* Step number — black circle (mirrors app step indicators) */}
            <div className="hiw-step-num" style={{ marginBottom: "1rem" }}>
              {item.step}
            </div>

            {/* Title */}
            <h3 style={{
              fontFamily: "Inter, sans-serif", fontWeight: 700,
              fontSize: "1rem", color: "var(--foreground)",
              margin: "0 0 0.45rem", letterSpacing: "-0.02em",
            }}>
              {item.title}
            </h3>

            {/* Description */}
            <p style={{
              color: "var(--text-muted)", fontSize: "0.83rem",
              lineHeight: 1.65, margin: "0 0 1rem", flex: 1,
            }}>
              {item.desc}
            </p>

            {/* Badge — pill tag (matches app's "Free to post", "Secure payments") */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              fontSize: "0.73rem", fontWeight: 600,
              color: item.badgeColor === "#f97316" ? "#ea580c" : "var(--brand)",
              background: item.badgeColor === "#f97316" ? "rgba(249,115,22,0.08)" : "rgba(20,184,166,0.08)",
              border: `1px solid ${item.badgeColor === "#f97316" ? "rgba(249,115,22,0.25)" : "rgba(20,184,166,0.25)"}`,
              borderRadius: 999, padding: "4px 11px",
              width: "fit-content",
            }}>
              {item.badge}
            </div>
          </div>
        ))}
      </div>

      {/* ── Trust bar ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        flexWrap: "wrap", gap: "1rem 2.5rem",
        marginTop: "2rem",
        padding: "1rem 1.5rem",
        borderRadius: 14,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}>
        {TRUST_ITEMS.map((t) => (
          <div key={t.label} style={{
            display: "flex", alignItems: "center", gap: 7,
            fontSize: "0.82rem", fontWeight: 500, color: "var(--text-muted)",
          }}>
            <span style={{ color: "var(--brand)", opacity: 0.9 }}>{t.icon}</span>
            {t.label}
          </div>
        ))}
      </div>

      <style>{`
        .hiw-grid { grid-template-columns: repeat(3, 1fr); }
        @media (max-width: 700px) { .hiw-grid { grid-template-columns: 1fr; } }
        .hiw-card { transition: box-shadow 0.18s, transform 0.18s, border-color 0.18s; }
        .hiw-card:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,0.07); border-color: rgba(20,184,166,0.3) !important; }
      `}</style>
    </>
  );
}
