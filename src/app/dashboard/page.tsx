import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import db from "@/lib/db";
import T from "@/components/ui/T";
import { computeProfileScore, PROFILE_SCORE_THRESHOLD } from "@/lib/profileScore";

function msgPreview(body: string, maxLen = 40): string {
  if (body.startsWith("__GIGREQUEST__:")) {
    try { return "Service Request: " + JSON.parse(body.slice("__GIGREQUEST__:".length)).title; }
    catch { return "Service Request"; }
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

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.userId) redirect("/login");

  const userId = session.user.userId;

  const [
    dbUserRaw,
    notifications,
    recentConvos,
    activeOrders,
    completedOrders,
    profileViewCount,
    totalGigCount,
    unreadMessageCount,
    totalConvoCount,
  ] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      include: { gigs: { where: { status: "active" } } },
    }),
    db.notification.findMany({
      where: { userId, read: false },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.conversation.findMany({
      where: { participants: { has: userId } },
      orderBy: { updatedAt: "desc" },
      take: 3,
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { select: { id: true, name: true, twitterHandle: true, image: true } } },
        },
      },
    }),
    db.order.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }], status: { in: ["pending", "funded", "delivered"] } },
      select: { id: true, amount: true, status: true, buyerId: true, sellerId: true, gig: { select: { title: true } } },
    }),
    db.order.findMany({
      where: { sellerId: userId, status: "completed" },
      select: { amount: true },
    }),
    db.notification.count({ where: { userId, type: "profile_view" } }),
    db.gig.count({ where: { userId } }),
    db.notification.count({ where: { userId, read: false, type: { not: "profile_view" } } }),
    db.conversation.count({ where: { participants: { has: userId } } }),
  ]);

  if (!dbUserRaw) redirect("/login");

  const dbUser = JSON.parse(JSON.stringify(dbUserRaw));

  // Balance calculations (amounts stored as whole dollars)
  const escrowAmount = activeOrders
    .filter((o) => o.status === "funded" && (o.buyerId === userId || o.sellerId === userId))
    .reduce((sum, o) => sum + o.amount, 0);
  const grossEarned = completedOrders.reduce((sum, o) => sum + o.amount, 0);
  const totalEarned = grossEarned - Math.floor(grossEarned * 0.10);
  const formatUSD = (amount: number) =>
    amount === 0 ? "$0" : `$${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const pendingPaymentOrders = activeOrders.filter(
    (o) => o.status === "delivered" && o.sellerId === userId
  );

  const profileScore = computeProfileScore({
    bio: dbUser.bio,
    image: dbUser.image,
    skills: dbUser.skills,
    gigCount: dbUser.gigs?.length ?? totalGigCount,
    walletAddress: dbUser.walletAddress,
  });

  // Fetch other participants for recent conversations
  const otherParticipantIds = recentConvos.flatMap((c) =>
    c.participants.filter((p) => p !== userId)
  );
  const otherParticipants = otherParticipantIds.length
    ? await db.user.findMany({
        where: { id: { in: otherParticipantIds } },
        select: { id: true, name: true, twitterHandle: true, image: true },
      })
    : [];
  const otherByConvo: Record<string, typeof otherParticipants[0] | undefined> = {};
  for (const c of recentConvos) {
    const otherId = c.participants.find((p) => p !== userId);
    otherByConvo[c.id] = otherId ? otherParticipants.find((u) => u.id === otherId) : undefined;
  }

  const isClient = dbUser.userTitle === "Client";
  const showProfileCard = !isClient && !profileScore.meetsThreshold;

  // Contextual next-action for users with a complete profile
  const nextAction: { label: string; href: string; sub: string } | null = (() => {
    if (showProfileCard) return null;
    if (isClient && activeOrders.length === 0)
      return { label: "Post a job", href: "/jobs/new", sub: "Find the right freelancer for your project." };
    if (!isClient && dbUser.gigs.length === 0)
      return { label: "Add your first service", href: "/gigs/new", sub: "List what you offer so clients can hire you directly." };
    if (activeOrders.length > 0)
      return { label: `View ${activeOrders.length} active order${activeOrders.length !== 1 ? "s" : ""}`, href: "/orders", sub: pendingPaymentOrders.length > 0 ? `${pendingPaymentOrders.length} payment pending release.` : "Keep things moving." };
    return { label: "Browse open jobs", href: "/jobs", sub: "Find work that matches your skills." };
  })();

  const missingItems = [
    !profileScore.breakdown.bio      && "bio",
    !profileScore.breakdown.avatar   && "avatar",
    !profileScore.breakdown.skills   && "skills",
    !profileScore.breakdown.services && "at least 1 service",
    !profileScore.breakdown.wallet   && "wallet",
  ].filter(Boolean) as string[];

  // First Job Accelerator
  const showAccelerator = !isClient && completedOrders.length === 0;
  const acceleratorSteps = [
    {
      label: "Complete your profile",
      sub: "Reach 70% to appear in talent search",
      cta: "Complete",
      href: `/u/${dbUser.twitterHandle}`,
      done: profileScore.meetsThreshold,
    },
    {
      label: "Add your first service",
      sub: "Let clients know what you offer and at what price",
      cta: "Add service",
      href: "/gigs/new",
      done: dbUser.gigs.length > 0,
    },
    {
      label: "Send your first message",
      sub: "Reach out to a client or respond to a job posting",
      cta: "Open chat",
      href: "/messages",
      done: totalConvoCount > 0,
    },
    {
      label: "Apply to 3 jobs",
      sub: "Message clients on the job board to pitch yourself",
      cta: "Browse jobs",
      href: "/jobs",
      done: totalConvoCount >= 3,
    },
  ];
  const accelDone = acceleratorSteps.filter(s => s.done).length;
  const accelTotal = acceleratorSteps.length;
  const accelComplete = accelDone === accelTotal;

  return (
    <main className="dash-main-wrap mf-page" style={{ minHeight: "100vh", paddingBottom: "5rem" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* ── 1. PROFILE COMPLETION HERO ── */}
        {showProfileCard && (
          <div style={{
            marginBottom: "1.5rem", borderRadius: 16, overflow: "hidden",
            border: "1px solid rgba(245,158,11,0.35)",
            background: "var(--card-bg)",
          }}>
            {/* Accent bar */}
            <div style={{ height: 4, background: `linear-gradient(90deg, #f59e0b ${profileScore.score}%, var(--card-border) ${profileScore.score}%)` }} />

            <div style={{ padding: "1.5rem 1.75rem" }}>
              {/* Label */}
              <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "#f59e0b", marginBottom: "0.5rem" }}>
                Profile — {profileScore.score}% complete
              </div>

              {/* Headline */}
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--foreground)", margin: "0 0 0.35rem", lineHeight: 1.25 }}>
                Complete your profile to start getting clients.
              </h2>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0 0 1.1rem", lineHeight: 1.6 }}>
                You won&apos;t appear in search until it&apos;s done.{" "}
                {missingItems.length > 0 && (
                  <span>Still missing: <strong style={{ color: "var(--foreground)" }}>{missingItems.join(", ")}</strong>.</span>
                )}
              </p>

              {/* Progress bar */}
              <div style={{ height: 6, borderRadius: 99, background: "rgba(245,158,11,0.12)", overflow: "hidden", maxWidth: 320, marginBottom: "1.25rem" }}>
                <div style={{
                  height: "100%", width: `${profileScore.score}%`, borderRadius: 99,
                  background: profileScore.score >= 60 ? "#f59e0b" : "#ef4444",
                  transition: "width 0.4s",
                }} />
              </div>

              {/* CTAs */}
              <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap", alignItems: "center" }}>
                <Link
                  href={`/u/${dbUser.twitterHandle}`}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "0.65rem 1.4rem", borderRadius: 10,
                    background: "#f59e0b", color: "#fff",
                    fontWeight: 700, fontSize: "0.85rem", textDecoration: "none",
                    boxShadow: "0 2px 10px rgba(245,158,11,0.28)",
                  }}
                >
                  Complete your profile →
                </Link>
                {!profileScore.breakdown.services && (
                  <Link href="/gigs/new" style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", textDecoration: "none" }}>
                    Add a service →
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── 2. NEXT ACTION CTA ── */}
        {nextAction && (
          <div style={{
            marginBottom: "1.5rem", borderRadius: 14, padding: "1.1rem 1.4rem",
            background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.2)",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap",
          }}>
            <div>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#14b8a6", marginBottom: 3 }}>
                Next step
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{nextAction.sub}</div>
            </div>
            <Link
              href={nextAction.href}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0,
                padding: "0.6rem 1.3rem", borderRadius: 10,
                background: "#14b8a6", color: "#fff",
                fontWeight: 700, fontSize: "0.82rem", textDecoration: "none",
                boxShadow: "0 2px 8px rgba(20,184,166,0.25)",
              }}
            >
              {nextAction.label} →
            </Link>
          </div>
        )}

        {/* ── 3. FIRST JOB ACCELERATOR ── */}
        {showAccelerator && (
          <div style={{
            marginBottom: "1.5rem", borderRadius: 14,
            border: accelComplete ? "1px solid rgba(34,197,94,0.35)" : "1px solid var(--card-border)",
            background: "var(--card-bg)", overflow: "hidden",
          }}>
            {/* Header */}
            <div style={{
              padding: "1rem 1.25rem",
              borderBottom: "1px solid var(--card-border)",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem",
            }}>
              <div>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: accelComplete ? "#22c55e" : "#14b8a6", marginBottom: 3 }}>
                  First Job Accelerator
                </div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: accelComplete ? "#22c55e" : "var(--foreground)" }}>
                  {accelComplete ? "You're ready to get hired" : "Land your first job faster"}
                </div>
              </div>

              {/* Progress pill */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
              }}>
                <div style={{ display: "flex", gap: 4 }}>
                  {acceleratorSteps.map((s, i) => (
                    <div key={i} style={{
                      width: 28, height: 4, borderRadius: 99,
                      background: s.done ? (accelComplete ? "#22c55e" : "#14b8a6") : "var(--card-border)",
                      transition: "background 0.3s",
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {accelDone}/{accelTotal}
                </span>
              </div>
            </div>

            {/* Steps */}
            <div style={{ padding: "0.35rem 0" }}>
              {acceleratorSteps.map((step, i) => (
                <Link
                  key={i}
                  href={step.done ? "#" : step.href}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.9rem",
                    padding: "0.7rem 1.25rem",
                    textDecoration: "none",
                    borderBottom: i < accelTotal - 1 ? "1px solid var(--card-border)" : "none",
                    opacity: step.done ? 0.6 : 1,
                    pointerEvents: step.done ? "none" : "auto",
                  }}
                >
                  {/* Check circle */}
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                    background: step.done ? (accelComplete ? "#22c55e" : "#14b8a6") : "transparent",
                    border: step.done ? "none" : "1.5px solid var(--card-border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.2s",
                  }}>
                    {step.done && (
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "0.82rem", fontWeight: step.done ? 500 : 600,
                      color: "var(--foreground)",
                      textDecoration: step.done ? "line-through" : "none",
                    }}>
                      {step.label}
                    </div>
                    {!step.done && (
                      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 1, lineHeight: 1.4 }}>
                        {step.sub}
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  {!step.done && (
                    <span style={{
                      fontSize: "0.72rem", fontWeight: 700, color: "#14b8a6",
                      flexShrink: 0, whiteSpace: "nowrap",
                    }}>
                      {step.cta} →
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Micro-copy footer */}
            <div style={{
              padding: "0.6rem 1.25rem",
              borderTop: "1px solid var(--card-border)",
              background: accelComplete ? "rgba(34,197,94,0.04)" : "rgba(20,184,166,0.03)",
            }}>
              <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: accelComplete ? "#22c55e" : "#14b8a6" }}>
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                {accelComplete
                  ? "All steps done — your profile is visible to clients and you're ready to be hired."
                  : "Freelancers who complete these steps get hired 3x faster."}
              </p>
            </div>
          </div>
        )}

        {/* ── 4. HEADER ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--foreground)", margin: 0, letterSpacing: "-0.02em" }}>
            Dashboard
          </h1>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <Link href={`/u/${dbUser.twitterHandle}`} style={{
              fontSize: "0.75rem", fontWeight: 600, padding: "6px 14px", borderRadius: 99,
              border: "1px solid var(--card-border)", color: "var(--foreground)", textDecoration: "none",
            }}>
              <T k="dash.viewProfile" />
            </Link>
            {!isClient && (
              <Link href="/gigs/new" style={{
                fontSize: "0.75rem", fontWeight: 700, padding: "6px 14px", borderRadius: 99,
                background: "var(--foreground)", color: "var(--dropdown-bg)", textDecoration: "none",
              }}>
                <T k="dash.postGig" />
              </Link>
            )}
            {isClient && (
              <Link href="/jobs/new" style={{
                fontSize: "0.75rem", fontWeight: 700, padding: "6px 14px", borderRadius: 99,
                background: "var(--foreground)", color: "var(--dropdown-bg)", textDecoration: "none",
              }}>
                Post a job
              </Link>
            )}
          </div>
        </div>

        {/* ── 4. STATS GRID ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem", marginBottom: "1.25rem" }} className="dash-stats-grid">
          {([
            { label: "Active Services", value: dbUser.gigs.length,        href: "/gigs"         },
            { label: "Active Orders",   value: activeOrders.length,        href: "/orders"        },
            { label: "Completed",       value: completedOrders.length,     href: "/orders?tab=completed" },
            { label: "Profile Views",   value: profileViewCount,           href: `/u/${dbUser.twitterHandle}` },
          ]).map((s) => (
            <Link key={s.label} href={s.href} style={{ textDecoration: "none" }}>
              <div style={{ borderRadius: 14, padding: "1rem 1.1rem", background: "var(--card-bg)", border: "1px solid var(--card-border)", transition: "border-color 0.15s" }}>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--foreground)", letterSpacing: "-0.02em" }}>{s.value}</div>
                <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginTop: 5 }}>{s.label}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── 5. MESSAGES ── */}
        <div style={{ borderRadius: 14, padding: "1.1rem 1.25rem", background: "var(--card-bg)", border: "1px solid var(--card-border)", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.9rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "var(--text-muted)" }}>
                Messages
              </span>
              {unreadMessageCount > 0 && (
                <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "#fff", background: "#6366f1", borderRadius: 99, padding: "1px 6px", lineHeight: 1.6 }}>
                  {unreadMessageCount}
                </span>
              )}
            </div>
            <Link href="/messages" style={{ fontSize: "0.65rem", color: "#14b8a6", textDecoration: "none", fontWeight: 600 }}>
              View all →
            </Link>
          </div>

          {recentConvos.length === 0 ? (
            <div style={{ padding: "1.25rem 0 0.25rem" }}>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0 0 0.75rem", lineHeight: 1.6 }}>
                No messages yet. Start by{" "}
                <Link href="/jobs" style={{ color: "#14b8a6", textDecoration: "none", fontWeight: 600 }}>applying to a job</Link>
                {" "}or{" "}
                <Link href="/gigs/new" style={{ color: "#14b8a6", textDecoration: "none", fontWeight: 600 }}>posting a service</Link>.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              {recentConvos.map((c) => {
                const last = c.messages[0];
                if (!last) return null;
                const other = otherByConvo[c.id];
                return (
                  <Link key={c.id} href={`/messages/${c.id}`} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", padding: "0.5rem 0.6rem", borderRadius: 10, transition: "background 0.12s" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--avatar-bg)", overflow: "hidden", flexShrink: 0, border: "1px solid var(--card-border)" }}>
                      {other?.image && <img src={other.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {other?.name ?? other?.twitterHandle ?? "Unknown"}
                      </div>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {msgPreview(last.body, 48)}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 6. WALLET — compact, low priority ── */}
        <div style={{
          borderRadius: 14, padding: "1rem 1.25rem",
          background: "var(--card-bg)", border: "1px solid var(--card-border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem" }}>
            <span style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "var(--text-muted)" }}>
              Earnings
            </span>
            <Link href="/orders" style={{ fontSize: "0.65rem", color: "#14b8a6", textDecoration: "none", fontWeight: 600 }}>
              View orders →
            </Link>
          </div>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 2 }}>Total earned</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--foreground)", letterSpacing: "-0.02em" }}>{formatUSD(totalEarned)}</div>
            </div>
            {escrowAmount > 0 && (
              <div>
                <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 2 }}>In escrow</div>
                <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#f59e0b", letterSpacing: "-0.02em" }}>{formatUSD(escrowAmount)}</div>
              </div>
            )}
            {pendingPaymentOrders.length > 0 && (
              <div>
                <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 2 }}>Pending release</div>
                <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#22c55e", letterSpacing: "-0.02em" }}>
                  {formatUSD(pendingPaymentOrders.reduce((s, o) => s + o.amount, 0))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
