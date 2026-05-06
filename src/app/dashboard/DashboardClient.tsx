"use client";

import Link from "next/link";
import { useEffect } from "react";
import ModeToggle from "@/components/dashboard/ModeToggle";
import { useMode, setMode } from "@/components/ModeProvider";
import PostedJobsSection from "@/components/dashboard/PostedJobsSection";
import SentOffersSection from "@/components/dashboard/SentOffersSection";
import T from "@/components/ui/T";
import { computeProfileScore } from "@/lib/profileScore";

function msgPreview(body: string, maxLen = 40): string {
  if (body.startsWith("__GIGREQUEST__:")) {
    try { return "Service Request: " + JSON.parse(body.slice("__GIGREQUEST__:".length)).title; } catch { return "Service Request"; }
  }
  if (body.startsWith("__FILE__:")) {
    try {
      const f = JSON.parse(body.slice("__FILE__:".length));
      if (f.type?.startsWith("image/")) return "Image";
      if (f.type?.startsWith("video/")) return "Video";
      return f.name;
    } catch { return "File"; }
  }
  return body.slice(0, maxLen) + (body.length > maxLen ? "…" : "");
}

export default function DashboardClient({ data }: { data: DashboardData }) {
  const { mode } = useMode();
  const hasGigs = (data.dbUser.gigs?.length ?? 0) > 0;

  // Apply smart default only on first visit (no saved preference)
  useEffect(() => {
    const saved = localStorage.getItem("cb_mode");
    if (!saved) setMode(hasGigs ? "working" : "hiring");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    dbUser, recentConvos, activeOrders, completedOrders, completedBuyerOrders,
    profileViewCount, unreadMessageCount, totalConvoCount,
    postedJobs, sentOffers, otherByConvo, userId,
  } = data;

  const fmt = (n: number) => n === 0 ? "$0" : `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  const buyerOrders  = activeOrders.filter((o) => o.buyerId  === userId);
  const sellerOrders = activeOrders.filter((o) => o.sellerId === userId);

  // Hiring wallet values
  const totalSpent        = (completedBuyerOrders ?? []).reduce((s, o) => s + o.amount, 0);
  const buyerEscrow       = buyerOrders.filter((o) => o.status === "funded").reduce((s, o) => s + o.amount, 0);
  const buyerPending      = buyerOrders.filter((o) => o.status === "delivered").reduce((s, o) => s + o.amount, 0);

  // Working wallet values
  const grossEarned       = completedOrders.reduce((s, o) => s + o.amount, 0);
  const totalEarned       = grossEarned - Math.floor(grossEarned * 0.10);
  const sellerEscrow      = sellerOrders.filter((o) => o.status === "funded").reduce((s, o) => s + o.amount, 0);
  const pendingRelease    = sellerOrders.filter((o) => o.status === "delivered");
  const pendingPayout     = pendingRelease.reduce((s, o) => s + o.amount, 0);

  // Keep escrowAmount for legacy references
  const escrowAmount = buyerEscrow + sellerEscrow;

  const profileScore = computeProfileScore({
    bio: dbUser.bio, image: dbUser.image, skills: dbUser.skills,
    gigCount: dbUser.gigs?.length ?? 0, walletAddress: dbUser.walletAddress,
  });

  const showProfileCard = mode === "working" && !profileScore.meetsThreshold;
  const showFreelancerAccelerator = mode === "working" && completedOrders.length === 0;
  const showClientAccelerator = mode === "hiring" && buyerOrders.filter((o) => o.status === "completed").length === 0 && postedJobs.length === 0;

  // Freelancer onboarding steps
  const freelancerSteps = [
    { label: "Complete your profile",  sub: "Reach 70% to appear in talent search", cta: "Complete",     href: `/u/${dbUser.twitterHandle}`, done: profileScore.meetsThreshold },
    { label: "Add your first service", sub: "Let clients know what you offer",       cta: "Add service", href: "/gigs/new",                  done: (dbUser.gigs?.length ?? 0) > 0 },
    { label: "Send your first message",sub: "Reach out or reply to a job posting",   cta: "Open chat",   href: "/messages",                  done: totalConvoCount > 0 },
    { label: "Apply to 3 jobs",        sub: "Message clients on the job board",       cta: "Browse jobs", href: "/jobs",                      done: totalConvoCount >= 3 },
  ];

  // Client onboarding steps
  const clientSteps = [
    { label: "Post a job",    sub: "Describe what you need — freelancers will apply", cta: "Post Job",      href: "/jobs/new",  done: postedJobs.length > 0 },
    { label: "Get offers",    sub: "Review applicants and reach out to talent",       cta: "Browse talent", href: "/talent",    done: sentOffers.length > 0 },
    { label: "Fund escrow",   sub: "Lock payment on-chain to start work",             cta: "View orders",   href: "/orders",    done: buyerOrders.filter((o) => o.status !== "pending").length > 0 },
  ];

  const accelSteps = mode === "working" ? freelancerSteps : clientSteps;
  const accelDone     = accelSteps.filter((s) => s.done).length;
  const accelComplete = accelDone === accelSteps.length;
  const showAccelerator = mode === "working" ? showFreelancerAccelerator : showClientAccelerator;

  const hiringStats = [
    { label: "Posted Jobs",    value: postedJobs.length,   href: "/jobs/mine"  },
    { label: "Active Orders",  value: buyerOrders.length,  href: "/orders"     },
    { label: "Sent Offers",    value: sentOffers.length,   href: "/messages"   },
    { label: "Profile Views",  value: profileViewCount,    href: `/u/${dbUser.twitterHandle}` },
  ];
  const workingStats = [
    { label: "Active Services",value: dbUser.gigs?.length ?? 0,    href: "/gigs"   },
    { label: "Active Orders",  value: sellerOrders.length,          href: "/orders" },
    { label: "Completed",      value: completedOrders.length,       href: "/orders?tab=completed" },
    { label: "Profile Views",  value: profileViewCount,             href: `/u/${dbUser.twitterHandle}` },
  ];

  return (
    <main className="dash-main-wrap mf-page" style={{ minHeight: "100vh", paddingBottom: "5rem" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <style>{`
          .active-order-row:hover { background: rgba(20,184,166,0.04) !important; }
          @keyframes tealPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.45;transform:scale(1.5)} }
          @media (max-width: 640px) {
            .cb-mode-wrap { width: 100%; order: -1; }
            .cb-mode-wrap > div { display: flex !important; width: 100%; }
            .cb-mode-wrap > div > button { flex: 1; justify-content: center; }
            .wallet-stat-grid { grid-template-columns: 1fr !important; }
            .wallet-stat-grid > div { border-right: none !important; border-bottom: 1px solid var(--card-border); }
            .wallet-stat-grid > div:last-child { border-bottom: none; }
          }
        `}</style>

        {/* ── HEADER ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--foreground)", margin: 0, letterSpacing: "-0.02em" }}>
              {mode === "hiring" ? "Client Dashboard" : "Freelancer Dashboard"}
            </h1>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "3px 0 0" }}>
              {mode === "hiring" ? "Manage your hires, jobs, and payments." : "Track your work, gigs, and earnings."}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            {/* Mobile-only toggle (desktop toggle is in the navbar) */}
            <div className="cb-mode-wrap md:hidden">
              <ModeToggle />
            </div>
            <Link href={`/u/${dbUser.twitterHandle}`} style={{ fontSize: "0.75rem", fontWeight: 600, padding: "6px 14px", borderRadius: 99, border: "1px solid var(--card-border)", color: "var(--foreground)", textDecoration: "none" }}>
              <T k="dash.viewProfile" />
            </Link>
            {mode === "working" && (
              <Link href="/gigs/new" onClick={() => setMode("working")} style={{ fontSize: "0.75rem", fontWeight: 700, padding: "6px 14px", borderRadius: 99, background: "var(--foreground)", color: "var(--dropdown-bg)", textDecoration: "none" }}>
                + Create Gig
              </Link>
            )}
            {mode === "hiring" && (
              <Link href="/jobs/new" onClick={() => setMode("hiring")} style={{ fontSize: "0.75rem", fontWeight: 700, padding: "6px 14px", borderRadius: 99, background: "var(--foreground)", color: "var(--dropdown-bg)", textDecoration: "none" }}>
                + Post a Job
              </Link>
            )}
          </div>
        </div>

        {/* ── ACTIVE ORDERS STRIP ── */}
        {(() => {
          const orders = mode === "hiring" ? buyerOrders : sellerOrders;
          return orders.length > 0 ? (
            <div style={{ marginBottom: "1.5rem", borderRadius: 14, overflow: "hidden", border: "1px solid rgba(20,184,166,0.25)", background: "var(--card-bg)" }}>
              <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--card-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#14b8a6", display: "inline-block", animation: "tealPulse 2s ease-in-out infinite" }} />
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#14b8a6" }}>
                    {mode === "hiring" ? "Orders I'm managing" : "Active Work"} — {orders.length}
                  </span>
                </div>
                <Link href="/orders" style={{ fontSize: "0.75rem", fontWeight: 600, color: "#14b8a6", textDecoration: "none" }}>View all →</Link>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {orders.slice(0, 3).map((o, i) => {
                  const isSeller = o.sellerId === userId;
                  const labels: Record<string, string> = {
                    pending: "Awaiting payment",
                    funded:  isSeller ? "Funded — start work" : "In progress",
                    delivered: isSeller ? "Delivered — awaiting release" : "Review & release payment",
                  };
                  const colors: Record<string, string> = { pending: "#f59e0b", funded: "#14b8a6", delivered: "#6366f1" };
                  return (
                    <Link key={o.id} href={`/orders/${o.id}`} className="active-order-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.85rem 1.25rem", borderTop: i > 0 ? "1px solid var(--card-border)" : "none", textDecoration: "none", color: "inherit", gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.83rem", fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.gig?.title ?? "Order"}</div>
                        <div style={{ fontSize: "0.72rem", color: colors[o.status] ?? "var(--text-muted)", fontWeight: 600, marginTop: 2 }}>{labels[o.status] ?? o.status}</div>
                      </div>
                      <div style={{ flexShrink: 0, fontSize: "0.82rem", fontWeight: 700 }}>${o.amount}</div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null;
        })()}

        {/* ── PROFILE COMPLETION (freelancer only) ── */}
        {showProfileCard && (
          <div style={{ marginBottom: "1.5rem", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(245,158,11,0.35)", background: "var(--card-bg)" }}>
            <div style={{ height: 4, background: `linear-gradient(90deg,#f59e0b ${profileScore.score}%,var(--card-border) ${profileScore.score}%)` }} />
            <div style={{ padding: "1.5rem 1.75rem" }}>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "#f59e0b", marginBottom: "0.5rem" }}>Profile — {profileScore.score}% complete</div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--foreground)", margin: "0 0 0.35rem" }}>Complete your profile to start getting clients.</h2>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0 0 1.1rem" }}>You won&apos;t appear in search until it&apos;s done.</p>
              <div style={{ height: 6, borderRadius: 99, background: "rgba(245,158,11,0.12)", overflow: "hidden", maxWidth: 320, marginBottom: "1.25rem" }}>
                <div style={{ height: "100%", width: `${profileScore.score}%`, borderRadius: 99, background: profileScore.score >= 60 ? "#f59e0b" : "#ef4444", transition: "width 0.4s" }} />
              </div>
              <Link href={`/u/${dbUser.twitterHandle}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0.65rem 1.4rem", borderRadius: 10, background: "#f59e0b", color: "#fff", fontWeight: 700, fontSize: "0.85rem", textDecoration: "none" }}>
                Complete your profile →
              </Link>
            </div>
          </div>
        )}

        {/* ── CLIENT: quick-action CTAs ── */}
        {mode === "hiring" && (
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            {[
              { label: "Find Talent",  href: "/talent",    icon: "👥", mode: null       },
              { label: "Post a Job",   href: "/jobs/new",  icon: "📋", mode: "hiring"   },
              { label: "My Jobs",      href: "/jobs/mine", icon: "🗂️", mode: null       },
              { label: "All Orders",   href: "/orders",    icon: "📦", mode: null       },
            ].map((a) => (
              <Link key={a.href} href={a.href} onClick={() => a.mode && setMode(a.mode as "hiring" | "working")} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, border: "1px solid var(--card-border)", background: "var(--card-bg)", fontSize: "0.78rem", fontWeight: 600, color: "var(--foreground)", textDecoration: "none" }}>
                {a.icon} {a.label}
              </Link>
            ))}
          </div>
        )}

        {/* ── STATS GRID ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem", marginBottom: "1.25rem" }} className="dash-stats-grid">
          {(mode === "hiring" ? hiringStats : workingStats).map((s) => (
            <Link key={s.label} href={s.href} style={{ textDecoration: "none" }}>
              <div style={{ borderRadius: 14, padding: "1rem 1.1rem", background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--foreground)", letterSpacing: "-0.02em" }}>{s.value}</div>
                <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginTop: 5 }}>{s.label}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── ONBOARDING ACCELERATOR (both modes) ── */}
        {showAccelerator && (
          <div style={{ marginBottom: "1.5rem", borderRadius: 14, border: accelComplete ? "1px solid rgba(34,197,94,0.35)" : "1px solid var(--card-border)", background: "var(--card-bg)", overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--card-border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
              <div>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: accelComplete ? "#22c55e" : "#14b8a6", marginBottom: 3 }}>
                  {mode === "hiring" ? "Client Quickstart" : "First Job Accelerator"}
                </div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: accelComplete ? "#22c55e" : "var(--foreground)" }}>
                  {accelComplete
                    ? (mode === "hiring" ? "You're ready to hire" : "You're ready to get hired")
                    : (mode === "hiring" ? "Start hiring in 3 steps" : "Land your first job faster")}
                </div>
              </div>
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                {accelSteps.map((s, i) => (
                  <div key={i} style={{ width: 28, height: 4, borderRadius: 99, background: s.done ? (accelComplete ? "#22c55e" : "#14b8a6") : "var(--card-border)", transition: "background 0.3s" }} />
                ))}
              </div>
            </div>
            <div style={{ padding: "0.35rem 0" }}>
              {accelSteps.map((step, i) => (
                <Link key={i} href={step.done ? "#" : step.href} style={{ display: "flex", alignItems: "center", gap: "0.9rem", padding: "0.7rem 1.25rem", textDecoration: "none", borderBottom: i < accelSteps.length - 1 ? "1px solid var(--card-border)" : "none", opacity: step.done ? 0.6 : 1, pointerEvents: step.done ? "none" : "auto" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: step.done ? (accelComplete ? "#22c55e" : "#14b8a6") : "transparent", border: step.done ? "none" : "1.5px solid var(--card-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {step.done && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: step.done ? 500 : 600, color: "var(--foreground)", textDecoration: step.done ? "line-through" : "none" }}>{step.label}</div>
                    {!step.done && <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 1 }}>{step.sub}</div>}
                  </div>
                  {!step.done && <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#14b8a6", flexShrink: 0 }}>{step.cta} →</span>}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── MESSAGES ── */}
        <div style={{ borderRadius: 14, padding: "1.1rem 1.25rem", background: "var(--card-bg)", border: "1px solid var(--card-border)", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.9rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "var(--text-muted)" }}>Messages</span>
              {unreadMessageCount > 0 && <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "#fff", background: "#6366f1", borderRadius: 99, padding: "1px 6px", lineHeight: 1.6 }}>{unreadMessageCount}</span>}
            </div>
            <Link href="/messages" style={{ fontSize: "0.65rem", color: "#14b8a6", textDecoration: "none", fontWeight: 600 }}>View all →</Link>
          </div>
          {recentConvos.length === 0 ? (
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>No messages yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              {recentConvos.map((c) => {
                const last = c.messages[0];
                if (!last) return null;
                const other = otherByConvo[c.id];
                return (
                  <Link key={c.id} href={`/messages/${c.id}`} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", padding: "0.5rem 0.6rem", borderRadius: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--avatar-bg)", overflow: "hidden", flexShrink: 0, border: "1px solid var(--card-border)" }}>
                      {other?.image && <img src={other.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{other?.name ?? other?.twitterHandle ?? "Unknown"}</div>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msgPreview(last.body, 48)}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ── CLIENT: jobs + offers ── */}
        {mode === "hiring" && postedJobs.length > 0 && <PostedJobsSection jobs={postedJobs} />}
        {mode === "hiring" && sentOffers.length > 0 && <SentOffersSection offers={sentOffers as any} />}

        {/* ── WALLET & ESCROW SUMMARY ── */}
        {mode === "hiring" ? (
          <div style={{ borderRadius: 14, border: "1px solid var(--card-border)", background: "var(--card-bg)", overflow: "hidden", marginTop: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--card-border)" }}>
              <span style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "var(--text-muted)" }}>Wallet & Payments</span>
              <Link href="/billing" style={{ fontSize: "0.65rem", color: "#14b8a6", textDecoration: "none", fontWeight: 600 }}>Billing →</Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }} className="wallet-stat-grid">
              {[
                { label: "Total Spent",       value: fmt(totalSpent),   color: "var(--foreground)", note: "completed orders" },
                { label: "In Escrow",         value: fmt(buyerEscrow),  color: buyerEscrow  > 0 ? "#f59e0b" : "var(--foreground)", note: "active & funded" },
                { label: "Pending Approval",  value: fmt(buyerPending), color: buyerPending > 0 ? "#6366f1" : "var(--foreground)", note: "awaiting your release" },
              ].map((s, i) => (
                <div key={s.label} style={{ padding: "1rem 1.25rem", borderRight: i < 2 ? "1px solid var(--card-border)" : "none" }}>
                  <div style={{ fontSize: "0.58rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: s.color, letterSpacing: "-0.02em", lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: 4 }}>{s.note}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ borderRadius: 14, border: "1px solid var(--card-border)", background: "var(--card-bg)", overflow: "hidden", marginTop: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--card-border)" }}>
              <span style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "var(--text-muted)" }}>Wallet & Earnings</span>
              <Link href="/orders" style={{ fontSize: "0.65rem", color: "#14b8a6", textDecoration: "none", fontWeight: 600 }}>Orders →</Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }} className="wallet-stat-grid">
              {[
                { label: "Available Earnings", value: fmt(totalEarned),  color: totalEarned   > 0 ? "#22c55e" : "var(--foreground)", note: "after 10% platform fee" },
                { label: "Escrow Held",        value: fmt(sellerEscrow), color: sellerEscrow  > 0 ? "#f59e0b" : "var(--foreground)", note: "work in progress" },
                { label: "Pending Payout",     value: fmt(pendingPayout),color: pendingPayout > 0 ? "#6366f1" : "var(--foreground)", note: "delivered, awaiting release" },
              ].map((s, i) => (
                <div key={s.label} style={{ padding: "1rem 1.25rem", borderRight: i < 2 ? "1px solid var(--card-border)" : "none" }}>
                  <div style={{ fontSize: "0.58rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: s.color, letterSpacing: "-0.02em", lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: 4 }}>{s.note}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

// ── Types ──
interface OrderShape {
  id: string; amount: number; status: string;
  buyerId: string; sellerId: string;
  gig: { title: string } | null;
}
interface ConvoShape {
  id: string; participants: string[];
  messages: { body: string; senderId: string }[];
}
interface DashboardData {
  userId: string;
  dbUser: any;
  recentConvos: ConvoShape[];
  activeOrders: OrderShape[];
  completedOrders: { amount: number }[];
  completedBuyerOrders: { amount: number }[];
  profileViewCount: number;
  unreadMessageCount: number;
  totalConvoCount: number;
  postedJobs: any[];
  sentOffers: any[];
  otherByConvo: Record<string, { id: string; name: string | null; twitterHandle: string; image: string | null } | undefined>;
}
