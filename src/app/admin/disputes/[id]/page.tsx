import { requireStaff } from "@/lib/auth-utils";
import db from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import DisputeResolveActions from "@/components/admin/DisputeResolveActions";

export default async function AdminDisputeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      gig:    { select: { title: true, category: true, description: true } },
      buyer:  { select: { id: true, name: true, twitterHandle: true, image: true, walletAddress: true } },
      seller: { select: { id: true, name: true, twitterHandle: true, image: true, walletAddress: true } },
    },
  });

  if (!order) notFound();

  // Fetch conversation + last 20 messages between buyer and seller
  const conversation = await db.conversation.findFirst({
    where: { AND: [{ participants: { has: order.buyerId } }, { participants: { has: order.sellerId } }] },
    select: { id: true },
  });

  const messages = conversation ? (await db.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: { sender: { select: { twitterHandle: true, name: true } } },
  })).filter((m) => !m.body.startsWith("__GIGREQUEST__")) : [];

  const CARD = {
    background: "var(--card-bg)",
    borderRadius: 14,
    border: "1px solid var(--card-border)",
    padding: "1.5rem",
    marginBottom: "1rem",
  } as const;

  const canResolve = !!order.buyer.walletAddress && !!order.seller.walletAddress && !!order.escrowAddress;

  return (
    <main className="page" style={{ background: "var(--background)", minHeight: "100vh" }}>
      <div className="admin-content" style={{ maxWidth: 780 }}>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "2rem" }}>
          <Link href="/admin/disputes" style={{ fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "none", fontWeight: 600 }}>
            ← All Disputes
          </Link>
          <span style={{ color: "var(--card-border)" }}>·</span>
          <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 10px", borderRadius: 99, background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
            DISPUTED
          </span>
        </div>

        {/* Order summary */}
        <div style={CARD}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>
                {order.gig.category}
              </div>
              <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--foreground)", margin: "0 0 0.5rem" }}>{order.gig.title}</h1>
              {order.gig.description && (
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.6, margin: 0, maxWidth: 500 }}>{order.gig.description}</p>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#ef4444" }}>${order.amount}</div>
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>USDC in escrow</div>
            </div>
          </div>

          {order.txHash && (
            <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--card-border)" }}>
              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Escrow TX: </span>
              <a
                href={`https://explorer.solana.com/tx/${order.txHash}`}
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize: "0.65rem", color: "#14b8a6", fontFamily: "monospace" }}
              >
                {order.txHash.slice(0, 20)}…↗
              </a>
            </div>
          )}
        </div>

        {/* Parties */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
          {[
            { label: "Buyer", user: order.buyer },
            { label: "Seller", user: order.seller },
          ].map(({ label, user }) => (
            <div key={label} style={{ ...CARD, marginBottom: 0 }}>
              <div style={{ fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.75rem" }}>{label}</div>
              <Link href={`/u/${user.twitterHandle}`} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: "0.75rem" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", background: "var(--avatar-bg)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {user.image
                    ? <img src={user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#fff", background: "#14b8a6", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>{(user.name ?? user.twitterHandle ?? "?")[0].toUpperCase()}</span>
                  }
                </div>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--foreground)" }}>{user.name ?? user.twitterHandle}</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>@{user.twitterHandle}</div>
                </div>
              </Link>
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontFamily: "monospace", wordBreak: "break-all" }}>
                {user.walletAddress
                  ? <span style={{ color: "#14b8a6" }}>{user.walletAddress}</span>
                  : <span style={{ color: "#ef4444" }}>No wallet connected</span>
                }
              </div>
            </div>
          ))}
        </div>

        {/* Message thread */}
        {messages.length > 0 && (
          <div style={CARD}>
            <div style={{ fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Message Thread ({messages.length} messages)
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", maxHeight: 360, overflowY: "auto" }}>
              {messages.map((msg) => {
                const isBuyer = msg.senderId === order.buyerId;
                return (
                  <div key={msg.id} style={{ display: "flex", flexDirection: isBuyer ? "row" : "row-reverse", gap: 8 }}>
                    <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", whiteSpace: "nowrap", paddingTop: 4 }}>
                      @{msg.sender.twitterHandle}
                    </div>
                    <div style={{
                      maxWidth: "70%", padding: "0.5rem 0.85rem", borderRadius: 10, fontSize: "0.8rem", lineHeight: 1.5,
                      background: isBuyer ? "rgba(20,184,166,0.1)" : "var(--card-bg)",
                      border: `1px solid ${isBuyer ? "rgba(20,184,166,0.2)" : "var(--card-border)"}`,
                      color: "var(--foreground)",
                    }}>
                      {msg.body}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Resolve actions */}
        <div style={CARD}>
          <div style={{ fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#ef4444", marginBottom: "1rem", fontWeight: 700 }}>
            Admin Resolution
          </div>
          {!canResolve ? (
            <div style={{ padding: "1rem", borderRadius: 10, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", fontSize: "0.8rem", color: "#f59e0b", lineHeight: 1.6 }}>
              Cannot resolve on-chain:{" "}
              {!order.escrowAddress && "no escrow address on record. "}
              {!order.buyer.walletAddress && "buyer has no wallet. "}
              {!order.seller.walletAddress && "seller has no wallet. "}
              <br />You can still manually update the order status from the <Link href={`/admin/orders?status=disputed`} style={{ color: "#f59e0b" }}>Orders page</Link>.
            </div>
          ) : (
            <DisputeResolveActions
              orderId={order.id}
              buyerWallet={order.buyer.walletAddress!}
              sellerWallet={order.seller.walletAddress!}
              amount={order.amount}
              gigTitle={order.gig.title}
            />
          )}
        </div>

      </div>
    </main>
  );
}
