# Crewboard Roast Framework — Scoring Dimensions

10 dimensions, weighted by impact on Crewboard's survival.

---

## 1. Value Proposition (weight: 2x)

**The question**: Why would a Web3 freelancer choose Crewboard over Fiverr, Upwork, Contra, Braintrust, or Gitcoin?

**What to score**:
- Is the differentiation real or just "crypto payments"?
- Is the value prop instantly clear to a cold visitor?
- Does it solve a problem that existing platforms demonstrably fail at?

**Red flags**: "We're Fiverr but Web3" positioning. No unique angle on trust, quality, or discovery.

**What 10/10 looks like**: Braintrust (worker-owned, zero platform fees), Gitcoin (public goods funding native), Contra (no-fee, premium positioning). Clear reason a specific user would pick you.

---

## 2. Web3 Necessity (weight: 1.5x)

**The question**: Does Solana integration meaningfully improve the product, or does it add friction?

**What to score**:
- Does on-chain escrow solve a trust problem that off-chain payment + Stripe doesn't?
- Does wallet verification add signal or just a barrier?
- Is payment in crypto actually better for freelancers (volatility risk, tax complexity, off-ramp friction)?
- Could you remove the blockchain layer and have a better product?

**Red flags**: Wallet connection required before browsing. Solana escrow with no fallback. Crypto-only payments. Wallet verification used as a substitute for real identity/reputation.

**What 10/10 looks like**: Blockchain handles the one thing it's genuinely better at (trustless escrow, transparent reputation) and is otherwise invisible. Fiat fallback available.

---

## 3. Market Differentiation (weight: 1.5x)

**The question**: In a world with Fiverr, Upwork, Contra, Braintrust, Gitcoin, and Layer3 — where exactly does Crewboard win?

**What to score**:
- Is the target segment narrow enough to dominate, or trying to be everything?
- Does Crewboard have a structural advantage (lower fees, better matching, niche expertise, community)?
- Is there a defensible wedge that isn't just "first mover in Web3 freelance" (it isn't)?

**Red flags**: Full-category marketplace play with no niche. Competing on features alone. No network effects story.

**What 10/10 looks like**: A platform that owns a niche so specifically that it would be painful for users in that niche to go anywhere else.

---

## 4. Cold Start / Liquidity Problem (weight: 2x)

**The question**: How does Crewboard get to the minimum viable liquidity where buyers find talent and sellers get orders?

**What to score**:
- Is there a supply-first or demand-first strategy?
- How are the first 100 sellers acquired and curated?
- How are the first 100 buyers brought in with actual intent to hire?
- Is there a chicken-and-egg escape hatch (subsidized work, partnerships, community)?

**Red flags**: No stated go-to-market for either side. Assuming organic growth. Relying on "Web3 community" as if it's a homogeneous audience.

**What 10/10 looks like**: Explicit supply-side seeding strategy (invite top freelancers, guarantee first orders, curate quality). Demand-side with real intent (DAOs with hiring budgets, project partnerships).

---

## 5. First-Time User Experience (weight: 1.5x)

**The question**: What happens to a brand new user (freelancer or client) in their first 10 minutes?

**What to score**:
- How many steps to see value (browse talent, post a gig)?
- Is wallet connection required upfront or deferred?
- Is there a clear "aha moment"?
- What does an empty state look like (no gigs, no talent)?

**Red flags**: Wallet required to browse. Long onboarding before any value shown. Empty marketplace with no social proof. Registration wall before exploration.

**What 10/10 looks like**: Fiverr-style: browse and see real talent immediately, wallet/auth only when transacting. Value before friction.

---

## 6. Trust & Safety (weight: 1.5x)

**The question**: How does Crewboard prevent scams, low-quality work, and disputes — and what happens when things go wrong?

**What to score**:
- How are freelancer profiles verified beyond wallet ownership?
- What's the dispute resolution mechanism? Is it clear? Is there a human backstop?
- What prevents fake reviews?
- How is quality signaled to buyers before they commit?

**Red flags**: Wallet/Worldcoin verification used as a substitute for skill verification. No dispute resolution flow. Reviews with no proof of transaction.

**What 10/10 looks like**: Portfolio review, sample work, transaction-gated reviews, clear dispute flow with explicit SLAs, human escalation path.

---

## 7. Core Loop (weight: 1x)

**The question**: What brings users back, and how does the platform get better with each transaction?

**What to score**:
- Does completing an order increase the value of the platform (reviews, reputation, repeat business)?
- Is there a retention hook for both buyers and sellers?
- Does data compound (better matching, better recommendations) over time?

**Red flags**: Transactional-only relationship with no loyalty mechanism. No reason for a satisfied buyer to return to Crewboard specifically.

**What 10/10 looks like**: Every transaction builds reputation that's portable but rooted in the platform. Buyers have saved talent lists, order history, preferred sellers.

---

## 8. Technical Execution (weight: 1x)

**The question**: Is the tech stack appropriate for the stage, and are there landmines?

**What to score**:
- Is Solana escrow battle-tested or a custom implementation risk?
- Is real-time messaging (Pusher) scaling appropriately for beta?
- Are there obvious security risks (wallet signing exploits, auth vulnerabilities)?
- Is the stack maintainable by a small team?

**Red flags**: Custom smart contracts handling real money without audit. Auth complexity (NextAuth + wallet + Worldcoin) increasing attack surface. Neon/Prisma cold start latency on serverless.

**What 10/10 looks like**: Use audited escrow programs (not reinventing). Minimal custom on-chain logic. Clear security boundaries.

---

## 9. Monetization Path (weight: 1x)

**The question**: How does Crewboard make money, and is the model sustainable?

**What to score**:
- Is the fee structure competitive (Fiverr takes 20%, Upwork 10-20%, Braintrust 0%)?
- Is revenue generated before scale, or only at scale?
- Are there alternative revenue streams (premium listings, promoted talent, SaaS tools for DAOs)?

**Red flags**: Platform fee high enough to drive users to transact off-platform. Revenue only at very high GMV. No monetization path for early traction.

**What 10/10 looks like**: Low enough fee to discourage off-platform deals, with premium services for power users that generate revenue early.

---

## 10. Market Timing (weight: 1x)

**The question**: Is now the right time for a Web3 freelance marketplace?

**What to score**:
- Is the Web3 job market growing or contracting?
- Are DAOs actually hiring via structured platforms, or informally via Discord?
- Is crypto payment adoption high enough among freelancers to reduce friction?
- What macro tailwinds/headwinds exist (crypto winter, AI replacing freelance work)?

**Red flags**: Building for a market size that peaked in 2021. Ignoring AI's impact on freelance demand in commodity categories (writing, basic design, code snippets).

**What 10/10 looks like**: Clear evidence the target segment is actively underserved and growing, with data points to back it.

---

## Scoring

| Score | Meaning |
|-------|---------|
| 1-3 | Broken or missing. Fix before anything else. |
| 4-5 | Exists but inadequate. Major work needed. |
| 6-7 | Acceptable but not differentiated. |
| 8-9 | Genuinely strong. Needs justification. |
| 10 | Best-in-class. Almost never warranted. |

**Weighted total calculation**: Multiply 2x dimensions by 2, 1.5x by 1.5, 1x by 1. Sum, divide by maximum possible, multiply by 100.
