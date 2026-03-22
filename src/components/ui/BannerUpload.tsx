"use client";

import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { saveBannerImage, removeBannerImage } from "@/actions/profile";

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

    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be under 2MB.");
      return;
    }

    setUploading(true);

    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Show preview immediately
      setPreview(base64);

      // Save to DB via server action
      await saveBannerImage(base64);

      window.location.reload();
    } catch (err) {
      console.error("Banner save failed:", err);
      alert("Failed to save banner. Please try again.");
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
        background: preview ? undefined : undefined,
        backgroundImage: preview ? `url(${preview})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
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

      {/* Remove button — hover-only */}
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
              alert("Failed to remove banner. Please try again.");
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
            zIndex: 10,
          }}
        >
          <X size={16} color="#ef4444" />
        </button>
      )}

      {/* Camera button */}
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
          zIndex: 10,
        }}
      >
        <Camera size={16} color="#6b7280" />
      </button>

      <input ref={fileRef} type="file" accept="image/*" onChange={handleChange} style={{ display: "none" }} />
    </div>
  );
}
