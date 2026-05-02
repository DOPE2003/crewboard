import { requireStaff } from "@/lib/auth-utils";
import db from "@/lib/db";
import Link from "next/link";

export default async function AdminDisputesPage() {
  await requireStaff();

  const disputes = await db.order.findMany({
    where: { status: "disputed" },
    orderBy: { updatedAt: "desc" },
    include: {
      gig:    { select: { title: true, category: true } },
      buyer:  { select: { name: true, twitterHandle: true, walletAddress: true } },
      seller: { select: { name: true, twitterHandle: true, walletAddress: true } },
    },
  });

  return (
    <main className="page" style={{ background: "var(--background)", minHeight: "100vh" }}>
      <div className="admin-content">

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
          <div>
            <div style={{ fontSize: "0.6rem", letterSpacing: "0.2em", color: "#ef4444", marginBottom: "0.5rem", fontWeight: 700 }}>— DISPUTES</div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--foreground)" }}>Dispute Resolution</h1>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.4rem 0 0" }}>
              Review each dispute and resolve on-chain — refund the buyer or release to the seller.
            </p>
          </div>
          <Link href="/admin" style={{ fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "none", fontWeight: 600 }}>← Dashboard</Link>
        </div>

        {disputes.length === 0 ? (
          <div style={{ background: "var(--card-bg)", borderRadius: 16, border: "1px solid var(--card-border)", padding: "4rem", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>✓</div>
            <div style={{ fontWeight: 700, color: "var(--foreground)", marginBottom: "0.4rem" }}>No active disputes</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>All clear — no orders in dispute right now.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {disputes.map((order) => {
              const buyerMissing  = !order.buyer.walletAddress;
              const sellerMissing = !order.seller.walletAddress;
              const escrowMissing = !order.escrowAddress;
              const canResolve = !buyerMissing && !sellerMissing && !escrowMissing;

              return (
                <div key={order.id} style={{ background: "var(--card-bg)", borderRadius: 14, border: "1px solid rgba(239,68,68,0.3)", padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: "0.6rem", letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>
                        {order.gig.category}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--foreground)", marginBottom: "0.5rem" }}>{order.gig.title}</div>
                      <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.78rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
                        <span>Buyer: <Link href={`/u/${order.buyer.twitterHandle}`} style={{ color: "#14b8a6", textDecoration: "none", fontWeight: 600 }}>@{order.buyer.twitterHandle}</Link>{buyerMissing && <span style={{ color: "#ef4444", marginLeft: 4 }}>(no wallet)</span>}</span>
                        <span>Seller: <Link href={`/u/${order.seller.twitterHandle}`} style={{ color: "#14b8a6", textDecoration: "none", fontWeight: 600 }}>@{order.seller.twitterHandle}</Link>{sellerMissing && <span style={{ color: "#ef4444", marginLeft: 4 }}>(no wallet)</span>}</span>
                        <span>Amount: <strong style={{ color: "var(--foreground)" }}>${order.amount} USDC</strong></span>
                      </div>
                      {escrowMissing && (
                        <div style={{ marginTop: "0.5rem", fontSize: "0.72rem", color: "#f59e0b" }}>
                          No escrow address on record — dispute may be off-chain only.
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                        {new Date(order.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                      <Link
                        href={`/admin/disputes/${order.id}`}
                        style={{
                          padding: "0.5rem 1.2rem", borderRadius: 99, fontSize: "0.78rem", fontWeight: 700,
                          textDecoration: "none",
                          background: canResolve ? "#ef4444" : "var(--card-border)",
                          color: canResolve ? "#fff" : "var(--text-muted)",
                        }}
                      >
                        {canResolve ? "Resolve Dispute →" : "View Details →"}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
