"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { startConversation } from "@/actions/messages";
import SendOfferModal from "./SendOfferModal";

interface Props {
  recipientId: string;
  recipientName?: string;
}

export default function ContactButtons({ recipientId, recipientName = "this freelancer" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [msgPending, startMsg] = useTransition();
  const [showOffer, setShowOffer] = useState(false);

  function handleMessage() {
    startMsg(async () => {
      try {
        const { redirectTo } = await startConversation(recipientId);
        if (redirectTo === "/login") {
          router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
        } else {
          router.push(redirectTo);
        }
      } catch (err: any) {
        alert(err?.message ?? "Something went wrong");
      }
    });
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {/* Send Offer — primary CTA */}
        <button
          onClick={() => setShowOffer(true)}
          disabled={msgPending}
          style={{
            width: "100%", padding: "0.75rem", borderRadius: 8,
            background: "#14b8a6", color: "#000", fontWeight: 700,
            fontSize: "0.82rem", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            transition: "opacity 0.15s",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z"/>
          </svg>
          Send Offer
        </button>

        {/* Message — secondary */}
        <button
          onClick={handleMessage}
          disabled={msgPending}
          style={{
            width: "100%", padding: "0.75rem", borderRadius: 8,
            background: "transparent", color: "var(--foreground)", fontWeight: 600,
            fontSize: "0.82rem", border: "1px solid var(--card-border)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            transition: "border-color 0.15s",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {msgPending ? "..." : "Message"}
        </button>
      </div>

      {showOffer && (
        <SendOfferModal
          recipientId={recipientId}
          recipientName={recipientName}
          onClose={() => setShowOffer(false)}
        />
      )}
    </>
  );
}
