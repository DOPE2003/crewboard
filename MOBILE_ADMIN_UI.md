# Crewboard Mobile — Admin UI/UX Specification
**For: Tejo (iOS dev)** | Updated: 2026-04-30

---

## 0. Role System

```
USER  <  SUPPORT  <  ADMIN  <  OWNER
```

The JWT returned by `/api/mobile/login` includes a `role` field.
Read it once on launch and gate every admin screen behind it.
**Never derive permissions from response data — always from the JWT role.**

```swift
enum AppRole: String, Codable {
    case user    = "USER"
    case support = "SUPPORT"
    case admin   = "ADMIN"
    case owner   = "OWNER"
}

extension AppRole {
    var rank: Int {
        switch self { case .user: 0; case .support: 1; case .admin: 2; case .owner: 3 }
    }
    func meets(_ min: AppRole) -> Bool { rank >= min.rank }
}
```

Show the admin tab/dashboard **only if** `role.meets(.support)`.

---

## 1. Tab Bar

| Role    | Tabs shown                                           |
|---------|------------------------------------------------------|
| user    | Home · Browse · Jobs · Messages · Profile            |
| support | Home · Browse · Jobs · Messages · Profile · **Admin**|
| admin   | same as support                                      |
| owner   | same as support                                      |

The **Admin** tab icon: shield or grid icon.
Badge on Admin tab = count of open disputes (`GET /api/mobile/admin/stats` → `pendingDisputes`).

---

## 2. Admin Root Screen

URL: `GET /api/mobile/admin/stats` (returns `totalUsers, activeGigs, totalOrders, completedOrders, pendingDisputes, totalRevenueLamports`)

```
┌──────────────────────────────────────────────┐
│  OWNER DASHBOARD          [OWNER badge pill] │
│                                              │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌─────────┐  │
│  │ 2,401 │ │  148  │ │  12   │ │ $42,100 │  │
│  │ Users │ │Orders │ │Disput │ │ Revenue │  │
│  └───────┘ └───────┘ └───────┘ └─────────┘  │
│                                              │
│  ──────── SECTIONS ────────                  │
│  [👥 Users]        ADMIN+                   │
│  [📦 Orders]       SUPPORT+                 │
│  [⚖️ Disputes]     SUPPORT+                 │
│  [📊 Analytics]    ADMIN+  (OWNER only full)│
└──────────────────────────────────────────────┘
```

- OWNER sees all 4 sections + "Revenue" stat card.
- ADMIN sees Users, Orders, Disputes, Analytics (no revenue).
- SUPPORT sees Orders and Disputes only. No Users section.
- Stats fetched once on appear; pull-to-refresh updates them.

---

## 3. Users Section (ADMIN+)

`GET /api/mobile/admin/users?page=1&limit=20&search=&role=`

### 3a. User List

```
┌──────────────────────────────────────────────┐
│ [← Back]     USERS          [🔍] [Filter ▾] │
├──────────────────────────────────────────────┤
│ [Search bar]                                 │
├──────────────────────────────────────────────┤
│ 🟢 Saad Ait Hammou    @saad190914            │
│    OWNER  [OG]  ✅ Verified   2 orders      │
│                                              │
│ 🟡 Jane Doe           @janedoe              │
│    ADMIN              3 orders              │
│                                              │
│ ⚫ Bob Builder        @bobbuilder           │
│    USER   [OG]        1 order               │
└──────────────────────────────────────────────┘
```

- Role badge colors: OWNER=teal, ADMIN=red, SUPPORT=purple, USER=gray.
- OG badge: small gold "OG" pill next to name.
- Online indicator: colored dot (green=online <3min, yellow=recent, gray=offline).
- Tap row → User Detail Sheet.

### 3b. User Detail Bottom Sheet

