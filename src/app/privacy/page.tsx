import Link from "next/link";

export const metadata = { title: "Privacy Policy — Crewboard" };

export default function PrivacyPage() {
  return (
    <main className="page">
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "4rem 1.5rem 6rem" }}>

        <div style={{ marginBottom: "3rem" }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.58rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(0,0,0,0.38)", marginBottom: "1rem" }}>
            — Legal
          </div>
          <h1 style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "clamp(2rem, 5vw, 3rem)", letterSpacing: "0.02em", marginBottom: "0.5rem" }}>
            Privacy Policy
          </h1>
          <p style={{ color: "rgba(0,0,0,0.45)", fontSize: "0.85rem" }}>Last updated: May 3, 2026</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>

          <Section title="1. What We Collect">
            When you sign in with X (Twitter), we receive your public profile information: display name, X handle, and profile picture. We store this to power your public Crewboard profile. We also store information you voluntarily provide during onboarding and profile setup — role, skills, bio, availability status, CV/portfolio URL, and profile media uploads. If you connect a Solana wallet, we store your public wallet address. We store all messages you send and receive on the platform, including file and media attachments. We track profile view counts per user. We collect standard server logs including IP addresses and request metadata for security and debugging purposes.
          </Section>

          <Section title="2. How We Use Your Data">
            Your data is used solely to operate the Crewboard platform: displaying your public profile, showing you in the talent directory, processing orders and payments, facilitating messaging between users, and enabling dispute resolution. We do not sell your data to third parties. We do not use your data for advertising.
          </Section>

          <Section title="3. Authentication via X">
            We use X (Twitter) OAuth 2.0 for authentication. We do not store your X password. OAuth tokens are used only to verify your identity at sign-in. You can revoke Crewboard&apos;s access at any time from your X account settings, which will invalidate your session.
          </Section>

          <Section title="4. Wallet Address">
            If you connect a Solana wallet, your public wallet address is stored in our database and displayed on your profile. Your wallet address is a public identifier on the Solana blockchain — Crewboard does not have access to your private keys or the ability to initiate transactions on your behalf. All on-chain transactions (funding escrow, releasing payment, refunds) require your explicit approval via your wallet.
          </Section>

          <Section title="5. On-Chain Data">
            Transactions processed through Crewboard&apos;s escrow smart contracts are recorded permanently on the Solana blockchain. This data is public and immutable — it cannot be deleted or modified by Crewboard or by you. This includes transaction amounts, wallet addresses, and timestamps.
          </Section>

          <Section title="6. Messages & Files">
            All messages sent through Crewboard&apos;s messaging system, including text, files, and media, are stored in our database. Message content is used to facilitate communication between users and to support dispute resolution when required. We do not sell or share message content with third parties.
          </Section>

          <Section title="7. Public Profile Data">
            Your name, X handle, role, skills, bio, availability, and profile picture are publicly visible on Crewboard by default. This is core to the platform&apos;s function of connecting clients and freelancers. If you wish to remove your public profile, contact us to delete your account.
          </Section>

          <Section title="8. Cookies & Sessions">
            We use secure, HTTP-only session cookies to keep you logged in. These cookies do not track you across other websites. We do not use third-party advertising cookies.
          </Section>

          <Section title="9. Analytics">
            We use Vercel Analytics to collect anonymised, aggregated usage data (page views, navigation patterns). This data does not include personally identifiable information and is used solely to improve the platform.
          </Section>

          <Section title="10. Data Storage & Security">
            Your data is stored on Neon Postgres, a cloud database provider. Data is encrypted at rest and in transit. We retain your data for as long as your account is active. Upon account deletion, your personal data is permanently removed from our database within 30 days. Note that on-chain data cannot be deleted (see Section 5).
          </Section>

          <Section title="11. Third-Party Services">
            Crewboard integrates with: X (Twitter) for authentication; Neon for database hosting; Vercel for hosting and analytics; Solana blockchain infrastructure for on-chain escrow. Beyond these, we do not share your data with third parties.
          </Section>

          <Section title="12. Your Rights">
            You have the right to access, correct, or delete your personal data at any time. To exercise these rights, contact us via X. We will respond within 30 days. Note that on-chain blockchain data is outside our ability to modify or delete.
          </Section>

          <Section title="13. Children's Privacy">
            Crewboard is not directed at children under 18. We do not knowingly collect personal information from minors. If we become aware of such data, it will be promptly deleted.
          </Section>

          <Section title="14. Changes to This Policy">
            We may update this Privacy Policy from time to time. We will notify users of significant changes via a notice on the platform. Continued use after changes constitutes acceptance of the updated policy.
          </Section>

          <Section title="15. Contact">
            Privacy questions or data requests? Reach us on X at{" "}
            <a href="https://x.com/crewboard_" target="_blank" rel="noopener noreferrer" style={{ color: "#2DD4BF", textDecoration: "none" }}>@crewboard_</a>.
          </Section>

        </div>

        <div style={{ marginTop: "4rem", paddingTop: "2rem", borderTop: "1px solid rgba(0,0,0,0.08)" }}>
          <Link href="/" style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(0,0,0,0.5)", textDecoration: "none" }}>
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
      <h2 style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1.05rem", letterSpacing: "0.04em", marginBottom: "0.6rem", color: "#000" }}>
        {title}
      </h2>
      <p style={{ fontSize: "0.9rem", color: "rgba(0,0,0,0.6)", lineHeight: 1.8 }}>
        {children}
      </p>
    </div>
  );
}
