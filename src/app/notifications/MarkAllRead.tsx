"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { markAllNotificationsAsRead } from "@/actions/notifications";
import { useLanguage } from "@/contexts/LanguageContext";

export default function MarkAllRead({ userId }: { userId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { t } = useLanguage();

  const handleClick = async () => {
    startTransition(async () => {
      await markAllNotificationsAsRead();
      router.refresh();
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      style={{
        fontFamily: "Inter, sans-serif",
        fontWeight: 700,
        fontSize: "0.78rem",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "#2DD4BF",
        background: "none",
        border: "1px solid #2DD4BF",
        borderRadius: 8,
        padding: "0.4rem 0.9rem",
        cursor: "pointer",
        opacity: pending ? 0.5 : 1,
        transition: "opacity 0.2s",
        flexShrink: 0,
      }}
    >
      {pending ? "…" : t("notif.markAll")}
    </button>
  );
}
