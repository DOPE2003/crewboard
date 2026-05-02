"use client";

import { useState, useTransition, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { updateJob } from "@/actions/jobs";

const CATEGORIES = ["Development", "Design", "Marketing", "Community", "Research", "Other"];

const inputStyle: React.CSSProperties = {
  width: "100%", height: 48, padding: "0 14px",
  border: "1px solid var(--card-border)", borderRadius: 10,
  background: "var(--background)", color: "var(--foreground)",
  fontSize: "0.9rem", outline: "none", boxSizing: "border-box",
  fontFamily: "inherit", transition: "border-color 0.15s",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontWeight: 600, fontSize: "0.78rem",
  color: "var(--text-muted)", marginBottom: 7,
};

type Job = {
  id: string;
  title: string;
  company: string;
  budget: string;
  category: string;
  tags: string[];
  description: string;
  status: string;
};

export default function EditJobPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [job, setJob] = useState<Job | null>(null);
  const [category, setCategory] = useState("Development");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { router.replace("/jobs"); return; }
        setJob(data);
        setCategory(data.category ?? "Development");
      })
      .catch(() => router.replace("/jobs"))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    fd.set("category", category);
    startTransition(async () => {
      try {
        await updateJob(id, fd);
      } catch (err: any) {
        if (err?.message?.includes("NEXT_REDIRECT")) return;
        setError(err?.message ?? "Something went wrong.");
      }
    });
  }

  if (loading) {
    return (
      <main className="page" style={{ minHeight: "100vh" }}>
        <div style={{ maxWidth: 620, margin: "0 auto", padding: "3rem 1.5rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Loading…
        </div>
      </main>
    );
  }

  if (!job) return null;

  return (
    <main className="page" style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "clamp(2rem,5vw,3rem) 1.5rem 6rem" }}>

        <Link href={`/jobs/${id}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: "0.82rem", textDecoration: "none", marginBottom: 28 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back to job
        </Link>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#14B8A6", marginBottom: "0.4rem" }}>
            Edit Job
          </div>
          <h1 style={{ fontWeight: 700, fontSize: "clamp(1.4rem,4vw,1.8rem)", color: "var(--foreground)", lineHeight: 1.1, margin: "0 0 8px" }}>
            Update your job post
          </h1>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          <div>
            <label style={labelStyle}>Job title <span style={{ color: "#ef4444" }}>*</span></label>
            <input name="title" defaultValue={job.title} required style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Company or project name <span style={{ color: "#ef4444" }}>*</span></label>
            <input name="company" defaultValue={job.company} required style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Budget <span style={{ color: "#ef4444" }}>*</span></label>
            <input name="budget" defaultValue={job.budget} required style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Category</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CATEGORIES.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setCategory(opt)}
                  style={{
                    padding: "7px 16px", borderRadius: 99, cursor: "pointer",
                    border: `1.5px solid ${category === opt ? "#14B8A6" : "var(--card-border)"}`,
                    background: category === opt ? "#14B8A6" : "transparent",
                    color: category === opt ? "#fff" : "var(--foreground)",
                    fontFamily: "inherit", fontWeight: 500,
                    fontSize: "0.82rem", transition: "all 0.15s",
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Tags (comma separated)</label>
            <input name="tags" defaultValue={job.tags.join(", ")} placeholder="e.g. Solidity, React, DeFi" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Description <span style={{ color: "#ef4444" }}>*</span></label>
            <textarea
              name="description"
              defaultValue={job.description}
              required
              rows={6}
              style={{ ...inputStyle, height: "auto", padding: "12px 14px", resize: "vertical", lineHeight: 1.65, fontSize: "0.875rem" }}
            />
          </div>

          {error && <p style={{ fontSize: "0.82rem", color: "#ef4444", margin: 0 }}>{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            style={{
              padding: "0.85rem", borderRadius: 10,
              background: isPending ? "var(--card-border)" : "#14B8A6",
              color: isPending ? "var(--text-muted)" : "#fff",
              border: "none", cursor: isPending ? "not-allowed" : "pointer",
              fontWeight: 600, fontSize: "0.9rem",
              transition: "background 0.15s",
              boxShadow: isPending ? "none" : "0 2px 10px rgba(20,184,166,0.28)",
            }}
          >
            {isPending ? "Saving…" : "Save changes →"}
          </button>

        </form>
      </div>
    </main>
  );
}
