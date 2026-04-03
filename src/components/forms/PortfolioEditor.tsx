"use client";

import { useState, useRef } from "react";
import { savePortfolioItems, type PortfolioItem } from "@/actions/portfolio";
import { isSocialMediaUrl, SOCIAL_URL_ERROR } from "@/lib/socialLinks";
import { blobUrl } from "@/lib/blobUrl";

function getMediaType(mimeType: string): "image" | "video" | "pdf" | "document" | "other" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "pdf";
  if (
    mimeType.includes("word") ||
    mimeType.includes("powerpoint") ||
    mimeType.includes("presentation") ||
    mimeType === "application/zip"
  ) return "document";
  return "other";
}

interface Props {
  initialItems: PortfolioItem[];
  handle: string;
}

function genId() {
  return Math.random().toString(36).slice(2);
}

function MediaPreview({ item }: { item: PortfolioItem }) {
  const src = blobUrl(item.mediaUrl);
  if (!src) return null;
  if (item.mediaType === "video") {
    return (
      <div style={{ borderRadius: "8px 8px 0 0", overflow: "hidden", background: "#000", aspectRatio: "16/9" }}>
        <video src={src} controls playsInline preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover" }}>
          <source src={src} type="video/mp4" />
        </video>
      </div>
    );
  }
  if (item.mediaType === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={item.title} style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: "8px 8px 0 0", display: "block" }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
    );
  }
  if (item.mediaType === "pdf") {
    return (
      <a href={src} target="_blank" rel="noopener noreferrer" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fef2f2", borderRadius: "8px 8px 0 0", padding: "16px", textDecoration: "none", gap: 4, aspectRatio: "16/9" }}>
        <span style={{ fontSize: 28 }}>📄</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#dc2626", textAlign: "center", wordBreak: "break-all" }}>{item.fileName ?? "View PDF"}</span>
        <span style={{ fontSize: 10, color: "#9ca3af" }}>Click to open</span>
      </a>
    );
  }
  return (
    <a href={src} target="_blank" rel="noopener noreferrer" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#eff6ff", borderRadius: "8px 8px 0 0", padding: "16px", textDecoration: "none", gap: 4, aspectRatio: "16/9" }}>
      <span style={{ fontSize: 28 }}>📋</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: "#2563eb", textAlign: "center", wordBreak: "break-all" }}>{item.fileName ?? "View File"}</span>
      <span style={{ fontSize: 10, color: "#9ca3af" }}>Click to download</span>
    </a>
  );
}

