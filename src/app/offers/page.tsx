import { auth } from "@/auth";
import db from "@/lib/db";
import { redirect } from "next/navigation";
import OffersClient from "./OffersClient";

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
      <div style={{ maxWidth: 900, width: "100%", margin: "0 auto", padding: "2rem 1.5rem" }}>

        <div style={{ marginBottom: "1.75rem" }}>
          <div style={{ fontSize: "0.55rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#14B8A6", fontWeight: 700, marginBottom: 5 }}>
            OFFERS
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--foreground)", margin: 0 }}>
            My Offers
          </h1>
        </div>

        <OffersClient sent={sent as any} received={received as any} />

      </div>
    </main>
  );
}
