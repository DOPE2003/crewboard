import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  return (
    <main className="page">
      <div style={{ paddingTop: "90px" }} />
      <section style={{ padding: "4rem 2rem", maxWidth: 1060, margin: "0 auto" }}>
        <div
          style={{
            fontFamily: "Space Mono, monospace",
            fontSize: "0.62rem",
            letterSpacing: "0.35em",
            color: "var(--muted)",
            textTransform: "uppercase",
            marginBottom: "1rem",
          }}
        >
          Dashboard
        </div>

        <h1
          style={{
            fontFamily: "Rajdhani, sans-serif",
            fontWeight: 700,
            fontSize: "clamp(2.2rem, 5vw, 3rem)",
            marginBottom: "1rem",
          }}
        >
          Welcome back.
        </h1>

        <p style={{ color: "var(--muted)", lineHeight: 1.8 }}>
          Signed in as <b>{data.user.email}</b>
        </p>
      </section>
    </main>
  );
}