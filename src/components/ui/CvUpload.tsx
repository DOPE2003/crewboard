"use client";

import { useRef, useState } from "react";

interface Props {
  currentCvUrl: string | null;
}

export default function CvUpload({ currentCvUrl }: Props) {
  const [cvUrl, setCvUrl] = useState<string | null>(currentCvUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { setError("Only PDF files are allowed."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("File too large (max 5 MB)."); return; }

    setError(null);
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/user/cv", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setCvUrl(json.url);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove() {
    setUploading(true);
    try {
      await fetch("/api/user/cv", { method: "DELETE" });
      setCvUrl(null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {cvUrl ? (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#0f172a" }}>CV / Resume</div>
            <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: 1 }}>PDF uploaded</div>
          </div>
          <a
            href={cvUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: "0.72rem", fontWeight: 600, color: "#2DD4BF", textDecoration: "none", flexShrink: 0 }}
          >
            View
          </a>
          <button
            onClick={remove}
            disabled={uploading}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 2, flexShrink: 0 }}
            title="Remove CV"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      ) : (
        <label style={{
          display: "flex", alignItems: "center", gap: "0.6rem",
          padding: "0.7rem 1rem", borderRadius: 10,
          border: "2px dashed #cbd5e1", background: "#f8fafc",
          cursor: uploading ? "wait" : "pointer",
          transition: "border-color 0.15s",
        }}>
          <input ref={inputRef} type="file" accept=".pdf,application/pdf" onChange={handleFile} style={{ display: "none" }} />
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={uploading ? "#94a3b8" : "#2DD4BF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <div>
            <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#0f172a" }}>
              {uploading ? "Uploading…" : "Upload CV / Resume"}
            </div>
            <div style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: 1 }}>PDF only · max 5 MB</div>
          </div>
        </label>
      )}
      {error && <div style={{ fontSize: "0.72rem", color: "#ef4444", marginTop: "0.4rem" }}>{error}</div>}
    </div>
  );
}
