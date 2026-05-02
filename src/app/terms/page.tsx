import Link from "next/link";

export const metadata = { title: "Terms of Service — Crewboard" };

export default function TermsPage() {
  return (
    <main className="page">
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "4rem 1.5rem 6rem" }}>

        <div style={{ marginBottom: "3rem" }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.58rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(0,0,0,0.38)", marginBottom: "1rem" }}>
            — Legal
          </div>
          <h1 style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "clamp(2rem, 5vw, 3rem)", letterSpacing: "0.02em", marginBottom: "0.5rem" }}>
            Terms of Service
          </h1>
          <p style={{ color: "rgba(0,0,0,0.45)", fontSize: "0.85rem" }}>Last updated: May 3, 2026</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>

          <Section title="1. Acceptance of Terms">
            By accessing or using Crewboard, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, do not use the platform. Crewboard reserves the right to update these terms at any time; continued use constitutes acceptance of any changes.
          </Section>

          <Section title="2. Eligibility">
            You must be at least 18 years old to use Crewboard. By creating an account, you confirm that you meet this requirement, that the information you provide is accurate and complete, and that you have the legal capacity to enter into binding agreements.
          </Section>

          <Section title="3. Accounts & Authentication">
            Crewboard uses X (Twitter) OAuth for authentication. Your X handle becomes your public identity on the platform. You are responsible for all activity under your account. Do not share your session or attempt to impersonate another user. Crewboard reserves the right to suspend or terminate accounts that violate these terms.
          </Section>

          <Section title="4. Platform Fee">
            Crewboard charges a 10% platform fee on the gross value of every completed order. This fee is deducted from the seller&apos;s (freelancer&apos;s) payout at the time of escrow release. The buyer pays the full agreed order amount; the seller receives 90% of that amount. By using Crewboard&apos;s order and escrow system, both parties agree to this fee structure.
          </Section>

          <Section title="5. Escrow & Payments">
            Payments on Crewboard are processed through non-custodial smart contracts on the Solana blockchain. When a buyer funds an order, their payment is locked in escrow on-chain. Funds are released to the seller only when the buyer explicitly approves delivery, or through dispute resolution. Crewboard facilitates but is not a party to transactions between users. You are solely responsible for ensuring you transact with the correct wallet addresses. Crewboard cannot reverse, cancel, or modify on-chain transactions once executed.
          </Section>

          <Section title="6. Blockchain & Crypto Risk">
            On-chain transactions are irreversible. Crewboard does not guarantee uptime of the Solana network or any third-party wallet infrastructure. You are solely responsible for any gas fees, network failures, wallet errors, or losses resulting from on-chain activity. Cryptocurrency values are volatile — Crewboard makes no representations about the value of any digital assets. You should not use funds you cannot afford to lose.
          </Section>

          <Section title="7. Wallet Ownership">
            By connecting a wallet to Crewboard, you confirm that you are the sole owner and controller of that wallet and its private keys. Crewboard does not have access to your private keys and cannot initiate transactions on your behalf. You are solely responsible for the security of your wallet.
          </Section>

          <Section title="8. Order Completion & Delivery">
            A seller is expected to deliver work that matches the agreed scope within the specified timeframe. Delivery is defined as submitting work through Crewboard&apos;s delivery mechanism. Buyers are expected to review delivered work promptly and either approve payment or raise a dispute within a reasonable period. Approving delivery releases escrow to the seller and is considered final acceptance of the work.
          </Section>

          <Section title="9. Disputes">
            If a buyer and seller cannot resolve a disagreement, either party may open a formal dispute through Crewboard&apos;s dispute system. Crewboard&apos;s support team will review the evidence submitted by both parties and issue a binding resolution, which may include releasing escrow to either party or splitting funds. Both parties agree to accept Crewboard&apos;s dispute resolution as final. Abuse of the dispute system (e.g., raising disputes in bad faith) may result in account suspension.
          </Section>

          <Section title="10. Non-Circumvention">
            You agree not to circumvent Crewboard&apos;s platform fee by arranging payment for services introduced through Crewboard outside of the platform. If you are introduced to another user through Crewboard, any resulting work arrangement must be transacted through Crewboard for a period of 12 months from the date of introduction. Violation of this clause may result in account termination and a claim for damages equal to the platform fee that would have been payable.
          </Section>

          <Section title="11. User Content">
            You retain ownership of content you submit (bio, skills, project descriptions, portfolio media, gig listings, messages). By submitting content, you grant Crewboard a non-exclusive, worldwide, royalty-free licence to display it on the platform. You must not post content that is false, defamatory, infringing, or illegal.
          </Section>

          <Section title="12. Prohibited Services">
            You may not use Crewboard to offer or purchase: illegal goods or services; services that infringe intellectual property rights; fraudulent, deceptive, or misleading services; services related to gambling, adult content, weapons, or controlled substances; or any services that violate applicable law. Crewboard reserves the right to remove any listing and suspend any account in violation of this section.
          </Section>

          <Section title="13. Acceptable Use">
            You agree not to: scrape or automate access to the platform without permission; attempt to circumvent security measures; spam, harass, or deceive other users; create fake accounts or reviews; use the platform for money laundering or sanctions evasion; or use the platform for any unlawful purpose.
          </Section>

          <Section title="14. Taxes">
            You are solely responsible for determining and fulfilling your own tax obligations arising from transactions on Crewboard, including income tax, VAT, GST, or any other applicable taxes. Crewboard does not provide tax advice and does not withhold or remit taxes on your behalf.
          </Section>

          <Section title="15. Account Suspension & Termination">
            Crewboard may suspend or terminate your account at any time for violation of these terms, fraudulent activity, abuse of the dispute system, or conduct harmful to other users or the platform. In the event of termination, any funds locked in active escrow orders will be handled through the dispute resolution process. You may close your account at any time by contacting us.
          </Section>

          <Section title="16. Intellectual Property">
            The Crewboard name, logo, and design are the property of Crewboard and may not be used without written permission. All other trademarks belong to their respective owners.
          </Section>

          <Section title="17. Disclaimer of Warranties">
            Crewboard is provided &quot;as is&quot; without warranty of any kind. We do not guarantee uptime, accuracy of user profiles, quality of work delivered, or successful completion of any transaction or smart contract interaction.
          </Section>

          <Section title="18. Limitation of Liability">
            To the maximum extent permitted by law, Crewboard shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform, including but not limited to losses from on-chain transactions, smart contract failures, or disputes between users. Our total liability to you for any claim shall not exceed the platform fees paid by you in the 3 months preceding the claim.
          </Section>

          <Section title="19. Governing Law">
            These terms are governed by the laws of England and Wales. Any disputes arising from these terms that cannot be resolved informally shall be submitted to binding arbitration under the rules of a mutually agreed arbitration body. Nothing in this clause prevents either party from seeking urgent injunctive relief from a court of competent jurisdiction.
          </Section>

          <Section title="20. Contact">
            For questions about these Terms, reach us on X at{" "}
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
