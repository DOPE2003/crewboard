"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Props {
  humanVerified: boolean;
}

const TOTAL_CHECKS = 15;
const NEEDED_DETECTIONS = 10;

export default function FaceVerify({ humanVerified }: Props) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "detecting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const detectedRef = useRef(0);
  const totalRef = useRef(0);

  const router = useRouter();

  const stopCamera = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const startVerification = async () => {
    setOpen(true);
    setStatus("loading");
    setMessage("Loading face detection...");
    detectedRef.current = 0;
    totalRef.current = 0;
    setProgress(0);

    try {
      // Dynamically import face-api.js (browser only)
      const faceapi = await import("face-api.js");

      // Load tiny face detector model from CDN
      const MODEL_URL = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights";
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);

      // Start camera
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStatus("detecting");
      setMessage("Look straight at the camera and hold still...");

      intervalRef.current = setInterval(async () => {
        if (!videoRef.current) return;

        totalRef.current++;

        const detection = await faceapi.detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 })
        );

        if (detection) detectedRef.current++;

        const pct = Math.round((totalRef.current / TOTAL_CHECKS) * 100);
        setProgress(pct);

        if (totalRef.current >= TOTAL_CHECKS) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          stopCamera();

          if (detectedRef.current >= NEEDED_DETECTIONS) {
            setStatus("loading");
            setMessage("Confirming...");
            const res = await fetch("/api/verify/face", { method: "POST" });
            if (res.ok) {
              setStatus("success");
              setMessage("Identity verified!");
              setTimeout(() => {
                setOpen(false);
                router.refresh();
              }, 1500);
            } else {
              setStatus("error");
              setMessage("Server error. Please try again.");
            }
          } else {
            setStatus("error");
            setMessage("Face not detected clearly. Make sure your face is well-lit and fully visible.");
          }
        }
      }, 300);
    } catch (err: unknown) {
      stopCamera();
      setStatus("error");
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg.includes("Permission") || msg.includes("denied") || msg.includes("NotAllowed")) {
        setMessage("Camera access denied. Please allow camera access and try again.");
      } else {
        setMessage("Could not start verification. Check camera permissions.");
      }
    }
  };

  const close = () => {
    stopCamera();
    setOpen(false);
    setStatus("idle");
    setProgress(0);
    setMessage("");
  };

  if (humanVerified) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.5rem 0" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <span style={{ fontSize: "0.78rem", color: "#16a34a", fontWeight: 600 }}>Face Verified</span>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={startVerification}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "0.6rem 1.1rem", borderRadius: 10,
            background: "rgba(22,163,74,0.08)",
            border: "1px solid rgba(22,163,74,0.3)",
            color: "#15803d", fontSize: "0.8rem", fontWeight: 700,
            cursor: "pointer", width: "fit-content",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Verify Your Identity
        </button>
        <div style={{ fontSize: "0.68rem", color: "#94a3b8", lineHeight: 1.65, maxWidth: 320 }}>
          Uses your camera to confirm you are a real, live person. Detection runs entirely in your browser — no images are uploaded or stored.
        </div>
      </div>

      {open && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={close}
        >
          <div
            style={{
              background: "#fff", borderRadius: 20, padding: "1.5rem",
              width: "min(420px, 90vw)", display: "flex", flexDirection: "column", gap: "1rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a" }}>Face Verification</div>
              <button
                onClick={close}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: "1.4rem", lineHeight: 1, padding: "0 4px" }}
              >
                ×
              </button>
            </div>

            {/* Camera feed */}
            <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", background: "#0f172a", aspectRatio: "4/3" }}>
              <video
                ref={videoRef}
                playsInline
                muted
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              {status === "loading" && (
                <div style={{
                  position: "absolute", inset: 0, display: "flex", alignItems: "center",
                  justifyContent: "center", background: "rgba(15,23,42,0.85)",
                }}>
                  <div style={{ color: "#fff", fontSize: "0.82rem" }}>Loading...</div>
                </div>
              )}
              {status === "success" && (
                <div style={{
                  position: "absolute", inset: 0, display: "flex", alignItems: "center",
                  justifyContent: "center", background: "rgba(22,163,74,0.85)",
                }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
              )}
            </div>

            {/* Status + progress */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{
                fontSize: "0.78rem", fontWeight: 500,
                color: status === "error" ? "#ef4444" : status === "success" ? "#16a34a" : "#475569",
              }}>
                {message || "Preparing camera..."}
              </div>
              {status === "detecting" && (
                <div style={{ height: 4, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${progress}%`,
                    background: "#16a34a", borderRadius: 99, transition: "width 0.3s ease",
                  }} />
                </div>
              )}
              {status === "error" && (
                <button
                  onClick={() => { close(); setTimeout(startVerification, 100); }}
                  style={{
                    padding: "0.5rem 1rem", borderRadius: 8, border: "1px solid #e2e8f0",
                    background: "#f8fafc", fontSize: "0.75rem", fontWeight: 600,
                    color: "#0f172a", cursor: "pointer", width: "fit-content", marginTop: 2,
                  }}
                >
                  Try again
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
