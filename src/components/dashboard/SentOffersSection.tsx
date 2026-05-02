"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { withdrawOffer } from "@/actions/offers";

type Offer = {
  id: string;
  title: string;
  amount: number;
  status: string;
  conversationId: string;
  receiver: { name: string | null; twitterHandle: string; image: string | null };
};

function WithdrawButton({ offerId, title }: { offerId: string; title: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleWithdraw() {
    if (!confirm(`Withdraw "${title}"? It will be permanently deleted.`)) return;
    startTransition(async () => {
      await withdrawOffer(offerId);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleWithdraw}
      disabled={isPending}
      style={{
        fontSize: "0.68rem", fontWeight: 600, padding: "4px 10px", borderRadius: 7,
        background: "transparent", color: "#ef4444",
        border: "1px solid rgba(239,68,68,0.3)",
        cursor: isPending ? "not-allowed" : "pointer",
        opacity: isPending ? 0.5 : 1, fontFamily: "inherit",
      }}
    >
      {isPending ? "…" : "Withdraw"}
    </button>
  );
}

export default function SentOffersSection({ offers }: { offers: Offer[] }) {
  return (
    <div style={{ borderRadius: 14, background: "var(--card-bg)", border: "1px solid var(--card-border)", marginBottom: "1.25rem" }}>
      <div style={{
        padding: "0.75rem 1.25rem",
        borderBottom: "1px solid var(--card-border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "var(--text-muted)" }}>
          Sent Offers
        </span>
        <Link href="/offers" style={{ fontSize: "0.65rem", color: "#14b8a6", textDecoration: "none", fontWeight: 600 }}>
          View all →
        </Link>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {offers.map((offer, i) => {
          const name = offer.receiver.name ?? offer.receiver.twitterHandle;
          const statusColor: Record<string, string> = {
            pending: "#f59e0b", accepted: "#14b8a6", declined: "#ef4444",
          };
          return (
            <div
              key={offer.id}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "0.75rem 1.25rem",
                borderTop: i > 0 ? "1px solid var(--card-border)" : "none",
                flexWrap: "wrap",
              }}
            >
              {offer.receiver.image && (
                <img src={offer.receiver.image} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {offer.title}
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 2 }}>
                  to {name} · ${offer.amount} ·{" "}
                  <span style={{ color: statusColor[offer.status] ?? "var(--text-muted)", fontWeight: 600 }}>
                    {offer.status}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <Link
                  href={`/messages/${offer.conversationId}`}
                  style={{ fontSize: "0.68rem", fontWeight: 600, padding: "4px 10px", borderRadius: 7, border: "1px solid var(--card-border)", color: "var(--foreground)", textDecoration: "none" }}
                >
                  Chat
                </Link>
                {offer.status === "pending" && (
                  <WithdrawButton offerId={offer.id} title={offer.title} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
