"use client";
import Link from "next/link";
import { useMode } from "@/components/ModeProvider";
import type { ReactNode } from "react";

interface Step { step: string; title: string; desc: string; icon: ReactNode; color: string; bg: string }

const CLIENT_STEPS: Step[] = [
  {
    step: "1", title: "Post a job",
    desc: "Describe what you need. It takes 2 minutes and it's free.",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    ),
    color: "#6366f1", bg: "rgba(99,102,241,0.1)",
  },
  {
    step: "2", title: "Hire a freelancer",
    desc: "Browse profiles, read reviews, and message candidates directly. Pick the best fit.",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <polyline points="16 11 18 13 22 9"/>
      </svg>
    ),
    color: "var(--brand)", bg: "rgba(74,222,128,0.1)",
  },
  {
    step: "3", title: "Pay after delivery",
    desc: "Your payment is held safely and only released when you approve the work. No risk.",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    color: "#22c55e", bg: "rgba(34,197,94,0.1)",
  },
];

const FREELANCER_STEPS: Step[] = [
  {
    step: "1", title: "Create your gig",
    desc: "Set up your profile and list your services. Show clients exactly what you offer.",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    ),
    color: "#6366f1", bg: "rgba(99,102,241,0.1)",
  },
  {
    step: "2", title: "Get hired",
    desc: "Clients find you through the talent directory or job board. Chat and agree on scope.",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    color: "var(--brand)", bg: "rgba(74,222,128,0.1)",
  },
  {
    step: "3", title: "Deliver & earn",
    desc: "Submit your work. Once the client approves, payment is released directly to your wallet.",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    color: "#22c55e", bg: "rgba(34,197,94,0.1)",
  },
];

export default function HomeModeHIW({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { mode } = useMode();
  const isClient = mode === "hiring";
  const steps = isClient ? CLIENT_STEPS : FREELANCER_STEPS;

  return (
    <>
      <div style={{ display: "grid", gap: "clamp(0.75rem,2vw,1.25rem)" }} className="hiw-grid">
        {steps.map((item) => (
          <div key={item.step} className="hiw-card" style={{ display: "flex", alignItems: "flex-start", gap: "1rem", padding: "1.25rem", borderRadius: 14, background: "var(--background)", border: "1px solid var(--card-border)" }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", color: item.color, flexShrink: 0 }}>
              {item.icon}
            </div>
            <div>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", color: item.color, textTransform: "uppercase", marginBottom: 5 }}>Step {item.step}</div>
              <h3 style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.95rem", color: "var(--foreground)", margin: "0 0 0.3rem", letterSpacing: "-0.01em" }}>{item.title}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", lineHeight: 1.65, margin: 0 }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: "clamp(1.5rem,3vw,2.5rem)" }}>
        <Link
          href={isClient ? (isLoggedIn ? "/jobs/new" : "/register") : "/talent"}
          className="btn-hero-primary"
          style={{ display: "inline-flex" }}
        >
          {isClient ? "Post a Job — it’s free" : "Browse Talent"}
        </Link>
      </div>
    </>
  );
}
