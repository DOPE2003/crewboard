"use client";

import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { saveBannerImage, removeBannerImage } from "@/actions/profile";
import ImageCropModal from "./ImageCropModal";

// Twitter-style banner: 3:1 aspect ratio, 1500×500 output
const BANNER_ASPECT = 3; // width / height
const OUTPUT_W = 1500;
const OUTPUT_H = 500;
// Crop modal preview: fits inside the modal nicely
const PREVIEW_W = 450;
const PREVIEW_H = 150; // 450 / 3

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface Props {
  currentBanner: string | null;
}

type Status = "idle" | "uploading" | "success" | "error";

export default function BannerUpload({ currentBanner }: Props) {
  const [preview, setPreview] = useState(currentBanner);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploading = status === "uploading";

  function setError(msg: string) {
    setStatus("error");
    setErrorMsg(msg);
    // auto-clear after 8 s
    setTimeout(() => {
      setStatus("idle");
      setErrorMsg(null);
    }, 8000);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileRef.current) fileRef.current.value = "";

    // Client-side validation before even opening the crop modal
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(`File type "${file.type}" is not supported. Use JPEG, PNG, or WebP.`);
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max is ${MAX_SIZE_MB} MB.`);
      return;
    }

    setStatus("idle");
    setErrorMsg(null);
    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
  }

  async function handleCropConfirm(dataUrl: string) {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setPreview(dataUrl); // optimistic preview
    setStatus("uploading");
    setErrorMsg(null);

    try {
      // Convert canvas dataUrl → Blob → File → multipart upload
      const fetchRes = await fetch(dataUrl);
      if (!fetchRes.ok) throw new Error("Failed to read cropped image data.");
      const blob = await fetchRes.blob();

      if (blob.size === 0) throw new Error("Cropped image is empty. Please try again.");

      const file = new File([blob], "banner.jpg", { type: "image/jpeg" });
      const form = new FormData();
      form.append("file", file);

      const uploadRes = await fetch("/api/upload?type=banner", {
        method: "POST",
        body: form,
        // Do NOT set Content-Type manually — the browser sets it with the correct boundary
      });

      let payload: { url?: string; error?: string; code?: string };
      try {
        payload = await uploadRes.json();
      } catch {
        throw new Error(`Server returned HTTP ${uploadRes.status} with a non-JSON body.`);
      }

      if (!uploadRes.ok || !payload.url) {
        throw new Error(payload.error ?? `Upload failed with HTTP ${uploadRes.status}.`);
      }

      // Persist URL in DB via server action
      try {
        await saveBannerImage(payload.url);
      } catch (dbErr: unknown) {
        const msg = dbErr instanceof Error ? dbErr.message : String(dbErr);
        throw new Error(`Image uploaded but could not be saved: ${msg}`);
      }

      setStatus("success");
      // Refresh the page after a brief success flash so server components re-hydrate
      setTimeout(() => window.location.reload(), 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unexpected error. Check the browser console.";
      console.error("[BannerUpload] upload failed:", err);
      setPreview(currentBanner); // revert optimistic preview on failure
      setError(msg);
    }
  }

  function handleCropCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  async function handleRemove() {
    setStatus("uploading");
    setErrorMsg(null);
    try {
      await removeBannerImage();
      setPreview(null);
      setStatus("idle");
      window.location.reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove banner.";
      console.error("[BannerUpload] remove failed:", err);
      setError(msg);
    }
  }

  return (
    <>
      {/* Fixed 3:1 aspect ratio banner — same as Twitter/X */}
      <div
        className="profile-cover-banner banner-upload-wrap"
        style={{
          width: "100%",
          aspectRatio: "3 / 1",
          position: "relative",
          borderRadius: "16px 16px 0 0",
          overflow: "hidden",
          backgroundImage: preview ? `url(${preview})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          background: preview ? undefined : "#0d1117",
          opacity: uploading ? 0.7 : 1,
          transition: "opacity 0.2s",
        }}
      >
        {/* Uploading spinner */}
        {uploading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20 }}>
            <div style={{ width: 28, height: 28, border: "3px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          </div>
        )}

        {/* Success flash */}
        {status === "success" && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.45)", zIndex: 20,
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "#14b8a6", color: "#fff",
              padding: "8px 18px", borderRadius: 10, fontWeight: 600, fontSize: 14,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Banner saved
            </div>
          </div>
        )}

        {/* Remove button */}
        {preview && !uploading && (
          <button
            type="button"
            onClick={handleRemove}
            title="Remove banner"
            style={{
              position: "absolute", bottom: 12, right: 58,
              width: 34, height: 34, borderRadius: "50%",
              background: "#fff", border: "1px solid #e5e7eb",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", zIndex: 10,
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
            cursor: uploading ? "wait" : "pointer", zIndex: 10,
          }}
        >
          <Camera size={16} color="#6b7280" />
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
      </div>

      {/* Error message — shown below the banner */}
      {status === "error" && errorMsg && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 8,
          background: "#fef2f2", border: "1px solid #fecaca",
          borderRadius: "0 0 8px 8px", padding: "10px 14px",
          fontSize: 13, color: "#dc2626", lineHeight: 1.4,
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={() => { setStatus("idle"); setErrorMsg(null); }}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: 0, flexShrink: 0 }}
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Crop modal — noZoom: drag-to-reposition only, fixed 3:1 */}
      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          circular={false}
          previewW={PREVIEW_W}
          previewH={PREVIEW_H}
          outputW={OUTPUT_W}
          outputH={OUTPUT_H}
          label="banner"
          noZoom={true}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </>
  );
}
