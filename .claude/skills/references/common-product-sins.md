# Common Product Sins — Freelance Marketplace & Web3 Edition

Flag these patterns when reviewing Crewboard. Name the sin, show how it manifests.

---

## Marketplace Sins

### The Empty Room
Launching a two-sided marketplace without solving supply first. Users arrive, find no talent (or no buyers), and never return. First impression = dead platform.
- **Signal**: Beta launch without pre-seeded, high-quality seller profiles.

### The Trust Vacuum
No mechanism to differentiate a skilled freelancer from a faker beyond self-reported credentials. Buyers have no confidence. Sellers with real skills go where they get paid.
- **Signal**: Profiles with no work samples, no verified reviews, no skill test or portfolio review.

### The Leakage Problem
Platform fee high enough that buyers and sellers coordinate to transact off-platform after the first introduction. Platform becomes a lead-gen tool it doesn't get paid for.
- **Signal**: Fee structure not explicitly designed to beat "just pay via bank transfer."

### The Liquidity Trap
Discovery works only when there are 1000+ listings. With 50 gigs, search returns nothing useful, categories look empty, and users assume the platform is dead.
- **Signal**: No strategy for making a thin catalog feel useful (curation, featured listings, manual matching).

### The Everything Marketplace
Trying to serve AI engineers, KOL managers, graphic designers, community managers, and exchange listers all at once with no prioritized wedge. Being everything to everyone = being nothing to anyone.
- **Signal**: 10+ categories at launch with no stated priority or niche focus.

### The Repeat Buyer Desert
No mechanism to bring a satisfied buyer back for their next project. They found their freelancer — why come back to Crewboard instead of just emailing them directly?
- **Signal**: No favorites, no saved freelancers, no project management tools, no team accounts.

---

## Web3-Specific Sins

### Wallet Wall
Requiring wallet connection before a user can see any value. Crypto-native users tolerate this. Everyone else leaves.
- **Signal**: Wallet connect prompt on homepage or before browsing talent.

### Blockchain Theater
Adding Web3 elements (wallet verification, on-chain escrow, NFT badges) that don't meaningfully improve trust or outcomes over a well-designed Web2 system.
- **Signal**: Solana escrow that takes longer and costs more than Stripe escrow, with no meaningful trust advantage.

### The Volatility Trap
Pricing gigs in USD but settling in SOL (or vice versa). One party wins, one loses on every price move. Neither party asked for FX exposure.
- **Signal**: No clear price-at-time-of-order mechanism with stable settlement.

### Identity Theater
Using Worldcoin or wallet verification as a substitute for actual competence or reputation signals. "Verified human" does not mean "good freelancer."
- **Signal**: Worldcoin badge prominent in UI with no skill or portfolio verification alongside it.

### The Audit Gap
Custom smart contracts handling real user funds with no security audit disclosed. One exploit = catastrophic reputation damage and legal exposure.
- **Signal**: Homegrown Anchor escrow program with no disclosed audit or audit-in-progress.

### The Off-Ramp Nightmare
Freelancers in emerging markets can't easily convert SOL earnings to local currency. The "crypto payment" benefit evaporates when they can't spend it.
- **Signal**: No documentation of off-ramp options. Assuming all freelancers are crypto-native.

---

## UX Anti-Patterns (Marketplace Specific)

### The Registration Wall
Requiring account creation to browse. Converts no one. Fiverr lets you browse everything. Upwork shows job listings. Gate creation, not discovery.

### The Feature Graveyard
Building campaigns, credit systems, showcase portfolios, messaging, reviews, disputes, AND escrow for a v0.1.0. Every half-finished feature erodes trust in the core loop.

### The Confidence Gap
Showing a freelancer's profile with 0 reviews, 0 completed orders, no portfolio. Indistinguishable from a fake account. Buyers choose the devil they know (Fiverr).

### The Ghost Town Signal
A marketplace with sparse listings communicates failure louder than any copy. Users don't think "early stage" — they think "nobody uses this."
