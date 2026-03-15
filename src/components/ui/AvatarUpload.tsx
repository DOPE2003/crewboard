"use client";

import { useRef, useState } from "react";

export default function AvatarUpload({ currentImage, name }: { currentImage?: string | null; name?: string | null }) {
  const [preview, setPreview] = useState(currentImage ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("Max 2MB"); return; }
    setError("");
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();

    if (!res.ok) { setError(data.error || "Upload failed"); setUploading(false); return; }

    // Save to DB
    await fetch("/api/user/avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: data.url }),
    });

    setUploading(false);
  }

  return (
    <div style={{ position: "relative", width: 90, height: 90, flexShrink: 0 }}>
      {/* Avatar */}
      <div style={{
        width: 90, height: 90, borderRadius: "50%",
        background: "linear-gradient(135deg,#134e4a,#0f172a)",
        overflow: "hidden", border: "3px solid #f1f5f9",
      }}>
        {preview
          ? <img src={preview} alt={name ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : null
        }
      </div>

      {/* Camera overlay button */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        title="Change photo"
        style={{
          position: "absolute", bottom: 2, right: 2,
          width: 26, height: 26, borderRadius: "50%",
          background: "#0f172a", border: "2px solid #fff",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          padding: 0,
        }}
      >
        {uploading ? (
          <div style={{ width: 10, height: 10, border: "2px solid #2dd4bf", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        )}
      </button>

      <input ref={fileRef} type="file" accept="image/*" onChange={handleChange} style={{ display: "none" }} />
      {error && <div style={{ position: "absolute", top: "100%", left: 0, fontSize: "0.65rem", color: "#ef4444", marginTop: 4, whiteSpace: "nowrap" }}>{error}</div>}
    </div>
  );
}
