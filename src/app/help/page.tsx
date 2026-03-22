import Link from "next/link";

export const metadata = { title: "Help & Support — Crewboard" };

function Q({ q, a }: { q: string; a: string }) {
  return (
    <div style={{
      padding: "1.25rem 1.5rem",
      borderRadius: 12,
      border: "1px solid var(--card-border)",
      background: "var(--dropdown-bg)",
    }}>
      <div style={{
        fontFamily: "Inter, sans-serif",
        fontWeight: 700,
        fontSize: "0.9rem",
        color: "var(--foreground)",
        marginBottom: "0.5rem",
      }}>
        {q}
      </div>
      <p style={{
        fontFamily: "Inter, sans-serif",
        fontSize: "0.82rem",
        color: "var(--text-muted)",
        lineHeight: 1.7,
        margin: 0,
      }}>
        {a}
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "2.5rem" }}>
      <div style={{
        fontFamily: "Inter, sans-serif",
        fontSize: "0.55rem",
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: "var(--text-muted)",
        marginBottom: "0.75rem",
      }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {children}
      </div>
    </section>
  );
}

export default function HelpPage() {
  return (
    <main className="page" style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "3rem 1.5rem 6rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "3rem" }}>
          <div style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "0.55rem",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            marginBottom: "0.4rem",
          }}>
            — Support
          </div>
          <h1 style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
            color: "var(--foreground)",
            lineHeight: 1,
            marginBottom: "0.5rem",
          }}>
            Help &amp; Support
          </h1>
          <p style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "0.88rem",
            color: "var(--text-muted)",
          }}>
            Everything you need to get started and get answers.
          </p>
        </div>

        {/* Getting Started */}
        <Section title="Getting Started">
          <Q
            q="How do I create an account?"
            a="Sign in with your Twitter/X account in one click, or create a Crewboard ID with your email and password. No forms, no friction."
          />
          <Q
            q="How do I find talent?"
            a="Browse the talent directory at /talent. Filter by role, skills, chain, and availability to find exactly who you need."
          />
          <Q
            q="How do I post a service?"
            a={'Go to your dashboard and click "Post a Service". Fill in your title, category, price, and delivery time.'}
          />
        </Section>

        {/* Orders & Payments */}
        <Section title="Orders &amp; Payments">
          <Q
            q="How do payments work?"
            a="Currently payments are agreed directly between buyer and seller. Escrow smart contracts are coming soon for fully trustless payments."
          />
          <Q
            q="What happens if there is a dispute?"
            a="Contact us at info@crewboard.fun and we will help resolve it manually until the escrow system is live."
          />
          <Q
            q="Can I get a refund?"
            a="Refunds are handled case by case. Contact info@crewboard.fun with your order ID and we will review it."
          />
        </Section>

        {/* Account */}
        <Section title="Account">
          <Q
            q="How do I edit my profile?"
            a="Go to your public profile page at /u/[yourhandle] and click the edit button."
          />
          <Q
            q="How do I connect my wallet?"
            a={'Go to /billing and click "Connect Wallet". We support Solana wallets.'}
          />
          <Q
            q="How do I delete my account?"
            a="Email info@crewboard.fun with your request and we will process it within 48 hours."
          />
        </Section>

        {/* Contact */}
        <section style={{
          padding: "2rem",
          borderRadius: 14,
          border: "1px solid var(--card-border)",
          background: "var(--dropdown-bg)",
        }}>
          <div style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "0.55rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            marginBottom: "0.75rem",
          }}>
            Contact
          </div>
          <h2 style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: "1.1rem",
            color: "var(--foreground)",
            marginBottom: "1rem",
          }}>
            Still need help? We&apos;re here.
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[
              { label: "Email", value: "info@crewboard.fun", href: "mailto:info@crewboard.fun" },
              { label: "Twitter", value: "@crewboard_", href: "https://x.com/crewboard_" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  width: 48,
                  flexShrink: 0,
                }}>
                  {item.label}
                </span>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "#2DD4BF",
                    textDecoration: "none",
                  }}
                >
                  {item.value}
                </a>
              </div>
            ))}
            <div style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              marginTop: "0.25rem",
            }}>
              Response time: within 24 hours
            </div>
          </div>
        </section>

        {/* Back link */}
        <div style={{ marginTop: "2.5rem", paddingTop: "2rem", borderTop: "1px solid var(--card-border)" }}>
          <Link href="/" style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: "0.8rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            textDecoration: "none",
          }}>
            ← Back to Home
          </Link>
        </div>

      </div>
    </main>
  );
}
