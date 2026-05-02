import Link from "next/link";

export const metadata = { title: "Terms of Service — Crewboard" };

export default function TermsPage() {
  return (
    <main className="page">
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "4rem 1.5rem 6rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "3rem" }}>
          <div style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "0.58rem",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "rgba(0,0,0,0.38)",
            marginBottom: "1rem",
          }}>
            — Legal
          </div>
          <h1 style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: "clamp(2rem, 5vw, 3rem)",
            letterSpacing: "0.02em",
            marginBottom: "0.5rem",
          }}>
            Terms of Service
          </h1>
          <p style={{ color: "rgba(0,0,0,0.45)", fontSize: "0.85rem" }}>
            Last updated: January 1, 2026
          </p>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>

          <Section title="1. Acceptance of Terms">
            By accessing or using Crewboard, you agree to be bound by these Terms of Service. If you do not agree, do not use the platform. Crewboard reserves the right to update these terms at any time; continued use constitutes acceptance of any changes.
          </Section>

          <Section title="2. Eligibility">
            You must be at least 18 years old to use Crewboard. By creating an account, you confirm that you meet this requirement and that the information you provide is accurate and complete.
          </Section>

          <Section title="3. Accounts & Authentication">
            Crewboard uses X (Twitter) OAuth for authentication. Your X handle becomes your public identity on the platform. You are responsible for all activity under your account. Do not share your session or attempt to impersonate another user.
          </Section>

          <Section title="4. User Content">
            You retain ownership of content you submit (bio, skills, project descriptions). By submitting content, you grant Crewboard a non-exclusive, worldwide, royalty-free licence to display it on the platform. You must not post content that is false, defamatory, infringing, or illegal.
          </Section>

          <Section title="5. Acceptable Use">
            You agree not to: scrape or automate access to the platform without permission; attempt to circumvent security measures; spam, harass, or deceive other users; use the platform for any unlawful purpose.
          </Section>

          <Section title="6. Payments & Escrow">
            Any payment or escrow features on Crewboard are facilitated through third-party smart contracts. Crewboard is not a party to any transaction between users and assumes no liability for disputes, failed transactions, or losses arising from on-chain activity.
          </Section>

          <Section title="7. Intellectual Property">
            The Crewboard name, logo, and design are the property of Crewboard and may not be used without written permission. All other trademarks belong to their respective owners.
          </Section>

          <Section title="8. Disclaimer of Warranties">
            Crewboard is provided &quot;as is&quot; without warranty of any kind. We do not guarantee uptime, accuracy of user profiles, or the quality of any collaboration formed through the platform.
          </Section>

          <Section title="9. Limitation of Liability">
            To the maximum extent permitted by law, Crewboard shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.
          </Section>

          <Section title="10. Governing Law">
            These terms are governed by applicable law. Any disputes shall be resolved through binding arbitration rather than in court, except where prohibited by law.
          </Section>

          <Section title="11. Contact">
            For questions about these Terms, reach us on X at{" "}
            <a href="https://x.com/crewboard_" target="_blank" rel="noopener noreferrer"
              style={{ color: "#2DD4BF", textDecoration: "none" }}>@crewboard_</a>.
          </Section>

        </div>

        {/* Back */}
        <div style={{ marginTop: "4rem", paddingTop: "2rem", borderTop: "1px solid rgba(0,0,0,0.08)" }}>
          <Link href="/" style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: "0.85rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(0,0,0,0.5)",
            textDecoration: "none",
          }}>
            ← Back to Crewboard
          </Link>
        </div>

      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 style={{
        fontFamily: "Inter, sans-serif",
        fontWeight: 700,
        fontSize: "1.05rem",
        letterSpacing: "0.04em",
        marginBottom: "0.6rem",
        color: "#000",
      }}>
        {title}
      </h2>
      <p style={{
        fontSize: "0.9rem",
        color: "rgba(0,0,0,0.6)",
        lineHeight: 1.8,
      }}>
        {children}
      </p>
    </div>
  );
}
