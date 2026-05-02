"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteShowcasePost } from "@/actions/admin";

export function ShowcaseDeleteButton({ postId }: { postId: string }) {
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const router = useRouter();

  async function handle() {
    setLoading(true);
    try { await deleteShowcasePost(postId); router.refresh(); }
    catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  }

  if (confirm) {
    return (
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={handle} disabled={loading} style={{
          padding: "0.35rem 0.75rem", borderRadius: 6, fontSize: "0.7rem", fontWeight: 700,
          background: "#ef4444", border: "none", color: "#fff", cursor: "pointer",
        }}>{loading ? "..." : "Confirm"}</button>
        <button onClick={() => setConfirm(false)} style={{
          padding: "0.35rem 0.75rem", borderRadius: 6, fontSize: "0.7rem", fontWeight: 600,
          background: "transparent", border: "1px solid var(--card-border)", color: "var(--text-muted)", cursor: "pointer",
        }}>Cancel</button>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirm(true)} style={{
      padding: "0.4rem 0.85rem", borderRadius: 6, fontSize: "0.7rem", fontWeight: 700,
      border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)",
      color: "#ef4444", cursor: "pointer",
    }}>
      Remove
    </button>
  );
}
