"use client";

import { useEffect } from "react";
import { markAllNotificationsAsRead } from "@/actions/notifications";

export default function AutoMarkRead({ userId }: { userId: string }) {
  useEffect(() => {
    markAllNotificationsAsRead().catch(() => {});
  }, [userId]);

  return null;
}
