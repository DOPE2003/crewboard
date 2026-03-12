import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import db from "@/lib/db";
import LinkWallet from "@/components/forms/LinkWallet";
import ReleaseFundsButton from "./ReleaseFundsButton";
import MarkAsDeliveredButton from "./MarkAsDeliveredButton";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.userId) redirect("/login");

  const userId = session.user.userId;

  const [dbUserRaw, notifications, recentConvos, buyerOrdersRaw, sellerOrdersRaw] = await Promise.all([
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
      where: { buyerId: userId },
      include: { gig: true, seller: true },
      orderBy: { createdAt: "desc" },
    }),
    db.order.findMany({
      where: { sellerId: userId },
      include: { gig: true, buyer: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!dbUserRaw) redirect("/login");

  // Serialize for Client Components
  const dbUser = JSON.parse(JSON.stringify(dbUserRaw));
  const buyerOrders = JSON.parse(JSON.stringify(buyerOrdersRaw));
  const sellerOrders = JSON.parse(JSON.stringify(sellerOrdersRaw));

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
    <main style={{ minHeight: "100vh", paddingTop: "8.5rem", paddingLeft: "1.5rem", paddingRight: "1.5rem", paddingBottom: "5rem" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#0f172a" }}>
              Welcome back, {dbUser.name?.split(" ")[0] ?? "Builder"}
            </h1>
            <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 3 }}>
              Here&apos;s what&apos;s happening on Crewboard today.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
            <Link href={`/u/${dbUser.twitterHandle}`} style={{
              fontSize: "0.75rem", fontWeight: 600, padding: "7px 16px", borderRadius: 99,
              border: "1px solid rgba(0,0,0,0.12)", color: "#0f172a", textDecoration: "none",
            }}>
              View Profile
            </Link>
            <Link href="/gigs/new" style={{
              fontSize: "0.75rem", fontWeight: 700, padding: "7px 16px", borderRadius: 99,
              background: "#0f172a", color: "#fff", textDecoration: "none",
            }}>
              + Post a Gig
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem", marginBottom: "1.5rem" }} className="dash-stats-grid">
          {[
            { label: "Active Gigs",  value: dbUser.gigs.length },
            { label: "Orders",      value: buyerOrders.length + sellerOrders.length },
            { label: "Projects",     value: 0 },
            { label: "Applications", value: 0 },
          ].map((s) => (
            <div key={s.label} style={{ borderRadius: 14, padding: "1.1rem 1.25rem", background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
              <div style={{ fontFamily: "Space Mono,monospace", fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>{s.value}</div>
              <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Wallet Link Section (Integrated into the new layout) */}
        <div style={{ marginBottom: "1.5rem" }}>
          <LinkWallet currentWallet={dbUser.walletAddress} />
        </div>

        {/* Active Orders Section */}
        {(buyerOrders.length > 0 || sellerOrders.length > 0) && (
          <div style={{ borderRadius: 14, padding: "1.1rem 1.25rem", background: "#fff", border: "1px solid rgba(0,0,0,0.07)", marginBottom: "1.5rem" }}>
            <div style={{ fontFamily: "Space Mono,monospace", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8", marginBottom: "1.25rem" }}>Active Orders</div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* As Buyer */}
              {buyerOrders.map((order: any) => (
                <div key={order.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", borderRadius: 12, background: "#f8fafc", border: "1px solid rgba(0,0,0,0.03)" }}>
                  <div>
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.4rem" }}>
                      <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "rgba(0,0,0,0.05)" }}>BUYING</span>
                      <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: order.status === "funded" || order.status === "delivered" ? "#ccfbf1" : "#fef3c7", color: order.status === "funded" || order.status === "delivered" ? "#0f766e" : "#92400e" }}>
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0f172a" }}>{order.gig.title}</div>
                    <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: 2 }}>Seller: @{order.seller.twitterHandle} • ${order.amount}</div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {order.status === "pending" && (
                      <Link href={`/orders/${order.id}/pay`} style={{ fontSize: "0.75rem", fontWeight: 700, padding: "6px 14px", borderRadius: 8, background: "#0f172a", color: "#fff", textDecoration: "none" }}>
                        PAY NOW
                      </Link>
                    )}
                    {(order.status === "funded" || order.status === "delivered") && (
                      <ReleaseFundsButton 
                        orderId={order.id} 
                        sellerWallet={order.seller.walletAddress} 
                        amount={order.amount} 
                      />
                    )}
                  </div>
                </div>
              ))}

              {/* As Seller */}
              {sellerOrders.map((order: any) => (
                <div key={order.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", borderRadius: 12, background: "#f8fafc", border: "1px solid rgba(0,0,0,0.03)" }}>
                  <div>
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.4rem" }}>
                      <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "rgba(0,0,0,0.05)" }}>SELLING</span>
                      <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: order.status === "funded" || order.status === "delivered" ? "#ccfbf1" : "#fef3c7", color: order.status === "funded" || order.status === "delivered" ? "#0f766e" : "#92400e" }}>
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0f172a" }}>{order.gig.title}</div>
                    <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: 2 }}>Buyer: @{order.buyer.twitterHandle} • ${order.amount}</div>
                  </div>
                  {order.status === "funded" && (
                    <MarkAsDeliveredButton orderId={order.id} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notifications + Messages */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }} className="dash-two-col">
          <div style={{ borderRadius: 14, padding: "1.1rem 1.25rem", background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.9rem" }}>
              <span style={{ fontFamily: "Space Mono,monospace", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8" }}>Notifications</span>
              <Link href="/notifications" style={{ fontSize: "0.65rem", color: "#2DD4BF", textDecoration: "none", fontWeight: 600 }}>View all</Link>
            </div>
            {notifications.length === 0 ? (
              <div style={{ fontSize: "0.75rem", color: "#cbd5e1" }}>No new notifications</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {notifications.map((n) => (
                  <div key={n.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2DD4BF", flexShrink: 0, marginTop: 5 }} />
                    <div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#0f172a" }}>{n.title}</div>
                      <div style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: 1 }}>{n.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ borderRadius: 14, padding: "1.1rem 1.25rem", background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.9rem" }}>
              <span style={{ fontFamily: "Space Mono,monospace", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8" }}>Messages</span>
              <Link href="/messages" style={{ fontSize: "0.65rem", color: "#2DD4BF", textDecoration: "none", fontWeight: 600 }}>View all</Link>
            </div>
            {recentConvos.length === 0 ? (
              <div style={{ fontSize: "0.75rem", color: "#cbd5e1" }}>No messages yet</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {recentConvos.map((c) => {
                  const last = c.messages[0];
                  if (!last) return null;
                  const other = otherByConvo[c.id];
                  return (
                    <Link key={c.id} href={`/messages/${c.id}`} style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#e2e8f0", overflow: "hidden", flexShrink: 0 }}>
                        {other?.image && <img src={other.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "0.73rem", fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {other?.name ?? other?.twitterHandle ?? "Unknown"}
                        </div>
                        <div style={{ fontSize: "0.63rem", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {last.body.slice(0, 40)}{last.body.length > 40 ? "…" : ""}
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
        <div style={{ borderRadius: 14, padding: "1.1rem 1.25rem", background: "#fff", border: "1px solid rgba(0,0,0,0.07)", marginBottom: "1.25rem" }}>
          <div style={{ fontFamily: "Space Mono,monospace", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8", marginBottom: "0.75rem" }}>Availability</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: availabilityColor, boxShadow: `0 0 6px ${availabilityColor}` }} />
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#0f172a", textTransform: "capitalize" }}>{dbUser.availability ?? "available"}</span>
          </div>
          <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: 6 }}>Update in your profile settings</div>
        </div>

      </div>
    </main>
  );
}
