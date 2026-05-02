"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function HeartbeatPing() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user) return;

    const ping = () => fetch("/api/user/heartbeat", { method: "POST" }).catch(() => {});
    ping(); // immediately on mount
    const id = setInterval(ping, 2 * 60 * 1000); // every 2 min
    return () => clearInterval(id);
  }, [session?.user]);

  return null;
}
