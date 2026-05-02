import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";

export const metadata: Metadata = { title: "How it Works — Crewboard" };

const HIRE_STEPS = [
  {
    n: "01",
    title: "Post a job",
    body: "Describe what you need — title, budget, skills required. It takes 2 minutes and is completely free. Your listing goes live instantly on the Web3 job board.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    ),
    color: "#6366f1",
    bg: "rgba(99,102,241,0.1)",
  },
  {
    n: "02",
    title: "Review applicants",
    body: "Freelancers apply with a cover letter, portfolio, and proposed rate. You see their full profile, reviews, and completed jobs before making any decision.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <polyline points="16 11 18 13 22 9"/>
      </svg>
    ),
    color: "#14b8a6",
    bg: "rgba(20,184,166,0.1)",
  },
  {
    n: "03",
    title: "Send an offer",
    body: "Message the freelancer directly. When you agree on scope and price, send a formal offer through Crewboard. The freelancer accepts and work begins.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
  },
  {
    n: "04",
    title: "Fund escrow",
    body: "Your payment is locked in a secure on-chain escrow (Solana). The freelancer can see funds are there — but you keep control until work is approved.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.1)",
  },
  {
    n: "05",
    title: "Approve & release",
    body: "Freelancer delivers. You review and approve. Payment releases instantly on-chain. Leave a review to help the community.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    color: "#22c55e",
    bg: "rgba(34,197,94,0.1)",
  },
];

const WORK_STEPS = [
  {
    n: "01",
    title: "Complete your profile",
    body: "Add your bio, skills, wallet address, and at least one service. Profiles above 70% appear in talent search and get 3× more views.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    color: "#14b8a6",
    bg: "rgba(20,184,166,0.1)",
  },
  {
    n: "02",
    title: "List your services",
    body: "Create a gig — describe what you offer, set a price, and define deliverables. Clients browse and can hire you directly without a job posting.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
        <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
      </svg>
    ),
    color: "#6366f1",
    bg: "rgba(99,102,241,0.1)",
  },
  {
    n: "03",
    title: "Apply to jobs",
    body: "Browse the job board and apply with a cover letter, portfolio link, and your proposed rate. Direct and async — no calls required.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      </svg>
    ),
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
  },
  {
    n: "04",
    title: "Accept the offer",
    body: "Client sends a formal offer. You review it, accept, and the client funds the escrow. You see the payment is locked before you start.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.1)",
  },
  {
    n: "05",
    title: "Deliver & get paid",
    body: "Submit your work through the platform. Client approves and payment is released directly to your wallet. No delays, no middlemen.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    color: "#22c55e",
    bg: "rgba(34,197,94,0.1)",
  },
];

const TRUST = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: "On-chain escrow",
    body: "Funds are held by a Solana smart contract — not by us. Neither party can take money without the other's consent.",
    color: "#14b8a6",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 12 19.79 19.79 0 0 1 1.93 3.48 2 2 0 0 1 3.9 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6.91 6.91l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22.01 17z"/>
      </svg>
    ),
    title: "Direct messaging",
    body: "Message anyone on the platform. No forced calls, no account managers. Just you and the person you're working with.",
    color: "#6366f1",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    title: "Verified reviews",
    body: "Reviews are tied to real completed orders. You know who you're hiring because the track record is on-chain and unfakeable.",
    color: "#f59e0b",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    title: "Web3 native",
    body: "Built for crypto projects, Solana teams, and Web3 builders. Everyone here speaks the same language.",
    color: "#8b5cf6",
  },
];

export default async function HowPage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  return (
    <main className="page" style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem 6rem" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#14b8a6", marginBottom: "0.6rem" }}>
            Platform guide
          </div>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 800, color: "var(--foreground)", margin: "0 0 0.75rem", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            How Crewboard Works
          </h1>
          <p style={{ fontSize: "0.92rem", color: "var(--text-muted)", maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
            A Web3-native marketplace where clients and freelancers transact securely with on-chain escrow. No middlemen, no upfront risk.
          </p>
        </div>

        {/* Two-path tabs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem", marginBottom: "3.5rem" }}>

          {/* For Clients */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem", paddingBottom: "0.85rem", borderBottom: "2px solid #14b8a6" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(20,184,166,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#14b8a6", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#14b8a6" }}>For Clients</div>
                <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--foreground)" }}>Hiring on Crewboard</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {HIRE_STEPS.map((s) => (
                <div key={s.n} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", color: s.color, flexShrink: 0 }}>
                    {s.icon}
                  </div>
                  <div style={{ paddingTop: 2 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.14em", color: s.color, textTransform: "uppercase" }}>{s.n}</span>
                      <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--foreground)" }}>{s.title}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.65 }}>{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "1.5rem" }}>
              <Link href="/jobs/new" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 10, background: "#14b8a6", color: "#0f172a", fontWeight: 700, fontSize: "0.82rem", textDecoration: "none" }}>
                Post a Job — free
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
            </div>
          </div>

          {/* For Freelancers */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem", paddingBottom: "0.85rem", borderBottom: "2px solid #6366f1" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(99,102,241,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366f1", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6366f1" }}>For Freelancers</div>
                <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--foreground)" }}>Getting paid on Crewboard</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {WORK_STEPS.map((s) => (
                <div key={s.n} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", color: s.color, flexShrink: 0 }}>
                    {s.icon}
                  </div>
                  <div style={{ paddingTop: 2 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.14em", color: s.color, textTransform: "uppercase" }}>{s.n}</span>
                      <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--foreground)" }}>{s.title}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.65 }}>{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "1.5rem" }}>
              <Link href="/jobs" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 10, background: "rgba(99,102,241,0.12)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.3)", fontWeight: 700, fontSize: "0.82rem", textDecoration: "none" }}>
                Browse Open Jobs
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Trust section */}
        <div style={{ borderTop: "1px solid var(--card-border)", paddingTop: "2.5rem" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#14b8a6", marginBottom: "0.5rem", textAlign: "center" }}>
            Built on trust
          </div>
          <h2 style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)", fontWeight: 800, color: "var(--foreground)", margin: "0 0 1.75rem", textAlign: "center", letterSpacing: "-0.01em" }}>
            Why Crewboard is different
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
            {TRUST.map((t) => (
              <div key={t.title} style={{ display: "flex", gap: "0.9rem", padding: "1.1rem 1.25rem", borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${t.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: t.color, flexShrink: 0 }}>
                  {t.icon}
                </div>
                <div>
                  <div style={{ fontSize: "0.83rem", fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>{t.title}</div>
                  <p style={{ margin: 0, fontSize: "0.76rem", color: "var(--text-muted)", lineHeight: 1.6 }}>{t.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA — only for logged-out visitors */}
        {!isLoggedIn && (
          <div style={{ marginTop: "3rem", padding: "2rem", borderRadius: 16, background: "var(--card-bg)", border: "1px solid rgba(20,184,166,0.2)", textAlign: "center" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--foreground)", margin: "0 0 0.5rem" }}>Ready to get started?</h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0 0 1.25rem", lineHeight: 1.6 }}>
              Join hundreds of Web3 builders already using Crewboard.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 22px", borderRadius: 10, background: "#14b8a6", color: "#0f172a", fontWeight: 700, fontSize: "0.85rem", textDecoration: "none" }}>
                Create free account
              </Link>
              <Link href="/talent" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 22px", borderRadius: 10, border: "1px solid var(--card-border)", color: "var(--foreground)", fontWeight: 600, fontSize: "0.85rem", textDecoration: "none" }}>
                Browse talent
              </Link>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @media (max-width: 640px) {
          .how-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
