import Link from "next/link";

export const metadata = { title: "Privacy Policy — Crewboard" };

export default function PrivacyPage() {
  return (
    <main className="page">
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "4rem 1.5rem 6rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "3rem" }}>
          <div style={{
            fontFamily: "Space Mono, monospace",
            fontSize: "0.58rem",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "rgba(0,0,0,0.38)",
            marginBottom: "1rem",
          }}>
            — Legal
          </div>
          <h1 style={{
            fontFamily: "Rajdhani, sans-serif",
            fontWeight: 700,
            fontSize: "clamp(2rem, 5vw, 3rem)",
            letterSpacing: "0.02em",
            marginBottom: "0.5rem",
          }}>
            Privacy Policy
          </h1>
          <p style={{ color: "rgba(0,0,0,0.45)", fontSize: "0.85rem" }}>
            Last updated: January 1, 2026
          </p>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>

          <Section title="1. What We Collect">
            When you sign in with X (Twitter), we receive your public profile information: display name, X handle, and profile picture. We store this in our database to power your public Crewboard profile. We also store any information you voluntarily provide during onboarding — role, skills, bio, and availability status.
          </Section>

          <Section title="2. How We Use Your Data">
            Your data is used solely to operate the Crewboard platform: displaying your public profile, showing you in the talent directory, and enabling other users to find and contact you. We do not sell your data to third parties. We do not use your data for advertising.
          </Section>

          <Section title="3. Authentication via X">
            We use X (Twitter) OAuth 2.0 for authentication. We do not store your X password. The OAuth tokens we receive are used only to verify your identity at sign-in. You can revoke Crewboard&apos;s access at any time from your X account settings.
          </Section>

          <Section title="4. Public Profile Data">
            Your name, X handle, role, skills, bio, and availability are publicly visible on Crewboard by default. This is the core functionality of the platform — connecting builders. If you wish to remove your public profile, you can delete your account by contacting us.
          </Section>

          <Section title="5. Cookies & Sessions">
            We use secure, HTTP-only session cookies to keep you logged in. These cookies do not track you across other websites. We do not use analytics cookies or third-party tracking scripts.
          </Section>

          <Section title="6. Data Storage">
            Your data is stored on Neon Postgres, a cloud database provider. Data is encrypted at rest and in transit. We retain your data for as long as your account is active. Upon account deletion, your data is permanently removed within 30 days.
          </Section>

          <Section title="7. Third-Party Services">
            Crewboard integrates with X (Twitter) for authentication. Beyond this, we do not share your data with any third-party services. Any on-chain activity you perform (smart contracts, payments) is governed by the respective blockchain network, not Crewboard.
          </Section>

          <Section title="8. Your Rights">
            You have the right to access, correct, or delete your personal data at any time. To exercise these rights, contact us via X. We will respond within 30 days.
          </Section>

          <Section title="9. Children's Privacy">
            Crewboard is not directed at children under 18. We do not knowingly collect personal information from minors. If we become aware of such data, it will be promptly deleted.
          </Section>

          <Section title="10. Changes to This Policy">
            We may update this Privacy Policy from time to time. We will notify users of significant changes via a notice on the platform. Continued use after changes constitutes acceptance of the updated policy.
          </Section>

          <Section title="11. Contact">
            Privacy questions or data requests? Reach us on X at{" "}
            <a href="https://x.com/crewboard_" target="_blank" rel="noopener noreferrer"
              style={{ color: "#2DD4BF", textDecoration: "none" }}>@crewboard_</a>.
          </Section>

        </div>

        {/* Back */}
        <div style={{ marginTop: "4rem", paddingTop: "2rem", borderTop: "1px solid rgba(0,0,0,0.08)" }}>
          <Link href="/" style={{
            fontFamily: "Rajdhani, sans-serif",
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
        fontFamily: "Rajdhani, sans-serif",
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