```
┌──────────────────────────────────────────────┐
│         Bob Builder  @bobbuilder             │
│         [OG] USER  ✅ Verified               │
│         bob@email.com                        │
│         Joined 2 months ago                  │
│                                              │
│  Stats: 4 gigs · 12 orders · $1,200 vol      │
│                                              │
│  ── ACTIONS ──────────────────────────────── │
│  [Change Role ▾]          ADMIN+             │
│  [Grant OG Badge]         OWNER only         │
│  [Revoke OG Badge]        OWNER only         │
│  [Delete Account]         OWNER only  🔴     │
└──────────────────────────────────────────────┘
```

**Change Role flow:**
1. Show picker: USER / SUPPORT / ADMIN (OWNER excluded unless caller is OWNER)
2. Confirmation alert: "Change Bob to ADMIN?" [Cancel] [Confirm]
3. `PATCH /api/mobile/admin/users/:id` `{ role: "ADMIN" }`
4. Show success toast. Update badge in list.

**Grant/Revoke OG:**
- Single endpoint: `POST /api/mobile/admin/users/:id/og` `{ action: "grant" | "revoke" }`
- Only show these buttons if `currentUserRole === .owner`
- After grant: show confetti/sparkle animation locally, update OG pill.

**Delete Account:**
- Show destructive confirmation: "Delete Bob's account permanently? This cannot be undone."
- Red "Delete" button, gray "Cancel".
- `DELETE /api/mobile/admin/users/:id`
- Remove from list on success.

---

## 4. Orders Section (SUPPORT+)

`GET /api/mobile/admin/orders?limit=30`

### 4a. Order List

```
┌──────────────────────────────────────────────┐
│ [← Back]    ORDERS           [Filter ▾]      │
├──────────────────────────────────────────────┤
│ Filter pills: All · Pending · Active · Done  │
│               Disputed · Frozen  🔴          │
├──────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐ │
│ │ "Build my Solana dApp"     $500 USDC     │ │
│ │ Buyer: @alice  Seller: @bob              │ │
│ │ Status: [DISPUTED 🔴]     2h ago         │ │
│ │ [View Detail]                            │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ "Logo Design"              $150 USDC     │ │
│ │ Buyer: @carol  Seller: @dave             │ │
│ │ Status: [FUNDED 🟡]       5d ago         │ │
│ │ [View Detail]                            │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

**Status badge colors:**
| Status    | Color  | Icon |
|-----------|--------|------|
| pending   | gray   | 🕐   |
| funded    | yellow | 💰   |
| accepted  | blue   | ✅   |
| delivered | purple | 📦   |
| completed | green  | ✔    |
| cancelled | gray   | ✕    |
| disputed  | red    | ⚖️   |
| frozen    | ice    | 🧊   |

### 4b. Order Detail Screen

```
┌──────────────────────────────────────────────┐
│ [← Orders]   ORDER DETAIL                   │
├──────────────────────────────────────────────┤
│ "Build my Solana dApp"                       │
│ Amount: $500 USDC                            │
│ Status: [DISPUTED 🔴]                        │
│                                              │
│ Buyer:  @alice  [View Profile →]            │
│ Seller: @bob    [View Profile →]            │
│                                              │
│ Escrow: 8xT2...abcd  [Copy]                 │
│ TX Hash: 5yZ1...efgh [View on Explorer →]   │
│                                              │
│ Created: Apr 28 · Updated: Apr 30           │
│                                              │
│ ── ADMIN ACTIONS ── (ADMIN+) ──────────────  │
│                                              │
│ [Freeze Order 🧊]                           │
│   Lock order — block user state changes      │
│                                              │
│ [Cancel Order ✕]    (pending only)          │
│   Remove unfunded order from platform        │
│                                              │
│ ── FINANCIAL ACTIONS ── (ADMIN+) ──────────  │
│                                              │
│ [Force Release →]                           │
│   Release funds to seller                   │
│   (calls build-admin-force-release)          │
│                                              │
│ [Refund Buyer ←]                            │
│   Return funds to buyer                     │
│   (calls build-admin-refund)                │
└──────────────────────────────────────────────┘
```

**UX rules for actions:**
- Disable all action buttons while any action is loading.
- Show loading spinner inside the tapped button only (not a full-screen loader).
- After Freeze: badge changes to 🧊 FROZEN, show Unfreeze button instead.
- After Cancel: navigate back to list.
- Financial actions (Force Release / Refund) open a **confirmation sheet** explaining the on-chain tx:
  ```
  "This will build a Solana transaction for you to sign.
  Once confirmed on-chain, funds will be released."
  [Cancel]  [Build Transaction]
  ```
- Then sign → submit → call sync endpoint → update order status.
- If on-chain verification fails (402): show "Transaction not confirmed yet. Retry in 10s" with auto-retry button.
- Never show raw Solana error strings. Map them:
  - `"Transaction not confirmed"` → "Not confirmed yet. Please retry."
  - `"RPC unavailable"` → "Network busy. Try again in a moment."
  - Any other error → "Something went wrong. Contact support."

**Support role:**
SUPPORT users see Orders section in read-only mode — no action buttons. Only the detail view with status, buyer/seller, and a "Contact Support" note.

---

## 5. Disputes Section (SUPPORT+)

`GET /api/mobile/admin/disputes?status=open`

```
┌──────────────────────────────────────────────┐
│ [← Back]    DISPUTES          [Filter ▾]    │
├──────────────────────────────────────────────┤
│ Filter: Open · Under Review · Resolved · All │
├──────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐ │
│ │ "Logo Design" dispute                    │ │
│ │ Filed by: @alice  vs  @bob               │ │
│ │ Reason: Seller never delivered           │ │
│ │ Status: [OPEN 🔴]    3 days ago          │ │
│ │ [View Dispute →]                         │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### 5a. Dispute Detail

