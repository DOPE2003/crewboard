"use client";

import { useRef, useState, useEffect } from "react";
import { Camera, X, GripHorizontal } from "lucide-react";
import { saveBannerImage, removeBannerImage, saveBannerHeight } from "@/actions/profile";
import ImageCropModal from "./ImageCropModal";

interface Props {
  currentBanner: string | null;
  currentHeight?: number;
}

export default function BannerUpload({ currentBanner, currentHeight = 140 }: Props) {
  const [preview, setPreview] = useState(currentBanner);
  const [uploading, setUploading] = useState(false);
  const [height, setHeight] = useState(currentHeight);
  const [isResizing, setIsBResizing] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Drag-to-resize logic
  useEffect(() => {
    if (!isResizing) return;

    function handleMouseMove(e: MouseEvent) {
      const bannerWrap = document.querySelector(".banner-upload-wrap") as HTMLElement;
      if (!bannerWrap) return;
      
      const rect = bannerWrap.getBoundingClientRect();
      const newHeight = Math.min(Math.max(e.clientY - rect.top, 100), 400);
      setHeight(newHeight);
    }

    async function handleMouseUp() {
      setIsBResizing(false);
      try {
        await saveBannerHeight(Math.round(height));
      } catch (err) {
        console.error("Failed to save height:", err);
      }
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, height]);

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
      <div
        className="profile-cover-banner banner-upload-wrap"
        style={{
          width: "100%", 
          height: height,
          position: "relative",
          borderRadius: "16px 16px 0 0",
          overflow: "hidden",
          backgroundImage: preview ? `url(${preview})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: uploading ? 0.7 : 1,
          transition: isResizing ? "none" : "opacity 0.2s, height 0.1s",
          cursor: isResizing ? "row-resize" : "default"
        }}
      >
        {uploading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20 }}>
            <div style={{ width: 28, height: 28, border: "3px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          </div>
        )}

        {/* Remove button */}
        {preview && !isResizing && (
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
            className="banner-remove-btn"
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
        {!isResizing && (
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
        )}

        {/* Resize Handle */}
        <div 
          onMouseDown={() => setIsBResizing(true)}
          style={{
            position: "absolute",
            bottom: 0, left: 0, right: 0,
            height: "8px",
            background: isResizing ? "#14B8A6" : "rgba(0,0,0,0.1)",
            cursor: "row-resize",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 15,
            transition: "background 0.2s"
          }}
        >
          <div style={{ width: "40px", height: "3px", borderRadius: "2px", background: "rgba(255,255,255,0.5)" }} />
        </div>

        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: "none" }} />
      </div>

      {/* Crop modal */}
      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          circular={false}
          previewW={400}
          previewH={125}
          outputW={1200}
          outputH={375}
          label="banner"
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </>
  );
}
