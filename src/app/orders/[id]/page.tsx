import { auth } from "@/auth";
import db from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import ReviewForm from "@/components/ui/ReviewForm";
import EscrowActions from "@/components/ui/EscrowActionsLoader";
import { reRequestOrder } from "@/actions/orders";
import ActionButton from "@/components/ui/ActionButton";

function hexAlpha(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const STATUS_STEPS = ["pending", "accepted", "delivered", "completed"];

const STATUS_COLORS: Record<string, string> = {
  pending:   "#f59e0b",
  accepted:  "#3b82f6",
  delivered: "#8b5cf6",
  completed: "#22c55e",
  cancelled: "#94a3b8",
  disputed:  "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  pending:   "Pending acceptance",
  accepted:  "In Progress",
  delivered: "Delivered — awaiting confirmation",
  completed: "Completed",
  cancelled: "Cancelled",
  disputed:  "Disputed",
};

const CARD = {
  background: "var(--dropdown-bg)",
  borderRadius: 18,
  border: "1px solid var(--card-border)",
  padding: "1.5rem",
  marginBottom: "1rem",
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
} as const;

const CARD_SM = {
  background: "var(--dropdown-bg)",
  borderRadius: 14,
  border: "1px solid var(--card-border)",
  padding: "1.25rem 1.5rem",
  marginBottom: "1rem",
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
} as const;

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) redirect("/login");

  const order = await db.order.findUnique({
    where: { id },
    include: {
      gig: { select: { id: true, title: true, category: true, deliveryDays: true, description: true } },
      buyer: { select: { id: true, name: true, twitterHandle: true, image: true, walletAddress: true } },
      seller: { select: { id: true, name: true, twitterHandle: true, image: true, walletAddress: true } },
    },
  });

  if (!order || (order.buyerId !== userId && order.sellerId !== userId)) notFound();

  const isBuyer = order.buyerId === userId;
  const isSeller = order.sellerId === userId;
  const isActive = !["completed", "cancelled", "disputed"].includes(order.status);
  const showActions = order.status !== "cancelled";
  const stepIndex = STATUS_STEPS.indexOf(order.status);

  const other = isBuyer ? order.seller : order.buyer;
  const revieweeId = isBuyer ? order.sellerId : order.buyerId;

  const [convId, existingReview, reviews] = await Promise.all([
    db.conversation.findFirst({
      where: { AND: [{ participants: { has: order.buyerId } }, { participants: { has: order.sellerId } }] },
      select: { id: true },
    }),
    order.status === "completed"
      ? db.review.findUnique({ where: { orderId_reviewerId: { orderId: id, reviewerId: userId } } })
      : Promise.resolve(null),
    order.status === "completed"
      ? db.review.findMany({
          where: { orderId: id },
          include: { reviewer: { select: { name: true, twitterHandle: true, image: true } } },
          orderBy: { createdAt: "asc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <main className="page">
      <div style={{ maxWidth: 680, width: "100%", margin: "0 auto", padding: "2rem 1.5rem" }}>

        <Link href="/orders" style={{ fontSize: "0.72rem", color: "var(--text-muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: "1.5rem", fontFamily: "Inter, sans-serif" }}>
          ← All Orders
        </Link>

        {/* Header card */}
        <div style={CARD}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.55rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>
                {order.gig.category}
              </div>
              <h1 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--foreground)", margin: 0, fontFamily: "Inter, sans-serif" }}>{order.gig.title}</h1>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1.4rem", color: "#2DD4BF" }}>${order.amount}</div>
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: 2 }}>{order.gig.deliveryDays} day{order.gig.deliveryDays !== 1 ? "s" : ""} delivery</div>
            </div>
          </div>

          {/* Status badge */}
          <div style={{ marginTop: "1.1rem", display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 99, background: hexAlpha(STATUS_COLORS[order.status], 0.07), border: `1px solid ${hexAlpha(STATUS_COLORS[order.status], 0.25)}` }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_COLORS[order.status] }} />
            <span style={{ fontSize: "0.7rem", fontWeight: 600, color: STATUS_COLORS[order.status], fontFamily: "Inter, sans-serif" }}>{STATUS_LABELS[order.status]}</span>
          </div>
        </div>

        {/* Progress bar */}
        {isActive && stepIndex >= 0 && (
          <div style={CARD_SM}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "1rem" }}>Progress</div>
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              {STATUS_STEPS.map((step, i) => {
                const done = i <= stepIndex;
                const label = { pending: "Placed", accepted: "Accepted", delivered: "Delivered", completed: "Done" }[step];
                return (
                  <div key={step} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                    {i > 0 && (
                      <div style={{ position: "absolute", left: "-50%", top: 10, width: "100%", height: 2, background: done ? "#2DD4BF" : "var(--card-border)", zIndex: 0 }} />
                    )}
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: done ? "#2DD4BF" : "var(--avatar-bg)", border: `2px solid ${done ? "#2DD4BF" : "var(--card-border)"}`, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {done && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <div style={{ fontSize: "0.58rem", color: done ? "#2DD4BF" : "var(--text-muted)", marginTop: 5, fontWeight: done ? 600 : 400, fontFamily: "Inter, sans-serif" }}>{label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Parties */}
        <div className="order-parties-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
          {[
            { label: "Buyer", user: order.buyer },
            { label: "Seller", user: order.seller },
          ].map(({ label, user }) => (
            <div key={label} style={{ background: "var(--dropdown-bg)", borderRadius: 14, border: "1px solid var(--card-border)", padding: "1rem 1.25rem", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.6rem" }}>{label}</div>
              <Link href={`/u/${user.twitterHandle}`} style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", background: "var(--avatar-bg)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {user.image
                    ? <img src={user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    : <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#fff", background: "#14b8a6", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>{(user.name ?? user.twitterHandle)[0].toUpperCase()}</span>
                  }
                </div>
                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--foreground)" }}>{user.name ?? user.twitterHandle}</div>
                  <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>@{user.twitterHandle}</div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Actions */}
        {showActions && (
          <div style={CARD_SM}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.9rem" }}>Actions</div>
            <EscrowActions
              orderId={order.id}
              orderStatus={order.status}
              orderAmount={order.amount}
              isBuyer={isBuyer}
              isSeller={isSeller}
              sellerWallet={order.seller.walletAddress ?? null}
              buyerWallet={order.buyer.walletAddress ?? null}
              txHash={order.txHash ?? null}
            />
          </div>
        )}

        {/* Re-request (cancelled orders, buyer only) */}
        {order.status === "cancelled" && isBuyer && (
          <div style={CARD_SM}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.9rem" }}>Order Cancelled</div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "0 0 0.9rem" }}>
              This order was cancelled. You can place a new order for the same gig.
            </p>
            <ActionButton
              action={reRequestOrder.bind(null, order.id)}
              className="btn-primary"
              style={{ fontSize: "0.78rem", padding: "0.6rem 1.4rem", cursor: "pointer" }}
            >
              Re-request Order
            </ActionButton>
          </div>
        )}

        {/* Reviews section */}
        {order.status === "completed" && (
          <div style={CARD_SM}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.9rem" }}>Reviews</div>

            {reviews.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" }}>
                {reviews.map((r: any) => (
                  <div key={r.id} style={{ padding: "0.85rem 1rem", borderRadius: 10, background: "rgba(var(--foreground-rgb), 0.025)", border: "1px solid var(--card-border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.4rem" }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", overflow: "hidden", background: "var(--avatar-bg)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {r.reviewer.image
                          ? <img src={r.reviewer.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          : <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#fff" }}>{(r.reviewer.name ?? r.reviewer.twitterHandle)[0].toUpperCase()}</span>
                        }
                      </div>
                      <span style={{ fontSize: "0.73rem", fontWeight: 600, color: "var(--foreground)" }}>{r.reviewer.name ?? r.reviewer.twitterHandle}</span>
                      <span style={{ color: "#f59e0b", fontSize: "0.85rem", letterSpacing: 1 }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                    </div>
                    {r.body && <p style={{ fontSize: "0.73rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>{r.body}</p>}
                  </div>
                ))}
              </div>
            )}

            {!existingReview && (
              <ReviewForm
                orderId={order.id}
                revieweeId={revieweeId}
                revieweeName={other?.name ?? other?.twitterHandle ?? "them"}
              />
            )}
            {existingReview && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>You have already reviewed this order.</div>}
          </div>
        )}

        {/* Message link */}
        {convId && (
          <Link href={`/messages/${convId.id}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.9rem 1.25rem", borderRadius: 12, border: "1px solid var(--card-border)", background: "var(--dropdown-bg)", textDecoration: "none", fontSize: "0.78rem", fontWeight: 600, color: "var(--foreground)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Message {other?.name ?? other?.twitterHandle}
          </Link>
        )}

      </div>
    </main>
  );
}
