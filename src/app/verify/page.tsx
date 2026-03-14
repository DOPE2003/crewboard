import { auth } from "@/auth";
import { redirect } from "next/navigation";
import VerifyClient from "./VerifyClient";

export default async function VerifyPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if ((session.user as any).humanVerified) redirect("/dashboard");

  return (
    <main className="page verify-page-wrap" style={{
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      background: "#0f1624",
      padding: "3rem 1.5rem 4rem",
      minHeight: "100vh",
    }}>
      <div className="verify-card-inner verify-card" style={{
        width: "min(480px, 100%)",
        background: "#1e2433",
        borderRadius: 24,
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "2.5rem 2rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.5rem",
        textAlign: "center",
      }}>
        <div style={{ fontFamily: "Space Mono, monospace", fontSize: "0.6rem", letterSpacing: "0.18em", color: "#2DD4BF", textTransform: "uppercase" }}>
          — CREWBOARD
        </div>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f1f5f9", margin: 0 }}>
          Verify You&apos;re Human
        </h1>
        <p style={{ fontSize: "0.82rem", color: "#94a3b8", lineHeight: 1.7, margin: 0, maxWidth: 360 }}>
          A quick identity check is required to access Crewboard.
        </p>
        <VerifyClient />
      </div>
    </main>
  );
}
