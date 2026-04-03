"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, ImageIcon, Video } from "lucide-react";
import { upload } from "@vercel/blob/client";

const CATEGORIES = ["Design", "Development", "Marketing", "Creative", "Content", "Other"];
const MAX_TAGS = 8;

export default function NewPostForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback((f: File) => {
    const isVideo = f.type.startsWith("video/");
    const isImage = f.type.startsWith("image/");
    if (!isVideo && !isImage) {
      setError("File must be an image or video.");
      return;
    }
    const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (f.size > maxSize) {
      setError(`File too large. Max ${isVideo ? "100MB" : "10MB"}.`);
      return;
    }
    setFile(f);
    setMediaType(isVideo ? "video" : "image");
    setError(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f) handleFileChange(f);
    },
    [handleFileChange]
  );

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!t || tags.includes(t) || tags.length >= MAX_TAGS) return;
    setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) { setError("Title is required."); return; }
    if (!file) { setError("Media is required."); return; }
    if (!category) { setError("Category is required."); return; }

    setSubmitting(true);

    try {
      // 1. Upload media — direct to Vercel Blob CDN, bypasses 4.5MB serverless limit
      setUploading(true);
      let mediaUrl: string;
      let mediaType: string;
      try {
        const ext = file.name.split(".").pop() ?? "bin";
        const blobFilename = `showcase/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const blob = await upload(blobFilename, file, {
          access: "public",
          handleUploadUrl: "/api/showcase/upload",
          multipart: true,
        });
        mediaUrl = blob.url;
        mediaType = file.type.startsWith("video/") ? "video" : "image";
      } catch (err: any) {
        setError(err?.message ?? "Upload failed.");
        setSubmitting(false);
        setUploading(false);
        return;
      }
      setUploading(false);

      // 2. Create post
      const postRes = await fetch("/api/showcase/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          mediaUrl,
          mediaType,
          category,
          tags,
        }),
      });
      const postData = await postRes.json();

      if (!postRes.ok) {
        setError(postData.error ?? "Failed to create post.");
        setSubmitting(false);
        return;
      }

      router.push("/showcase");
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
      setUploading(false);
    }
  };

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.6rem 0.875rem",
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-md)",
    borderRadius: 8,
    color: "var(--text)",
    fontSize: "0.9rem",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.8125rem",
    fontWeight: 600,
    color: "var(--text)",
    marginBottom: "0.4rem",
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        background: "var(--card-bg)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "1.5rem",
      }}
    >
      {/* Media upload */}
      <div>
        <label style={labelStyle}>Media *</label>
        {!preview ? (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            style={{
              border: "2px dashed var(--border-md)",
              borderRadius: 12,
              padding: "3rem 1.5rem",
              textAlign: "center",
              cursor: "pointer",
              color: "var(--text-muted)",
              transition: "border-color 0.15s, background 0.15s",
              background: "var(--bg-secondary)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--teal)";
              (e.currentTarget as HTMLElement).style.background = "var(--bg-tertiary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border-md)";
              (e.currentTarget as HTMLElement).style.background = "var(--bg-secondary)";
            }}
          >
            <Upload size={28} style={{ margin: "0 auto 0.75rem", display: "block", color: "var(--text-hint)" }} />
            <p style={{ margin: 0, fontWeight: 500, fontSize: "0.9rem" }}>Drop or click to upload</p>
            <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem" }}>
              Images up to 10MB · Videos up to 100MB
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "0.75rem" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem" }}>
                <ImageIcon size={13} /> JPG, PNG, GIF, WebP
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem" }}>
                <Video size={13} /> MP4, MOV, WebM
              </span>
            </div>
          </div>
        ) : (
          <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", background: "var(--bg-secondary)" }}>
            {mediaType === "video" ? (
              <video src={preview} controls style={{ width: "100%", maxHeight: 320, objectFit: "cover", display: "block" }} />
            ) : (
              <img src={preview} alt="Preview" style={{ width: "100%", maxHeight: 320, objectFit: "cover", display: "block" }} />
            )}
            <button
              type="button"
              onClick={() => { setFile(null); setPreview(null); }}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.55)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileChange(f);
          }}
        />
      </div>

      {/* Title */}
      <div>
        <label style={labelStyle}>Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What did you build or create?"
          maxLength={100}
          style={fieldStyle}
        />
        <div style={{ textAlign: "right", fontSize: "0.72rem", color: "var(--text-hint)", marginTop: "0.25rem" }}>
          {title.length}/100
        </div>
      </div>

      {/* Description */}
      <div>
        <label style={labelStyle}>Description <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span></label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell people about this project..."
          maxLength={500}
          rows={3}
          style={{ ...fieldStyle, resize: "vertical", minHeight: 80 }}
        />
        <div style={{ textAlign: "right", fontSize: "0.72rem", color: "var(--text-hint)", marginTop: "0.25rem" }}>
          {description.length}/500
        </div>
      </div>

      {/* Category */}
      <div>
        <label style={labelStyle}>Category *</label>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              style={{
                padding: "0.35rem 0.875rem",
                borderRadius: 999,
                fontSize: "0.8rem",
                fontWeight: 500,
                border: `1px solid ${category === cat ? "var(--teal)" : "var(--border)"}`,
                background: category === cat ? "var(--teal)" : "var(--bg-secondary)",
                color: category === cat ? "#fff" : "var(--text-muted)",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label style={labelStyle}>
          Tags <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional, max {MAX_TAGS})</span>
        </label>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: tags.length > 0 ? "0.6rem" : 0 }}>
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                padding: "0.2rem 0.6rem",
                borderRadius: 999,
                fontSize: "0.78rem",
                color: "var(--text-muted)",
              }}
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1, color: "var(--text-hint)" }}
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
        {tags.length < MAX_TAGS && (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder="Add a tag and press Enter"
              style={{ ...fieldStyle, flex: 1 }}
            />
            <button
              type="button"
              onClick={addTag}
              style={{
                padding: "0.6rem 0.875rem",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-md)",
                borderRadius: 8,
                fontSize: "0.8rem",
                fontWeight: 500,
                cursor: "pointer",
                color: "var(--text-muted)",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p style={{ margin: 0, fontSize: "0.85rem", color: "#ef4444", background: "rgba(239,68,68,0.08)", padding: "0.6rem 0.875rem", borderRadius: 8 }}>
          {error}
        </p>
      )}

      {/* Submit */}
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", paddingTop: "0.25rem" }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            padding: "0.6rem 1.25rem",
            background: "transparent",
            border: "1px solid var(--border-md)",
            borderRadius: 8,
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
            color: "var(--text-muted)",
            fontFamily: "inherit",
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "0.6rem 1.5rem",
            background: submitting ? "var(--text-hint)" : "var(--teal)",
            border: "none",
            borderRadius: 8,
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: submitting ? "default" : "pointer",
            color: "#fff",
            fontFamily: "inherit",
            minWidth: 120,
          }}
        >
          {uploading ? "Uploading…" : submitting ? "Publishing…" : "Publish"}
        </button>
      </div>
    </form>
  );
}
