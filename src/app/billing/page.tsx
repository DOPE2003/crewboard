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

  const dbUser = await db.user.findUnique({
    where: { id: userId },
    select: { walletAddress: true, name: true },
  });

  if (!dbUser) redirect("/login");

  return (
    <main className="page" style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 1.5rem 6rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div className="billing-page-kicker" style={{
            fontFamily: "Space Mono, monospace",
            fontSize: "0.55rem",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "rgba(0,0,0,0.38)",
            marginBottom: "0.4rem",
          }}>
            — ACCOUNT
          </div>
          <h1 className="billing-page-title" style={{
            fontFamily: "Rajdhani, sans-serif",
            fontWeight: 700,
            fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
            color: "#000",
            lineHeight: 1,
            marginBottom: "0.5rem",
          }}>
            <T k="menu.billing" />
          </h1>
          <p className="billing-page-sub" style={{
            fontFamily: "Outfit, sans-serif",
            fontSize: "0.85rem",
            color: "rgba(0,0,0,0.45)",
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
              { label: "Total Earned", value: "$0" },
              { label: "Pending",      value: "$0" },
              { label: "Withdrawn",    value: "$0" },
            ].map((s) => (
              <div key={s.label} style={{
                borderRadius: 14,
                padding: "1.1rem 1.25rem",
                border: "1px solid rgba(0,0,0,0.07)",
              }} className="billing-card">
                <div className="billing-stat-value" style={{
                  fontFamily: "Space Mono, monospace",
                  fontSize: "1.4rem",
                  fontWeight: 700,
                  color: "#0f172a",
                }}>
                  {s.value}
                </div>
                <div className="billing-stat-label" style={{
                  fontSize: "0.6rem",
                  fontWeight: 600,
                  color: "#94a3b8",
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
            border: "1px solid rgba(0,0,0,0.07)",
            padding: "2.5rem",
            textAlign: "center",
          }} className="billing-card">
            <div className="billing-empty-label" style={{
              fontFamily: "Space Mono, monospace",
              fontSize: "0.65rem",
              letterSpacing: "0.1em",
              color: "rgba(0,0,0,0.3)",
              textTransform: "uppercase",
            }}>
              No transactions yet
            </div>
            <p className="billing-empty-sub" style={{
              fontFamily: "Outfit, sans-serif",
              fontSize: "0.8rem",
              color: "rgba(0,0,0,0.4)",
              marginTop: "0.5rem",
            }}>
              Your payment history will appear here once you complete an order.
            </p>
          </div>
        </section>

        <div style={{ paddingTop: "2rem", borderTop: "1px solid rgba(0,0,0,0.07)" }}>
          <Link href="/dashboard" className="billing-back-link" style={{
            fontFamily: "Rajdhani, sans-serif",
            fontWeight: 700,
            fontSize: "0.82rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(0,0,0,0.45)",
            textDecoration: "none",
          }}>
            ← Back to Dashboard
          </Link>
        </div>

      </div>
    </main>
  );
}
