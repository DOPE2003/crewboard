import { auth } from "@/auth";
import db from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:  { label: "Pending",  color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)"  },
  accepted: { label: "Accepted", color: "#14B8A6", bg: "rgba(20,184,166,0.08)",  border: "rgba(20,184,166,0.2)"  },
  declined: { label: "Declined", color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)"   },
};

export default async function OffersPage() {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) redirect("/login");

  const [sent, received] = await Promise.all([
    db.offer.findMany({
      where: { senderId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        receiver: { select: { name: true, twitterHandle: true, image: true } },
        order: { select: { id: true, status: true } },
      },
    }),
    db.offer.findMany({
      where: { receiverId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { name: true, twitterHandle: true, image: true } },
        order: { select: { id: true, status: true } },
      },
    }),
  ]);

  return (
    <main className="page" style={{ background: "var(--background)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 760, width: "100%", margin: "0 auto", padding: "2rem 1.5rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontSize: "0.55rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#14B8A6", fontWeight: 700, marginBottom: 6 }}>
            OFFERS
          </div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--foreground)", margin: 0 }}>My Offers</h1>
        </div>

        {/* Received offers */}
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Received ({received.length})
          </h2>
          {received.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", background: "var(--card-bg)", borderRadius: 14, border: "1px solid var(--card-border)", color: "var(--text-muted)", fontSize: 14 }}>
              No offers received yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {(received as any[]).map((offer) => (
                <OfferCard key={offer.id} offer={offer} type="received" />
              ))}
            </div>
          )}
        </section>

        {/* Sent offers */}
        <section>
          <h2 style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Sent ({sent.length})
          </h2>
          {sent.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", background: "var(--card-bg)", borderRadius: 14, border: "1px solid var(--card-border)", color: "var(--text-muted)", fontSize: 14 }}>
              No offers sent yet. Start a conversation and click Send Offer.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {(sent as any[]).map((offer) => (
                <OfferCard key={offer.id} offer={offer} type="sent" />
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}

function OfferCard({ offer, type }: { offer: any; type: "sent" | "received" }) {
  const cfg = STATUS_CFG[offer.status] ?? STATUS_CFG.pending;
  const counterpart = type === "sent" ? offer.receiver : offer.sender;
  const displayName = counterpart?.name ?? counterpart?.twitterHandle ?? "Unknown";

  return (
    <div style={{
      background: "var(--card-bg)",
      border: "1px solid var(--card-border)",
      borderRadius: 16,
      padding: "1.25rem 1.5rem",
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Counterpart */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
              background: "#14B8A6", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {counterpart?.image
                ? <img src={counterpart.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{displayName[0]?.toUpperCase()}</span>
              }
            </div>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>{displayName}</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6 }}>
                {type === "sent" ? "— you sent" : "— sent to you"}
              </span>
            </div>
          </div>
          {/* Title */}
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>{offer.title}</div>
          {/* Description */}
          <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {offer.description}
          </div>
        </div>

        {/* Status badge */}
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
          background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
          flexShrink: 0, whiteSpace: "nowrap",
        }}>
          {cfg.label}
        </span>
      </div>

      {/* Amount + delivery + date */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: "#14B8A6" }}>${offer.amount}</span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {offer.deliveryDays} day{offer.deliveryDays !== 1 ? "s" : ""} delivery
        </span>
        <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>
          {new Date(offer.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* CTA row */}
      <div style={{ display: "flex", gap: 8 }}>
        <Link
          href={`/messages/${offer.conversationId}`}
          style={{
            padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: "transparent", border: "1px solid var(--card-border)",
            color: "var(--text-muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5,
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          View Chat
        </Link>

        {/* Accepted — link to order */}
        {offer.status === "accepted" && offer.order && (
          <Link
            href={`/orders/${offer.order.id}`}
            style={{
              padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: "#14B8A6", color: "#fff", textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 5,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            {type === "sent" ? "Fund Escrow →" : "View Order →"}
          </Link>
        )}

        {/* Pending + received → remind them they can accept in chat */}
        {offer.status === "pending" && type === "received" && (
          <Link
            href={`/messages/${offer.conversationId}`}
            style={{
              padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: "rgba(20,184,166,0.1)", color: "#0d9488",
              border: "1px solid rgba(20,184,166,0.2)", textDecoration: "none",
            }}
          >
            Accept / Decline →
          </Link>
        )}

        {/* Declined + sender → link back to chat to resend */}
        {offer.status === "declined" && type === "sent" && (
          <Link
            href={`/messages/${offer.conversationId}`}
            style={{
              padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: "rgba(245,158,11,0.1)", color: "#d97706",
              border: "1px solid rgba(245,158,11,0.2)", textDecoration: "none",
            }}
          >
            Send New Offer →
          </Link>
        )}
      </div>
    </div>
  );
}
