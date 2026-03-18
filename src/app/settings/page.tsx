import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SettingsClient from "@/components/forms/SettingsClient";

export default async function SettingsPage() {
  const session = await auth();
  const userId = (session?.user as any)?.userId;
  if (!userId) redirect("/login");

  return (
    <main className="page" style={{ background: "var(--background)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 580, margin: "0 auto", padding: "2rem 1.25rem 5rem" }}>
        <div style={{ marginBottom: "1.75rem" }}>
          <div style={{ fontFamily: "Space Mono, monospace", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8", marginBottom: "0.4rem" }}>
            — Settings
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--foreground)", letterSpacing: "-0.02em" }}>
            Preferences
          </h1>
          <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
            Customize your Crewboard experience.
          </p>
        </div>
        <SettingsClient />
      </div>
    </main>
  );
}
