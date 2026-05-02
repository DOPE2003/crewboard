import { auth } from "@/auth";
import db from "@/lib/db";
import { redirect } from "next/navigation";
import OfferCard from "./OfferCard";

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
      <div style={{ maxWidth: 1100, width: "100%", margin: "0 auto", padding: "2rem 1.5rem" }}>

        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontSize: "0.55rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#14B8A6", fontWeight: 700, marginBottom: 6 }}>
            OFFERS
          </div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--foreground)", margin: 0 }}>My Offers</h1>
        </div>

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
