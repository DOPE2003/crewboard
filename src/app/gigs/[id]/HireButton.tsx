"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "@/actions/orders";

export default function HireButton({ gigId }: { gigId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleHire() {
    setLoading(true);
    setError("");
    try {
      const order = await createOrder(gigId);
      // For now, redirect to dashboard. Later, we'll redirect to a payment page.
      router.push("/dashboard");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ width: "100%" }}>
      <button
        onClick={handleHire}
        disabled={loading}
        className="btn-primary"
        style={{ width: "100%", cursor: "pointer", marginBottom: "0.5rem" }}
      >
        {loading ? "PROCESSING..." : "HIRE NOW / LOCK FUNDS"}
      </button>
      {error && <div style={{ fontSize: "0.75rem", color: "#ef4444", textAlign: "center" }}>{error}</div>}
    </div>
  );
}