```
┌──────────────────────────────────────────────┐
│ DISPUTE: "Logo Design"                       │
│                                              │
│ Filed by: @alice     Respondent: @bob        │
│ Amount: $150 USDC    Status: OPEN            │
│                                              │
│ Reason: Seller never delivered               │
│ Description: "I paid 5 days ago and..."      │
│                                              │
│ Evidence: [File 1] [File 2]                  │
│                                              │
│ ── Messages ──────────────────────────────── │
│ @alice: "I can prove with screenshots..."   │
│ @bob:   "I delivered to wrong email..."     │
│                                              │
│ ── RESOLUTION (ADMIN+) ──────────────────── │
│                                              │
│ Decision:  ○ Refund Buyer                   │
│            ○ Release to Seller              │
│            ○ Split 50/50                    │
│                                             │
│ Notes: [Text field...]                      │
│                                             │
│ [Resolve Dispute]  (disabled until decision)│
└──────────────────────────────────────────────┘
```

`POST /api/mobile/admin/disputes/:id/resolve` `{ decision, notes }`

- After resolve: status badge changes to RESOLVED ✓.
- Both parties receive push notification automatically.
- SUPPORT role sees the dispute thread but the Resolution section shows "ADMIN required to resolve."

---

## 6. OG Badge UI (All screens)

The OG badge is a small pill/tag rendered wherever a user avatar appears.

**Design spec:**
```
┌─────────────────────────────────────┐
│  [Avatar]  Bob Builder  [OG]        │
│            @bobbuilder              │
└─────────────────────────────────────┘
```

