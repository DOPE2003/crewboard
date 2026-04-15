import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import db from "@/lib/db";
import T from "@/components/ui/T";
import OnboardingChecklist from "@/components/ui/OnboardingChecklist";
import NotificationEmailForm from "@/components/ui/NotificationEmailForm";
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

  const onboardingStatus = {
    needsAvatar: !dbUser.twitterId && !dbUser.image,
    needsCv: !dbUser.cvUrl,
    needsWallet: !dbUser.walletAddress,
    needsGig: totalGigCount === 0,
  };

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

  const availabilityColor =
    dbUser.availability === "available" ? "#22c55e" :
    dbUser.availability === "open"      ? "#f59e0b" : "#ef4444";

  const firstName = dbUser.name?.split(" ")[0] ?? "Builder";

  return (
    <main className="dash-main-wrap mf-page" style={{ minHeight: "100vh", paddingBottom: "5rem" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Onboarding checklist */}
        <OnboardingChecklist status={onboardingStatus} handle={dbUser.twitterHandle ?? ""} />

        {/* Notification email — shown for Twitter users without an email */}
        {!dbUser.email && (
          <NotificationEmailForm currentEmail={dbUser.email ?? null} />
        )}

        {/* Profile visibility banner */}
        {!profileScore.meetsThreshold && (
          <div style={{
            marginBottom: "1.5rem", padding: "1rem 1.25rem", borderRadius: 12,
            background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.3)",
            display: "flex", alignItems: "flex-start", gap: "0.85rem",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--foreground)", marginBottom: "0.25rem" }}>
                Your profile is {profileScore.score}% complete — not visible in talent search
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "0.6rem" }}>
                Reach {PROFILE_SCORE_THRESHOLD}% to appear in the talent marketplace. Missing:{" "}
                {[
                  !profileScore.breakdown.bio      && "bio",
                  !profileScore.breakdown.avatar   && "avatar",
                  !profileScore.breakdown.skills   && "skills",
                  !profileScore.breakdown.services && "at least 1 service",
                  !profileScore.breakdown.wallet   && "wallet",
                ].filter(Boolean).join(", ")}.
              </div>
              <div style={{ height: 6, borderRadius: 99, background: "rgba(245,158,11,0.15)", overflow: "hidden", maxWidth: 280 }}>
                <div style={{
                  height: "100%", width: `${profileScore.score}%`, borderRadius: 99,
                  background: profileScore.score >= 50 ? "#f59e0b" : "#ef4444",
                  transition: "width 0.4s ease",
                }} />
              </div>
              <div style={{ marginTop: "0.6rem", display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link href={`/u/${dbUser.twitterHandle}`} style={{ fontSize: "0.72rem", fontWeight: 600, color: "#f59e0b", textDecoration: "none" }}>
                  Complete profile →
                </Link>
                {!profileScore.breakdown.services && (
                  <Link href="/gigs/new" style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textDecoration: "none" }}>
                    Add a service →
                  </Link>
                )}
                {!profileScore.breakdown.wallet && (
                  <Link href="/settings" style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textDecoration: "none" }}>
                    Connect wallet →
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── HEADER ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>
              Welcome back, {firstName}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: 6, flexWrap: "wrap" }}>
              {activeOrders.length > 0 && (
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
                  {activeOrders.length} active order{activeOrders.length !== 1 ? "s" : ""}
                </span>
              )}
              {pendingPaymentOrders.length > 0 && (
                <span style={{ fontSize: "0.72rem", color: "#22c55e", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                  {pendingPaymentOrders.length} payment{pendingPaymentOrders.length !== 1 ? "s" : ""} pending
                </span>
              )}
              {unreadMessageCount > 0 && (
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", display: "inline-block" }} />
                  {unreadMessageCount} unread message{unreadMessageCount !== 1 ? "s" : ""}
                </span>
              )}
              {activeOrders.length === 0 && pendingPaymentOrders.length === 0 && unreadMessageCount === 0 && (
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>All caught up</span>
              )}
            </div>
          </div>
          <div className="dash-header-actions" style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
            <Link href={`/u/${dbUser.twitterHandle}`} style={{
              fontSize: "0.75rem", fontWeight: 600, padding: "7px 16px", borderRadius: 99,
              border: "1px solid var(--card-border)", color: "var(--foreground)", textDecoration: "none",
            }}>
              <T k="dash.viewProfile" />
            </Link>
            <Link href="/gigs/new" style={{
              fontSize: "0.75rem", fontWeight: 700, padding: "7px 16px", borderRadius: 99,
              background: "var(--foreground)", color: "var(--dropdown-bg)", textDecoration: "none",
            }}>
              <T k="dash.postGig" />
            </Link>
          </div>
        </div>

        {/* ── BALANCE SECTION ── */}
        <div style={{
          borderRadius: 16, padding: "1.4rem 1.5rem", marginBottom: "1.25rem",
          background: "linear-gradient(135deg, rgba(20,184,166,0.06) 0%, rgba(99,102,241,0.06) 100%)",
          border: "1px solid rgba(20,184,166,0.2)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
              </svg>
              <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "#14b8a6" }}>Wallet & Escrow</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.65rem", color: "var(--text-muted)" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Funds secured on-chain via Solana escrow
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" }} className="balance-grid">
            <div>
              <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 4 }}>Total Earned</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--foreground)", fontFamily: "Inter, sans-serif", letterSpacing: "-0.02em" }}>{formatUSD(totalEarned)}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 4 }}>In Escrow</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: escrowAmount > 0 ? "#f59e0b" : "var(--foreground)", fontFamily: "Inter, sans-serif", letterSpacing: "-0.02em" }}>{formatUSD(escrowAmount)}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 4 }}>Pending Release</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: pendingPaymentOrders.length > 0 ? "#22c55e" : "var(--foreground)", fontFamily: "Inter, sans-serif", letterSpacing: "-0.02em" }}>
                {formatUSD(pendingPaymentOrders.reduce((s, o) => s + o.amount, 0))}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="dash-balance-actions" style={{ display: "flex", gap: "0.6rem", marginTop: "1.1rem", flexWrap: "wrap" }}>
            <Link href="/orders" style={{
              fontSize: "0.72rem", fontWeight: 700, padding: "6px 14px", borderRadius: 99,
              background: "var(--foreground)", color: "var(--dropdown-bg)", textDecoration: "none",
            }}>
              View Orders
            </Link>
            <Link href="/messages" style={{
              fontSize: "0.72rem", fontWeight: 600, padding: "6px 14px", borderRadius: 99,
              border: "1px solid var(--card-border)", color: "var(--foreground)", textDecoration: "none",
            }}>
              Continue Chat
            </Link>
            <Link href="/settings" style={{
              fontSize: "0.72rem", fontWeight: 600, padding: "6px 14px", borderRadius: 99,
              border: "1px solid rgba(20,184,166,0.35)", color: "#14b8a6", textDecoration: "none",
            }}>
              Withdraw Earnings
            </Link>
          </div>
        </div>

        {/* ── ORDERS + STATS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem", marginBottom: "1.25rem" }} className="dash-stats-grid">
          {([
            { label: "Active Services", value: dbUser.gigs.length },
            { label: "Active Orders",   value: activeOrders.length },
            { label: "Completed",       value: completedOrders.length },
            { label: "Profile Views",   value: profileViewCount },
          ]).map((s) => (
            <div key={s.label} style={{ borderRadius: 14, padding: "1.1rem 1.25rem", background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--foreground)" }}>{s.value}</div>
              <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── MESSAGES + NOTIFICATIONS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }} className="dash-two-col">

          {/* Messages */}
          <div style={{ borderRadius: 14, padding: "1.1rem 1.25rem", background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.9rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "var(--text-muted)" }}>
                  <T k="dash.messages" />
                </span>
                {unreadMessageCount > 0 && (
                  <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "#fff", background: "#6366f1", borderRadius: 99, padding: "1px 6px", lineHeight: 1.6 }}>
                    {unreadMessageCount}
                  </span>
                )}
              </div>
              <Link href="/messages" style={{ fontSize: "0.65rem", color: "#2DD4BF", textDecoration: "none", fontWeight: 600 }}>
                <T k="dash.viewAll" />
              </Link>
            </div>
            {recentConvos.length === 0 ? (
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}><T k="dash.noMessages" /></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {recentConvos.map((c) => {
                  const last = c.messages[0];
                  if (!last) return null;
                  const other = otherByConvo[c.id];
                  return (
                    <Link key={c.id} href={`/messages/${c.id}`} style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--avatar-bg)", overflow: "hidden", flexShrink: 0 }}>
                        {other?.image && <img src={other.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "0.73rem", fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {other?.name ?? other?.twitterHandle ?? "Unknown"}
                        </div>
                        <div style={{ fontSize: "0.63rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {msgPreview(last.body, 40)}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div style={{ borderRadius: 14, padding: "1.1rem 1.25rem", background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.9rem" }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "var(--text-muted)" }}>
                <T k="dash.notifications" />
              </span>
              <Link href="/notifications" style={{ fontSize: "0.65rem", color: "#2DD4BF", textDecoration: "none", fontWeight: 600 }}>
                <T k="dash.viewAll" />
              </Link>
            </div>
            {notifications.length === 0 ? (
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}><T k="dash.noNotifications" /></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {notifications.map((n) => (
                  <div key={n.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2DD4BF", flexShrink: 0, marginTop: 5 }} />
                    <div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--foreground)" }}>{n.title}</div>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: 1 }}>{n.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── AVAILABILITY ── */}
        <div style={{ borderRadius: 14, padding: "1rem 1.25rem", background: "var(--card-bg)", border: "1px solid var(--card-border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: availabilityColor, boxShadow: `0 0 6px ${availabilityColor}`, flexShrink: 0 }} />
            <div>
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--foreground)", textTransform: "capitalize" }}>{dbUser.availability ?? "available"}</span>
              <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginLeft: 6 }}>· <T k="dash.updateProfile" /></span>
            </div>
          </div>
          <Link href={`/u/${dbUser.twitterHandle}`} style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textDecoration: "none" }}>
            Edit profile →
          </Link>
        </div>

      </div>

      <style>{`
        .balance-grid { grid-template-columns: repeat(3,1fr); }
        @media (max-width: 600px) { .balance-grid { grid-template-columns: 1fr 1fr; } }
      `}</style>
    </main>
  );
}
