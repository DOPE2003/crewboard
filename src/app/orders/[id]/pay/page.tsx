import db from "@/lib/db";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import PaymentClient from "./PaymentClient";

export default async function OrderPayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.userId;

  if (!userId) redirect("/login");

  const order = await db.order.findUnique({
    where: { id },
    include: {
      gig: true,
      seller: { select: { walletAddress: true, twitterHandle: true } },
      buyer: { select: { walletAddress: true } },
    },
  });

  if (!order) notFound();
  if (order.buyerId !== userId) redirect("/dashboard");
  if (order.status !== "pending") redirect("/dashboard");

  // Ensure both wallets exist
  if (!order.buyer.walletAddress || !order.seller.walletAddress) {
    return (
      <div className="page">
        <section className="auth-wrap">
          <div className="auth-card">
            <h1 className="auth-title">Missing Wallet Info</h1>
            <p className="auth-sub">Both you and the seller must have linked wallets to proceed.</p>
          </div>
        </section>
      </div>
    );
  }

  // Serialize for client component
  const serializedOrder = JSON.parse(JSON.stringify(order));

  return (
    <main className="page">
      <section className="auth-wrap">
        <div className="auth-card" style={{ maxWidth: 500, width: "100%" }}>
          <div className="auth-kicker">— ESCROW PAYMENT</div>
          <h1 className="auth-title">Lock Funds</h1>
          <p className="auth-sub">
            Locking <strong>${order.amount} USDC</strong> into a secure smart contract for the gig: <em>{order.gig.title}</em>
          </p>

          <div className="dash-divider" />

          <div className="payment-summary">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span>Seller</span>
              <span style={{ fontWeight: 600 }}>@{order.seller.twitterHandle}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
              <span>Amount</span>
              <span style={{ color: "#2DD4BF", fontWeight: 700 }}>${order.amount} USDC</span>
            </div>
          </div>

          <PaymentClient order={serializedOrder} />
          
          <p style={{ fontSize: "0.7rem", color: "rgba(0,0,0,0.4)", marginTop: "1rem", textAlign: "center" }}>
            Funds are held securely in a Solana Program PDA. <br />
            You release them only after the work is delivered.
          </p>
        </div>
      </section>
    </main>
  );
}
