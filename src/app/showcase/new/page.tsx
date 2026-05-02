import { auth } from "@/auth";
import { redirect } from "next/navigation";
import NewPostForm from "./NewPostForm";

export const metadata = { title: "Post your work — Crewboard" };

export default async function NewShowcasePostPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <main style={{ minHeight: "calc(100vh - 56px)", background: "var(--bg)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2.5rem 1.25rem" }}>
        <div style={{ marginBottom: "1.75rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text)", margin: 0, letterSpacing: "-0.02em" }}>
            Post your work
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.3rem", fontSize: "0.875rem" }}>
            Share a project, design, or anything you&apos;re proud of.
          </p>
        </div>
        <NewPostForm />
      </div>
    </main>
  );
}
