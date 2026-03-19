import { auth } from "@/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import Link from "next/link";
import LinkWallet from "@/components/forms/LinkWallet";
import T from "@/components/ui/T";

export const metadata = { title: "Billing & Wallet — Crewboard" };

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.userId) redirect("/login");

  const userId = session.user.userId;

  const [dbUser, completedOrders, pendingOrders] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { walletAddress: true, name: true },
    }),
    db.order.findMany({
      where: { sellerId: userId, status: "completed" },
      select: { amount: true },
    }).catch(() => []),
    db.order.findMany({
      where: { sellerId: userId, status: { in: ["pending", "accepted", "funded", "delivered"] } },
      select: { amount: true },
    }).catch(() => []),
  ]);

  if (!dbUser) redirect("/login");

  const totalEarned = completedOrders.reduce((s: number, o: { amount: number }) => s + o.amount, 0);
  const totalPending = pendingOrders.reduce((s: number, o: { amount: number }) => s + o.amount, 0);

  function fmt(n: number): string {
    if (n === 0) return "$0";
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}m`;
    if (n >= 1000) return `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
    return `$${n}`;
  }

  return (
    <main className="page" style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 1.5rem 6rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div className="billing-page-kicker" style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "0.55rem",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            marginBottom: "0.4rem",
          }}>
            — ACCOUNT
          </div>
          <h1 className="billing-page-title" style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
            color: "var(--foreground)",
            lineHeight: 1,
            marginBottom: "0.5rem",
          }}>
            <T k="menu.billing" />
          </h1>
          <p className="billing-page-sub" style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "0.85rem",
            color: "var(--text-muted)",
          }}>
            Manage your Solana wallet and payment settings.
          </p>
        </div>

        {/* Wallet section */}
        <section style={{ marginBottom: "2rem" }}>
          <div className="billing-section-label">
            Wallet
          </div>
          <LinkWallet currentWallet={dbUser.walletAddress} />
        </section>

        {/* Earnings */}
        <section style={{ marginBottom: "2rem" }}>
          <div className="billing-section-label">
            Earnings
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "0.75rem",
          }} className="billing-stats-grid">
            {[
              { label: "Total Earned", value: fmt(totalEarned) },
              { label: "Pending",      value: fmt(totalPending) },
              { label: "Withdrawn",    value: "$0" },
            ].map((s) => (
              <div key={s.label} style={{
                borderRadius: 14,
                padding: "1.1rem 1.25rem",
                border: "1px solid var(--card-border)",
              }} className="billing-card">
                <div className="billing-stat-value" style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "1.4rem",
                  fontWeight: 700,
                  color: "var(--foreground)",
                }}>
                  {s.value}
                </div>
                <div className="billing-stat-label" style={{
                  fontSize: "0.6rem",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginTop: 6,
                }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Payment history */}
        <section style={{ marginBottom: "2rem" }}>
          <div className="billing-section-label">
            Payment History
          </div>
          <div style={{
            borderRadius: 14,
            border: "1px solid var(--card-border)",
            padding: "2.5rem",
            textAlign: "center",
          }} className="billing-card">
            <div className="billing-empty-label" style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "0.65rem",
              letterSpacing: "0.1em",
              color: "var(--text-muted)",
              textTransform: "uppercase",
            }}>
              No transactions yet
            </div>
            <p className="billing-empty-sub" style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              marginTop: "0.5rem",
            }}>
              Your payment history will appear here once you complete an order.
            </p>
          </div>
        </section>

        <div style={{ paddingTop: "2rem", borderTop: "1px solid var(--card-border)" }}>
          <Link href="/dashboard" className="billing-back-link" style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: "0.82rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            textDecoration: "none",
          }}>
            ← Back to Dashboard
          </Link>
        </div>

      </div>
    </main>
  );
}
