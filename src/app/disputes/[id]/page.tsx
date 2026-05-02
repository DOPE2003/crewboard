import { auth } from "@/auth";
import db from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getStaffRole } from "@/lib/auth-utils";
import DisputeThread from "@/components/ui/DisputeThread";

export default async function DisputePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) redirect("/login");

  const staffRole = await getStaffRole();

  const dispute = await db.dispute.findUnique({
    where: { id },
    include: {
      order: {
        select: {
          id: true, amount: true, status: true, buyerId: true, sellerId: true,
          gig:    { select: { title: true, category: true } },
          buyer:  { select: { name: true, twitterHandle: true, image: true } },
          seller: { select: { name: true, twitterHandle: true, image: true } },
        },
      },
      filedBy: { select: { name: true, twitterHandle: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { name: true, twitterHandle: true, image: true } } },
      },
      evidence: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!dispute) notFound();

  const isBuyer  = dispute.order.buyerId  === userId;
  const isSeller = dispute.order.sellerId === userId;
  const isStaff  = !!staffRole;

  if (!isBuyer && !isSeller && !isStaff) notFound();

  const isOpen = dispute.status === "open";
  const res = dispute.resolution as any;

  const statusColor = dispute.status === "open" ? "#ef4444" : "#22c55e";

  return (
    <main className="page">
      <div style={{ maxWidth: 720, width: "100%", margin: "0 auto", padding: "2rem 1.5rem" }}>

        <Link href={`/orders/${dispute.orderId}`} style={{ fontSize: "0.72rem", color: "var(--text-muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: "1.5rem" }}>
          ← Order
        </Link>

        {/* Header */}
        <div style={{ background: "var(--dropdown-bg)", borderRadius: 18, border: `1px solid ${statusColor}33`, padding: "1.5rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: statusColor, fontWeight: 700, marginBottom: 6 }}>
                Dispute · {dispute.order.gig.category}
              </div>
              <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--foreground)", marginBottom: 4 }}>
                {dispute.order.gig.title}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                <strong>Reason:</strong> {dispute.reason}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4 }}>
                Filed by @{dispute.filedBy.twitterHandle}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 700, fontSize: "1.25rem", color: statusColor }}>${dispute.order.amount} USDC</div>
              <span style={{
                display: "inline-block", marginTop: 4,
                fontSize: "0.65rem", fontWeight: 700, padding: "2px 10px", borderRadius: 99,
                background: `${statusColor}18`, color: statusColor,
              }}>
                {dispute.status.toUpperCase()}
              </span>
            </div>
          </div>

          {res && (
            <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--card-border)", fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Resolution: <strong style={{ color: "var(--foreground)" }}>{res.decision}</strong>
              {res.notes && <> — {res.notes}</>}
            </div>
          )}
        </div>

        {/* Parties */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
          {[
            { label: "Buyer",  user: dispute.order.buyer  },
            { label: "Seller", user: dispute.order.seller },
          ].map(({ label, user }) => (
            <div key={label} style={{ background: "var(--dropdown-bg)", borderRadius: 12, border: "1px solid var(--card-border)", padding: "0.85rem 1rem" }}>
              <div style={{ fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.5rem" }}>{label}</div>
              <Link href={`/u/${user.twitterHandle}`} style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", background: "#14b8a6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {user.image
                    ? <img src={user.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                    : <span style={{ fontSize: "0.65rem", color: "#fff", fontWeight: 700 }}>{(user.name ?? user.twitterHandle ?? "?")[0].toUpperCase()}</span>
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

        <DisputeThread
          disputeId={id}
          messages={dispute.messages.map((m) => ({
            id: m.id,
            body: m.body,
            isSystem: m.isSystem,
            createdAt: m.createdAt.toISOString(),
            isMine: m.senderId === userId,
            sender: m.sender ? { name: m.sender.name, twitterHandle: m.sender.twitterHandle, image: m.sender.image } : null,
          }))}
          evidence={dispute.evidence.map((e) => ({
            id: e.id, type: e.type, url: e.url, text: e.text,
            createdAt: e.createdAt.toISOString(),
          }))}
          canReply={isOpen && (isBuyer || isSeller || isStaff)}
          isAdmin={isStaff && isOpen}
          orderId={dispute.orderId}
        />

      </div>
    </main>
  );
}
