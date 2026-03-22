"use client";

import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { removeBannerImage } from "@/actions/profile";

interface Props {
  currentBanner: string | null;
}

export default function BannerUpload({ currentBanner }: Props) {
  const [preview, setPreview] = useState(currentBanner);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setUploading(true);

    try {
      // Step 1: show local preview immediately
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      // Step 2: upload file to Vercel Blob via existing route
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        console.error("Banner blob upload failed:", err);
        setPreview(currentBanner); // revert preview
        return;
      }

      const { url } = await uploadRes.json();
      setPreview(url); // update to permanent URL

      // Step 3: save URL to user record
      const saveRes = await fetch("/api/user/banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!saveRes.ok) {
        console.error("Banner save failed:", await saveRes.text());
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error("Banner upload error:", err);
      setPreview(currentBanner);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div
      className="profile-cover-banner banner-upload-wrap"
      style={{
        width: "100%",
        height: 140,
        position: "relative",
        borderRadius: "16px 16px 0 0",
        overflow: "hidden",
        backgroundImage: preview ? `url(${preview})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        opacity: uploading ? 0.7 : 1,
        transition: "opacity 0.2s",
      }}
    >
      {/* Uploading spinner */}
      {uploading && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 28, height: 28, border: "3px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        </div>
      )}

      {/* Remove banner button — hover-only, only when image exists */}
      {preview && (
        <button
          type="button"
          onClick={async () => {
            try {
              await removeBannerImage();
              setPreview(null);
              window.location.reload();
            } catch (err) {
              console.error("Remove banner failed:", err);
            }
          }}
          disabled={uploading}
          title="Remove banner"
          className="banner-remove-btn"
          style={{
            position: "absolute", bottom: 12, right: 58,
            width: 34, height: 34, borderRadius: "50%",
            background: "#fff", border: "1px solid #e5e7eb",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: uploading ? "wait" : "pointer",
            zIndex: 10, transition: "background 0.15s",
          }}
        >
          <X size={16} color="#ef4444" />
        </button>
      )}

      {/* Camera button — bottom right */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        title="Change banner"
        style={{
          position: "absolute", bottom: 12, right: 16,
          width: 34, height: 34, borderRadius: "50%",
          background: "#fff", border: "1px solid #e5e7eb",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: uploading ? "wait" : "pointer",
          zIndex: 10, transition: "border-color 0.15s",
        }}
      >
        <Camera size={16} color="#6b7280" />
      </button>

      <input ref={fileRef} type="file" accept="image/*" onChange={handleChange} style={{ display: "none" }} />
    </div>
  );
}
