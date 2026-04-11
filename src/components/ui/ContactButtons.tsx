"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import { startConversation, hireFromProfile } from "@/actions/messages";

interface Props {
  recipientId: string;
}

export default function ContactButtons({ recipientId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [msgPending, startMsg] = useTransition();
  const [hirePending, startHire] = useTransition();

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

  function handleHire() {
    startHire(async () => {
      try {
        const { redirectTo } = await hireFromProfile(recipientId);
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
    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      <button
        onClick={handleMessage}
        disabled={msgPending || hirePending}
        style={{
          width: "100%", padding: "0.75rem", borderRadius: 8,
          background: "#0f172a", color: "#fff", fontWeight: 700,
          fontSize: "0.82rem", border: "none", cursor: "pointer",
        }}
      >
        {msgPending ? "..." : "Message"}
      </button>
      <button
        onClick={handleHire}
        disabled={msgPending || hirePending}
        style={{
          width: "100%", padding: "0.75rem", borderRadius: 8,
          background: "rgba(45,212,191,0.08)", color: "#0d9488", fontWeight: 700,
          fontSize: "0.82rem", border: "1px solid rgba(45,212,191,0.3)", cursor: "pointer",
        }}
      >
        {hirePending ? "..." : "Hire"}
      </button>
    </div>
  );
}