- OG pill: gold/amber background (#F59E0B), white text "OG", 4px border-radius, 8×16px.
- Only render if `user.isOG === true` in the API response.
- Show on: user cards in talent browse, profile screens, admin user list, chat participant headers.

**On profile screen:**
```
┌──────────────────────────────────────┐
│  [Avatar 80px]                       │
│  Bob Builder                         │
│  @bobbuilder  [OG] [✅ Verified]    │
│  AI Engineer                         │
└──────────────────────────────────────┘
```

**Grant animation (admin only):**
When OWNER grants OG badge in admin panel, briefly show a ✨ sparkle animation on the avatar before the OG pill appears.

---

## 7. Analytics Section (ADMIN+, full view OWNER only)

OWNER sees:
- Revenue funnel: pending → funded → accepted → delivered → completed.
- Stuck orders count (funded but not accepted, delivered but not released).
- User growth chart (daily signups last 30 days).
- Top freelancers by completed orders.

ADMIN sees:
- Order funnel only.
- Pending dispute count.

Use simple bar/line charts. No fancy libraries needed — SwiftUI Charts is fine.
Data from: `GET /api/mobile/admin/stats`

---

## 8. UX Principles

### 8.1 Loading states
- Every action button shows an inline spinner on tap.
- Disable ALL action buttons on the same card while one is loading.
- Never show a full-screen blocker for single-item actions.
- For list fetches, show skeleton cells (3–5 rows) while loading.

### 8.2 Errors
Map all API errors to human-readable strings. Never show raw JSON or blockchain hashes in error alerts.

| HTTP | Message                              |
|------|--------------------------------------|
| 401  | "Session expired. Please log in."   |
| 403  | "You don't have permission."        |
| 404  | "Item not found."                   |
| 409  | Use the API `error` field verbatim  |
| 429  | "Too many requests. Wait a moment." |
| 500  | "Something went wrong. Try again."  |

### 8.3 Destructive actions
Always use a 2-step confirmation for destructive actions (delete, cancel, freeze):
1. Primary button tap → show ActionSheet/Alert.
2. Confirmation button is red (`.destructive`).
3. Cancel is always available.

### 8.4 Optimistic UI
- Role badge: update immediately on PATCH success, revert on error.
- OG badge: add pill optimistically, revert on error.
- Order status: do NOT update optimistically — wait for server confirmation (financial actions).

### 8.5 Empty states
Every list screen needs a clear empty state:
- Disputes: "No disputes. Platform is clean ✓"
- Orders: "No orders match this filter."
- Users: "No users found."

---

## 9. API Summary for Admin Screens

| Screen          | Endpoint                                          | Auth     |
|-----------------|---------------------------------------------------|----------|
| Stats           | GET /api/mobile/admin/stats                       | ADMIN+   |
| User list       | GET /api/mobile/admin/users                       | ADMIN+   |
| Change role     | PATCH /api/mobile/admin/users/:id                 | ADMIN+   |
| Delete user     | DELETE /api/mobile/admin/users/:id                | OWNER    |
| Grant/revoke OG | POST /api/mobile/admin/users/:id/og               | OWNER    |
| Order list      | GET /api/mobile/admin/orders                      | SUPPORT+ |
| Order action    | PATCH /api/mobile/admin/orders/:id                | ADMIN+   |
| Force release   | POST /api/mobile/escrow/build-admin-force-release | ADMIN+   |
| Force refund    | POST /api/mobile/escrow/build-admin-refund        | ADMIN+   |
| Dispute list    | GET /api/mobile/admin/disputes                    | SUPPORT+ |
| Resolve dispute | POST /api/mobile/admin/disputes/:id/resolve       | ADMIN+   |

---

## 10. Role Gate Implementation (Swift)

```swift
// In each admin view
struct AdminOrdersView: View {
    @EnvironmentObject var session: SessionStore

    var body: some View {
        Group {
            if session.role.meets(.support) {
                orderListContent
            } else {
                Text("Access denied").foregroundColor(.secondary)
            }
        }
    }
}

// For action buttons
private var actionButtons: some View {
    Group {
        if session.role.meets(.admin) {
            Button("Freeze Order") { freezeOrder() }
            Button("Cancel Order", role: .destructive) { cancelOrder() }
        }
        // Read-only for SUPPORT — no buttons shown
    }
}
```

---

## 11. Security Rules (DO NOT skip)

1. **Never embed role logic in UI only.** The server enforces roles. The UI just hides inaccessible buttons — it doesn't grant access.
2. **Refresh JWT role after role change.** If admin changes their own role (unlikely, server blocks self-demotion), force a re-login.
3. **Audit every action.** The backend already logs every mutation to `AdminActionLog`. You don't need to do anything extra.
4. **Don't cache admin data.** Admin screens should always fetch fresh data on appear. No persistent cache for user list or orders.
5. **Token storage.** JWT must stay in iOS Keychain. Never log it. Never include in error reports.
