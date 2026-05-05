# UX Red Flags — Crewboard Evaluation Checklist

Evaluate Crewboard's UX against these failure patterns. Flag each one that applies.

---

## Onboarding Red Flags

### Wallet-First Onboarding
User is asked to connect a wallet before seeing any product value. Kills conversion for anyone even mildly crypto-curious but not crypto-native.
- **Check**: Can you land on Crewboard and browse 10 talent profiles without connecting a wallet or signing up?

### No Guest Mode
No way to experience the core value proposition (see talent, browse gigs, read reviews) without creating an account.
- **Check**: Is there a "Browse as guest" path?

### Multi-Step Registration Gauntlet
Email → verify → profile setup → wallet connect → Worldcoin verify → before seeing anything. Each step is attrition.
- **Check**: How many steps from homepage to seeing your first useful gig or profile?

### No Progress Indicator
User doesn't know how long onboarding takes or what comes next. Uncertainty = abandonment.

---

## Discovery Red Flags

### Empty Search Results
Search or filter returns 0 results (because the marketplace is thin) with no fallback. User concludes the platform is dead.
- **Check**: What does a search for "smart contract developer" return with 20 active sellers?

### Undifferentiated Listings
All gig cards look identical — same format, no quality signal, no social proof. User can't make a choice. They leave.
- **Check**: Can a buyer distinguish a top freelancer from a new one at a glance?

### No Featured or Editorial Curation
Thin marketplace hidden behind algorithmic sorting. 50 listings with no curation looks worse than 10 curated listings.
- **Check**: Is there a "top freelancers this week" or "verified experts" surface?

### Category Overload with No Depth
10+ categories visible with 2-3 listings each. Looks abandoned. Better to hide thin categories.
- **Check**: Does every displayed category have enough listings to feel alive?

---

## Trust Red Flags

### Zero-Review Profiles Shown Without Context
New freelancers shown with "No reviews yet" prominently displayed. Buyer has no confidence. Needs "New to Crewboard — portfolio verified" framing or similar.

### No Portfolio Requirement
Freelancer can complete a profile with just text — no work samples, no links, no portfolio. Indistinguishable from a fake account.

### Unverified Skills Shown as Features
"Skills: Solana, React, AI" — self-reported with zero verification. Means nothing to a buyer who's been burned before.

### Dispute Process Opacity
No visible information on what happens if the work is bad, the freelancer ghosts, or the buyer refuses to release escrow. Buyers assume the worst.
- **Check**: Is there a clearly linked dispute resolution page in the order flow?

---

## Payment & Escrow Red Flags

### Escrow Confusion
User doesn't clearly understand what "escrow" means in this context — when funds are locked, when released, who controls what, what happens on dispute.
- **Check**: Is there a plain-language escrow explainer at the moment of payment?

### Irreversible Transactions with No Confidence
Crypto payments are irreversible. If the user isn't confident in the escrow mechanism BEFORE paying, they won't pay.

### SOL Price Volatility Not Addressed
If a $500 project is priced in SOL, a 20% SOL price drop means the freelancer gets $400. Nobody signed up for this.
- **Check**: Is price stability guaranteed at order creation? Is this communicated?

### No Fiat Fallback
Users who want to use Crewboard but don't have crypto are immediately excluded. Stripe exists for a reason.
- **Check**: Can a buyer pay without a crypto wallet?

---

## Retention Red Flags

### No Post-Order Hook
After a successful order, what brings the buyer back? If the answer is "nothing except hoping they need another freelancer," retention will be near zero.

### No Saved Freelancers / Favorites
Buyer finds a great freelancer, completes an order, and has no easy way to rehire them. They'll just email directly next time.

### No Notification Strategy
No push or email nudges to remind buyers about open projects, or to remind sellers about new inquiries. Users forget the platform exists.

### No Project History / Dashboard
Buyers with multiple projects have no way to manage them in one view. Serious clients won't use a platform without project management basics.

---

## Mobile Red Flags

### Wallet Connect on Mobile
Mobile wallet connection (Phantom, Solflare) is a context-switch nightmare. User leaves app, connects, returns — but state is often lost.
- **Check**: Is the mobile escrow/payment flow tested on iOS and Android?

### Complex Actions on Small Screen
Reviewing a proposal, releasing escrow, filing a dispute — these are high-stakes actions. If they're hard to do on mobile, they don't get done.

---

## Messaging Red Flags

### No Pre-Purchase Messaging
Buyer can't ask questions before placing an order. Forces commit-before-clarity, which means fewer orders.
- **Check**: Can a buyer message a seller before purchasing?

### No Read Receipts / Response Time Signal
Buyer sends message, doesn't know if seller is active. Sellers with slow response times destroy buyer confidence in the platform.
- **Check**: Is seller response time shown? Last active timestamp?
