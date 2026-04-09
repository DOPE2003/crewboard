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

interface Props {
  currentBanner: string | null;
}

export default function BannerUpload({ currentBanner }: Props) {
  const [preview, setPreview] = useState(currentBanner);
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleCropConfirm(dataUrl: string) {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setPreview(dataUrl);
    setUploading(true);

    try {
      await saveBannerImage(dataUrl);
      window.location.reload();
    } catch (err) {
      console.error("Banner save failed:", err);
      alert("Failed to save banner. Please try again.");
      setPreview(currentBanner);
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
      {/* Fixed 3:1 aspect ratio banner — same as Twitter/X */}
      <div
        className="profile-cover-banner banner-upload-wrap"
        style={{
          width: "100%",
          aspectRatio: `${BANNER_ASPECT} / 1`,
          position: "relative",
          borderRadius: "16px 16px 0 0",
          overflow: "hidden",
          backgroundImage: preview ? `url(${preview})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: uploading ? 0.7 : 1,
          transition: "opacity 0.2s",
        }}
      >
        {uploading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20 }}>
            <div style={{ width: 28, height: 28, border: "3px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          </div>
        )}

        {/* Remove button */}
        {preview && (
          <button
            type="button"
            onClick={async () => {
              try {
                await removeBannerImage();
                setPreview(null);
                window.location.reload();
              } catch {
                alert("Failed to remove banner. Please try again.");
              }
            }}
            disabled={uploading}
            title="Remove banner"
            style={{
              position: "absolute", bottom: 12, right: 58,
              width: 34, height: 34, borderRadius: "50%",
              background: "#fff", border: "1px solid #e5e7eb",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: uploading ? "wait" : "pointer", zIndex: 10,
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

        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: "none" }} />
      </div>

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
