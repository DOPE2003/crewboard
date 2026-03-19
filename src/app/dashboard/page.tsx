import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import db from "@/lib/db";
import T from "@/components/ui/T";
import OnboardingChecklist from "@/components/ui/OnboardingChecklist";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.userId) redirect("/login");

  const userId = session.user.userId;

  const [dbUserRaw, notifications, recentConvos, activeOrderCount, completedOrderCount, profileViewCount, totalGigCount] = await Promise.all([
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
    db.order.count({ where: { OR: [{ buyerId: userId }, { sellerId: userId }], status: { in: ["pending", "funded", "delivered"] } } }),
    db.order.count({ where: { OR: [{ buyerId: userId }, { sellerId: userId }], status: "completed" } }),
    db.notification.count({ where: { userId, type: "profile_view" } }),
    db.gig.count({ where: { userId } }),
  ]);

  if (!dbUserRaw) redirect("/login");

  const dbUser = JSON.parse(JSON.stringify(dbUserRaw));

  const onboardingStatus = {
    // Only nudge email-signup users — Twitter users get avatar auto-set from X
    needsAvatar: !dbUser.twitterId && !dbUser.image,
    needsCv: !dbUser.cvUrl,
    needsWallet: !dbUser.walletAddress,
    needsGig: totalGigCount === 0,
  };

  // Fetch the other participant for each conversation
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

  return (
    <main className="dash-main-wrap" style={{ minHeight: "100vh", paddingLeft: "1.5rem", paddingRight: "1.5rem", paddingBottom: "5rem" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

          {/* Onboarding checklist — shown until all 4 items complete */}
        <OnboardingChecklist status={onboardingStatus} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--foreground)" }}>
              <T k="dash.welcome" />, {dbUser.name?.split(" ")[0] ?? <T k="dash.builder" />}
            </h1>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 3 }}>
              <T k="dash.subtitle" />
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
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

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem", marginBottom: "1.5rem" }} className="dash-stats-grid">
          {([
            { label: "Active Gigs",      value: dbUser.gigs.length },
            { label: "Active Orders",    value: activeOrderCount },
            { label: "Completed",        value: completedOrderCount },
            { label: "Profile Views",    value: profileViewCount },
          ]).map((s) => (
            <div key={s.label} style={{ borderRadius: 14, padding: "1.1rem 1.25rem", background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--foreground)" }}>{s.value}</div>
              <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Notifications + Messages */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }} className="dash-two-col">
          <div style={{ borderRadius: 14, padding: "1.1rem 1.25rem", background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.9rem" }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)" }}><T k="dash.notifications" /></span>
              <Link href="/notifications" style={{ fontSize: "0.65rem", color: "#2DD4BF", textDecoration: "none", fontWeight: 600 }}><T k="dash.viewAll" /></Link>
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

          <div style={{ borderRadius: 14, padding: "1.1rem 1.25rem", background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.9rem" }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)" }}><T k="dash.messages" /></span>
              <Link href="/messages" style={{ fontSize: "0.65rem", color: "#2DD4BF", textDecoration: "none", fontWeight: 600 }}><T k="dash.viewAll" /></Link>
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
                          {last.body.startsWith("__GIGREQUEST__:")
                            ? (() => { try { return "Gig Request: " + JSON.parse(last.body.slice(15)).title; } catch { return "Gig Request"; } })()
                            : last.body.slice(0, 40) + (last.body.length > 40 ? "…" : "")}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Availability */}
        <div style={{ borderRadius: 14, padding: "1.1rem 1.25rem", background: "var(--card-bg)", border: "1px solid var(--card-border)", marginBottom: "1.25rem" }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.75rem" }}><T k="dash.availability" /></div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: availabilityColor, boxShadow: `0 0 6px ${availabilityColor}` }} />
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--foreground)", textTransform: "capitalize" }}>{dbUser.availability ?? "available"}</span>
          </div>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 6 }}><T k="dash.updateProfile" /></div>
        </div>

      </div>
    </main>
  );
}
