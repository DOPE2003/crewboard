"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const TOTAL_CHECKS = 15;
const NEEDED_DETECTIONS = 10;

export default function VerifyClient() {
  const [status, setStatus] = useState<"idle" | "loading" | "detecting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const detectedRef = useRef(0);
  const totalRef = useRef(0);

  const { update } = useSession();
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
    setStatus("loading");
    setMessage("Loading face detection...");
    detectedRef.current = 0;
    totalRef.current = 0;
    setProgress(0);

    try {
      const faceapi = await import("face-api.js");
      const modelUrl = window.location.origin + "/models";
      await faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl);

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      } catch {
        setStatus("error");
        setMessage("Camera access denied. Please allow camera permissions and try again.");
        return;
      }
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

        setProgress(Math.round((totalRef.current / TOTAL_CHECKS) * 100));

        if (totalRef.current >= TOTAL_CHECKS) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          stopCamera();

          if (detectedRef.current >= NEEDED_DETECTIONS) {
            setStatus("loading");
            setMessage("Confirming...");
            const res = await fetch("/api/verify/face", { method: "POST" });
            if (res.ok) {
              setStatus("success");
              setMessage("Verified! Redirecting...");
              await update({ humanVerified: true });
              router.replace("/onboarding");
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
    } catch (e: any) {
      stopCamera();
      console.error("Verify error:", e);
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem" }}>
      {/* Camera feed */}
      <div style={{
        width: "100%", aspectRatio: "4/3", borderRadius: 16, overflow: "hidden",
        background: "#0f1624", border: "1px solid rgba(255,255,255,0.07)", position: "relative",
        display: status === "idle" ? "none" : "block",
      }}>
        <video ref={videoRef} playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        {status === "loading" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,22,36,0.85)" }}>
            <div style={{ color: "#94a3b8", fontSize: "0.82rem" }}>Loading...</div>
          </div>
        )}
        {status === "success" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(22,163,74,0.85)" }}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {status === "detecting" && (
        <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "#2DD4BF", borderRadius: 99, transition: "width 0.3s ease" }} />
        </div>
      )}

      {/* Status message */}
      {message && (
        <div style={{
          fontSize: "0.78rem",
          color: status === "error" ? "#ef4444" : status === "success" ? "#22c55e" : "#94a3b8",
          lineHeight: 1.6,
        }}>
          {message}
        </div>
      )}

      {/* Buttons */}
      {status === "idle" && (
        <button
          onClick={startVerification}
          style={{
            padding: "0.85rem 2rem", borderRadius: 99, border: "none", cursor: "pointer",
            background: "linear-gradient(135deg, #2DD4BF, #14b8a6)",
            color: "#fff", fontWeight: 700, fontSize: "0.88rem", width: "100%",
          }}
        >
          Start Face Verification
        </button>
      )}

      {status === "error" && (
        <button
          onClick={startVerification}
          style={{
            padding: "0.75rem 2rem", borderRadius: 99, border: "1px solid rgba(255,255,255,0.12)",
            cursor: "pointer", background: "rgba(255,255,255,0.06)", color: "#f1f5f9",
            fontWeight: 600, fontSize: "0.82rem",
          }}
        >
          Try Again
        </button>
      )}

    </div>
  );
}
