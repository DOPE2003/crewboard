"use client";

import { useRef, useState } from "react";
import ImageCropModal from "./ImageCropModal";
import UserAvatar from "./UserAvatar";

export default function AvatarUpload({
  currentImage,
  name,
  isTwitterUser = false,
}: {
  currentImage?: string | null;
  name?: string | null;
  isTwitterUser?: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(currentImage ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Must be an image"); return; }
    setError("");
    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleCropConfirm(dataUrl: string) {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setPreview(dataUrl); // optimistic
    setUploading(true);
    setError("");

    try {
      // Convert data URL to Blob and upload as a file — avoids storing base64 in DB
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], "avatar.jpg", { type: blob.type || "image/jpeg" });

      const form = new FormData();
      form.append("file", file);

      const upload = await fetch("/api/user/avatar", { method: "POST", body: form });
      const json = await upload.json();

      if (!upload.ok) {
        setError(json.error ?? "Failed to save. Try again.");
        setPreview(currentImage ?? null); // revert on error
      } else {
        setPreview(json.image ?? dataUrl);
      }
    } catch {
      setError("Upload failed. Try again.");
      setPreview(currentImage ?? null);
    } finally {
      setUploading(false);
    }
  }

  function handleCropCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  return (
    <>
      <div style={{ position: "relative", width: 90, height: 90, flexShrink: 0 }}>
        {/* Avatar with broken-image fallback */}
        <UserAvatar
          src={preview}
          name={name}
          size={90}
          style={{ border: "3px solid #f1f5f9" }}
        />

        {/* Camera button — hidden for Twitter/X users */}
        {!isTwitterUser && (
          <>
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
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: "none" }} />
          </>
        )}

        {/* X badge for Twitter users */}
        {isTwitterUser && (
          <div
            title="Profile photo synced from X — change it on X to update here"
            style={{
              position: "absolute", bottom: 2, right: 2,
              width: 26, height: 26, borderRadius: "50%",
              background: "#000", border: "2px solid #fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "default",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </div>
        )}

        {error && <div style={{ position: "absolute", top: "100%", left: 0, fontSize: "0.65rem", color: "#ef4444", marginTop: 4, whiteSpace: "nowrap" }}>{error}</div>}
      </div>

      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          circular={true}
          previewW={300}
          previewH={300}
          outputW={400}
          outputH={400}
          label="photo"
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </>
  );
}
