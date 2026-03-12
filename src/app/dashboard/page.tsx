import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/ui/LogoutButton";
import EditProfileForm from "@/components/forms/EditProfileForm";
import LinkWallet from "@/components/forms/LinkWallet";
import ReleaseFundsButton from "./ReleaseFundsButton";
import MarkAsDeliveredButton from "./MarkAsDeliveredButton";
import db from "@/lib/db";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.userId) redirect("/login");

  console.log("DB Models:", Object.keys(db).filter(k => !k.startsWith("_")));

  const [dbUserRaw, buyerOrdersRaw, sellerOrdersRaw] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.userId },
    }),
    db.order.findMany({
      where: { buyerId: session.user.userId },
      include: { gig: true, seller: true },
      orderBy: { createdAt: "desc" },
    }),
    db.order.findMany({
      where: { sellerId: session.user.userId },
      include: { gig: true, buyer: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!dbUserRaw) redirect("/login");

  // Serialize dates for Client Components
  const dbUser = JSON.parse(JSON.stringify(dbUserRaw));
  const buyerOrders = JSON.parse(JSON.stringify(buyerOrdersRaw));
  const sellerOrders = JSON.parse(JSON.stringify(sellerOrdersRaw));

  return (
    <main className="page">
      <section className="auth-wrap">
        <div className="auth-card" style={{ maxWidth: 720, width: "100%" }}>

          <div className="dash-badge">
            <span className="dash-badge-dot" />
            Early Access
          </div>

          <div className="auth-kicker">— CREWBOARD</div>
          <h1 className="auth-title">Dashboard</h1>

          {/* Profile row */}
          <div className="dash-profile">
            <div className="dash-avatar">
              {dbUser.image ? (
                <img className="dash-avatar-img" src={dbUser.image} alt="avatar" />
              ) : (
                <div className="dash-avatar-fallback" />
              )}
            </div>
            <div className="dash-meta">
              <div className="dash-name">{dbUser.name ?? "User"}</div>
              <div className="dash-handle">@{dbUser.twitterHandle}</div>
              <div className="dash-sub">Verified via X · Session active</div>
            </div>
            {dbUser.role && (
              <div className="dash-role-badge">{dbUser.role}</div>
            )}
          </div>

          {dbUser.bio && (
            <p className="dash-bio">{dbUser.bio}</p>
          )}

          {dbUser.skills.length > 0 && (
            <div className="dash-skills">
              {dbUser.skills.map((s: string) => (
                <span key={s} className="dash-skill-chip">{s}</span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="dash-stats">
            <div className="dash-stat">
              <div className="dash-stat-value">—</div>
              <div className="dash-stat-label">Reputation</div>
            </div>
            <div className="dash-stat">
              <div className="dash-stat-value">{buyerOrders.length + sellerOrders.length}</div>
              <div className="dash-stat-label">Orders</div>
            </div>
            <div className="dash-stat">
              <div className="dash-stat-value">0</div>
              <div className="dash-stat-label">Crew</div>
            </div>
            <LinkWallet currentWallet={dbUser.walletAddress} />
          </div>

          <div className="dash-divider" />

          {/* Orders Section */}
          {(buyerOrders.length > 0 || sellerOrders.length > 0) && (
            <>
              <div className="dash-section-label">Active Orders</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
                {/* As Buyer */}
                {buyerOrders.map((order: any) => (
                  <div key={order.id} className="profile-gig-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div className="profile-gig-top">
                        <span className="gig-category-badge" style={{ fontSize: "0.6rem" }}>BUYING</span>
                        <span className={`gig-category-badge status-${order.status}`} style={{ fontSize: "0.6rem", background: order.status === "funded" ? "#2DD4BF" : "#f59e0b", color: "#000" }}>
                          {order.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="profile-gig-title">{order.gig.title}</div>
                      <div className="profile-gig-meta">Seller: @{order.seller.twitterHandle} • ${order.amount}</div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {order.status === "pending" && (
                        <Link href={`/orders/${order.id}/pay`} className="btn-primary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem", height: "auto" }}>
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
                  <div key={order.id} className="profile-gig-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div className="profile-gig-top">
                        <span className="gig-category-badge" style={{ fontSize: "0.6rem", background: "rgba(0,0,0,0.05)" }}>SELLING</span>
                        <span className={`gig-category-badge status-${order.status}`} style={{ fontSize: "0.6rem", background: order.status === "funded" || order.status === "delivered" ? "#2DD4BF" : "#f59e0b", color: "#000" }}>
                          {order.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="profile-gig-title">{order.gig.title}</div>
                      <div className="profile-gig-meta">Buyer: @{order.buyer.twitterHandle} • ${order.amount}</div>
                    </div>
                    {order.status === "funded" && (
                      <MarkAsDeliveredButton orderId={order.id} />
                    )}
                  </div>
                ))}
              </div>
              <div className="dash-divider" />
            </>
          )}

          <div className="dash-section-label">Quick Actions</div>
          <div className="dash-actions">
            <Link href="/talent" className="btn-secondary">Explore Talent</Link>
            <Link href="/gigs" className="btn-secondary">Browse Gigs</Link>
            <Link href="/gigs/new" className="btn-secondary">+ Post a Gig</Link>
            <Link href={`/u/${dbUser.twitterHandle}`} className="btn-secondary">My Profile</Link>
          </div>

          <div className="dash-divider" />

          <EditProfileForm
            initialRole={dbUser.role ?? ""}
            initialSkills={dbUser.skills}
            initialBio={dbUser.bio ?? ""}
            initialAvailability={dbUser.availability ?? "available"}
          />

          <div className="dash-divider" />

          <LogoutButton />
        </div>
      </section>
    </main>
  );
}