export default function PortfolioEditor({ initialItems, handle }: Props) {
  const [items, setItems] = useState<PortfolioItem[]>(initialItems);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<PortfolioItem>({ id: "", title: "", description: "", url: "", year: "" });

  const inp: React.CSSProperties = {
    width: "100%", padding: "0.65rem 0.85rem", borderRadius: 8,
    border: "1px solid #e2e8f0", background: "#f8fafc",
    fontFamily: "Inter, sans-serif", fontSize: "16px", color: "#0f172a",
    outline: "none", boxSizing: "border-box",
  };

  async function save(updated: PortfolioItem[]) {
    setSaving(true);
    try { await savePortfolioItems(updated); } finally { setSaving(false); }
  }

  function startAdd() {
    setDraft({ id: genId(), title: "", description: "", url: "", year: new Date().getFullYear().toString() });
    setUrlError(null);
    setUploadError(null);
    setUploadProgress(0);
    setAdding(true);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setIsUploading(true);
    setIsProcessing(false);
    setUploadProgress(0);

    const CHUNK_THRESHOLD = 4 * 1024 * 1024; // files > 4MB use chunked multipart

    try {
      if (file.size <= CHUNK_THRESHOLD) {
        // ── Small file: single XHR ──────────────────────────────────────────
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", `/api/portfolio/upload?filename=${encodeURIComponent(file.name)}`);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.upload.onprogress = (evt) => {
            if (evt.lengthComputable)
              setUploadProgress(Math.min(90, Math.round((evt.loaded / evt.total) * 100)));
          };
          xhr.upload.onload = () => { setUploadProgress(90); setIsProcessing(true); };
          xhr.onload = () => {
            if (xhr.status === 200) {
              try {
                const data = JSON.parse(xhr.responseText);
                setDraft(d => ({
                  ...d, mediaUrl: data.url, mediaType: data.mediaType,
                  fileName: data.fileName, fileSize: data.fileSize,
                  title: d.title || file.name.replace(/\.[^/.]+$/, ""),
                }));
                setUploadProgress(100);
                resolve();
              } catch { reject(new Error("Invalid response")); }
            } else {
              try { reject(new Error(JSON.parse(xhr.responseText).error ?? "Upload failed")); }
              catch { reject(new Error("Upload failed")); }
            }
          };
          xhr.onerror = () => reject(new Error("Network error"));
          xhr.send(file);
        });
      } else {
        // ── Large file: chunked multipart upload ────────────────────────────
        const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB per chunk (under Vercel's 4.5MB limit)
        const fnParam = `filename=${encodeURIComponent(file.name)}`;

        // 1. Init
        setIsProcessing(false);
        setUploadProgress(1);
        const initRes = await fetch(
          `/api/portfolio/upload?action=init&${fnParam}`,
          { method: "POST", headers: { "Content-Type": file.type } }
        );
        if (!initRes.ok) throw new Error((await initRes.json()).error ?? "Init failed");
        const { uploadId, key, filename, mediaType, fileName } = await initRes.json();

        // 2. Upload chunks sequentially with progress
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        const parts: { etag: string; partNumber: number }[] = [];

        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const chunk = file.slice(start, Math.min(start + CHUNK_SIZE, file.size));
          const partNumber = i + 1;

          const partRes = await fetch(
            `/api/portfolio/upload?action=part&uploadId=${encodeURIComponent(uploadId)}&key=${encodeURIComponent(key)}&partNumber=${partNumber}`,
            { method: "POST", body: chunk, headers: { "Content-Type": "application/octet-stream" } }
          );
          if (!partRes.ok) throw new Error((await partRes.json()).error ?? `Part ${partNumber} failed`);
          const part = await partRes.json();
          parts.push(part);

          // Progress: 2%–90% across chunk uploads
          setUploadProgress(Math.round(2 + ((i + 1) / totalChunks) * 88));
        }

        // 3. Complete
        setIsProcessing(true);
        setUploadProgress(92);
        const completeRes = await fetch("/api/portfolio/upload?action=complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uploadId, key, parts, filename, mediaType, fileName }),
        });
        if (!completeRes.ok) throw new Error((await completeRes.json()).error ?? "Complete failed");
        const data = await completeRes.json();

        setDraft(d => ({
          ...d, mediaUrl: data.url, mediaType, fileName: file.name, fileSize: file.size,
          title: d.title || file.name.replace(/\.[^/.]+$/, ""),
        }));
        setUploadProgress(100);
      }
    } catch (err: any) {
      setUploadError(err?.message ?? "Upload failed.");
    }

    setIsUploading(false);
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function confirmAdd() {
    if (!draft.title.trim()) return;
    if (draft.url && isSocialMediaUrl(draft.url)) {
      setUrlError(SOCIAL_URL_ERROR);
      return;
    }
    setUrlError(null);
    const updated = [...items, { ...draft, title: draft.title.trim(), description: draft.description.trim() }];
    setItems(updated);
    setAdding(false);
    await save(updated);
  }

  async function remove(id: string) {
    const updated = items.filter(i => i.id !== id);
    setItems(updated);
    await save(updated);
  }

  return (
    <div>
      {/* Existing items */}
      {items.length === 0 && !adding && (
        <div style={{ fontSize: "0.82rem", color: "#94a3b8", fontStyle: "italic", marginBottom: "0.75rem" }}>
          No portfolio items yet. Add a project or upload a file.
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginBottom: "0.75rem" }}>
        {items.map(item => (
          <div key={item.id} style={{ borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", overflow: "hidden" }}>
            {item.mediaUrl && <MediaPreview item={item} />}
            <div style={{ padding: "0.85rem 1rem", position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0f172a" }}>{item.title}</div>
                  {item.year && <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: 1 }}>{item.year}</div>}
                  {item.description && <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0.4rem 0 0", lineHeight: 1.6 }}>{item.description}</p>}
                  {item.url && !item.mediaUrl && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.72rem", color: "#2DD4BF", textDecoration: "none", display: "inline-block", marginTop: 4 }}>
                      View project →
                    </a>
                  )}
                </div>
                <button onClick={() => remove(item.id)} title="Remove" style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "2px", flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add form */}
      {adding && (
        <div style={{ padding: "1rem", borderRadius: 10, border: "1px solid #2DD4BF", background: "rgba(45,212,191,0.04)", marginBottom: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {/* File upload zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: "1.5px dashed #cbd5e1", borderRadius: 8, padding: "16px",
              textAlign: "center", cursor: "pointer", background: "#f8fafc",
              transition: "border-color 0.15s",
            }}
          >
            {draft.mediaUrl ? (
              <div>
                <MediaPreview item={draft} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 8 }}>
                  <p style={{ fontSize: 11, color: "#14B8A6", margin: 0, fontWeight: 600 }}>
                    ✓ {draft.fileName ?? "File uploaded"}
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDraft(d => ({ ...d, mediaUrl: undefined, mediaType: undefined, fileName: undefined, fileSize: undefined })); }}
                    style={{ fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, padding: 0 }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#64748b", margin: "0 0 4px" }}>
                  Upload a file (optional)
                </p>
                <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
                  Images, MP4 video, PDF, Word, PowerPoint · Max 50MB for video, 10MB for others
                </p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime,application/pdf,.doc,.docx,.ppt,.pptx,.zip"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          {/* Upload progress */}
          {isUploading && (
            <div>
              <div style={{ background: "#f3f4f6", borderRadius: 99, height: 4, overflow: "hidden" }}>
                <div style={{
                  background: "#14B8A6", height: "100%", borderRadius: 99,
                  width: isProcessing ? "100%" : `${uploadProgress}%`,
                  transition: isProcessing ? "none" : "width 0.3s ease",
                  backgroundImage: isProcessing
                    ? "linear-gradient(90deg, #14B8A6 0%, #0d9488 50%, #14B8A6 100%)"
                    : undefined,
                  backgroundSize: isProcessing ? "200% 100%" : undefined,
                  animation: isProcessing ? "shimmer 1.2s linear infinite" : undefined,
                }} />
              </div>
              <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0 0" }}>
                {isProcessing ? "Saving to cloud…" : `Uploading… ${uploadProgress}%`}
              </p>
            </div>
          )}
          <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
          {uploadError && <div style={{ fontSize: "0.72rem", color: "#ef4444" }}>{uploadError}</div>}

          <input style={inp} placeholder="Project title *" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} maxLength={80} />
          <input style={inp} placeholder="Year (e.g. 2024)" value={draft.year} onChange={e => setDraft(d => ({ ...d, year: e.target.value }))} maxLength={10} />
          <textarea style={{ ...inp, resize: "vertical", minHeight: 70 }} placeholder="Short description" value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} maxLength={300} />
          <div>
            <input style={inp} placeholder="Project URL (optional — no social media)" value={draft.url} onChange={e => { setDraft(d => ({ ...d, url: e.target.value })); setUrlError(null); }} maxLength={200} />
            {urlError && <div style={{ fontSize: "0.68rem", color: "#ef4444", marginTop: 3 }}>{urlError}</div>}
          </div>
          <div className="portfolio-form-btns" style={{ display: "flex", gap: 8 }}>
            <button onClick={confirmAdd} disabled={!draft.title.trim() || saving || isUploading} style={{ flex: 1, minHeight: 44, padding: "0.55rem 1.25rem", borderRadius: 8, background: "#0f172a", color: "#fff", fontWeight: 700, fontSize: "0.88rem", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              {saving ? "Saving…" : "Add Project"}
            </button>
            <button onClick={() => setAdding(false)} style={{ flex: 1, minHeight: 44, padding: "0.55rem 1rem", borderRadius: 8, background: "none", color: "#64748b", fontWeight: 600, fontSize: "0.88rem", border: "1px solid #e2e8f0", cursor: "pointer", fontFamily: "inherit" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {!adding && (
        <button onClick={startAdd} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", minHeight: 44, padding: "0.6rem 1.1rem", borderRadius: 8, background: "none", border: "1px dashed #cbd5e1", color: "#64748b", fontWeight: 600, fontSize: "0.88rem", cursor: "pointer", fontFamily: "inherit" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Project
        </button>
      )}
    </div>
  );
}
