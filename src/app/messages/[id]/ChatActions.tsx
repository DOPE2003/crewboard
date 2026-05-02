"use client";

import { useState } from "react";
import Link from "next/link";
import SendOfferModal from "@/components/chat/SendOfferModal";

interface Props {
  conversationId: string;
  receiverId: string;
  receiverName: string;
  activeOrderId?: string | null;
}

export default function ChatActions({ conversationId, receiverId, receiverName, activeOrderId }: Props) {
  const [showOfferModal, setShowOfferModal] = useState(false);

  return (
    <>
      {/* View Order */}
      {activeOrderId && (
        <Link
          href={`/orders/${activeOrderId}`}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "5px 12px", borderRadius: 8, fontSize: "11px", fontWeight: 700,
            background: "rgba(59,130,246,0.08)", color: "#3b82f6",
            border: "1px solid rgba(59,130,246,0.2)", textDecoration: "none", flexShrink: 0,
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          Order
        </Link>
      )}

      {/* Send Offer button — opens modal */}
      <button
        onClick={() => setShowOfferModal(true)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "5px 12px", borderRadius: 8, fontSize: "11px", fontWeight: 700,
          background: "rgba(20,184,166,0.08)", color: "#0d9488",
          border: "1px solid rgba(20,184,166,0.2)", flexShrink: 0,
          cursor: "pointer", fontFamily: "inherit",
        }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
        </svg>
        Send Offer
      </button>

      <SendOfferModal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        conversationId={conversationId}
        receiverId={receiverId}
        receiverName={receiverName}
      />
    </>
  );
}
