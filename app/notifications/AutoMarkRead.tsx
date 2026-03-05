"use client";

import { useEffect } from "react";

export default function AutoMarkRead({ userId }: { userId: string }) {
  useEffect(() => {
    fetch("/api/notifications/read-all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
  }, [userId]);

  return null;
}
