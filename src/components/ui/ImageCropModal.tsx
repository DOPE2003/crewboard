"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface Props {
  src: string;
  circular: boolean;       // true = avatar circle, false = banner rect
  previewW: number;        // crop area width in px
  previewH: number;        // crop area height in px
  outputW: number;         // exported canvas width
  outputH: number;         // exported canvas height
  label: string;           // "photo" | "banner"
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}

export default function ImageCropModal({
  src, circular, previewW, previewH, outputW, outputH, label, onConfirm, onCancel,
}: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const dragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });
  const lastTouch = useRef<{ x: number; y: number } | null>(null);

  // Load image, compute initial fit-to-fill zoom
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const mz = Math.max(previewW / img.naturalWidth, previewH / img.naturalHeight);
      setMinZoom(mz);
      setZoom(mz);
      setOffset({ x: 0, y: 0 });
      setReady(true);
    };
    img.src = src;
  }, [src, previewW, previewH]);

  // Clamp offset so the image always fills the preview area
  const clamp = useCallback((ox: number, oy: number, z: number) => {
    const img = imgRef.current;
    if (!img) return { x: ox, y: oy };
    const maxX = Math.max(0, (img.naturalWidth * z - previewW) / 2);
    const maxY = Math.max(0, (img.naturalHeight * z - previewH) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, ox)),
      y: Math.max(-maxY, Math.min(maxY, oy)),
    };
  }, [previewW, previewH]);

  // ── Mouse ──────────────────────────────────────────────────────────────────
  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    dragging.current = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    setOffset(clamp(dragStart.current.ox + dx, dragStart.current.oy + dy, zoom));
  }
  function onMouseUp() { dragging.current = false; }

  // ── Touch ──────────────────────────────────────────────────────────────────
  function onTouchStart(e: React.TouchEvent) {
    lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function onTouchMove(e: React.TouchEvent) {
    e.preventDefault();
    if (!lastTouch.current) return;
    const dx = e.touches[0].clientX - lastTouch.current.x;
    const dy = e.touches[0].clientY - lastTouch.current.y;
    lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setOffset(prev => clamp(prev.x + dx, prev.y + dy, zoom));
  }
  function onTouchEnd() { lastTouch.current = null; }

  // ── Wheel zoom ─────────────────────────────────────────────────────────────
  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const newZ = Math.max(minZoom, Math.min(minZoom * 5, zoom * (1 - e.deltaY * 0.001)));
    setZoom(newZ);
    setOffset(prev => clamp(prev.x, prev.y, newZ));
  }

  // ── Slider ─────────────────────────────────────────────────────────────────
  function onSlider(e: React.ChangeEvent<HTMLInputElement>) {
    const newZ = parseFloat(e.target.value);
    setZoom(newZ);
    setOffset(prev => clamp(prev.x, prev.y, newZ));
  }

  // ── Export ─────────────────────────────────────────────────────────────────
  function confirm() {
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = outputW;
    canvas.height = outputH;
    const ctx = canvas.getContext("2d")!;
    // Convert preview-space offset back to source image crop coords
    const cropX = ((previewW - img.naturalWidth * zoom) / 2 + offset.x) / zoom * -1;
    const cropY = ((previewH - img.naturalHeight * zoom) / 2 + offset.y) / zoom * -1;
    const cropW = previewW / zoom;
    const cropH = previewH / zoom;
    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, outputW, outputH);
    onConfirm(canvas.toDataURL("image/jpeg", 0.92));
  }

  // Current image position in preview coords
  const sw = imgRef.current ? imgRef.current.naturalWidth * zoom : 0;
  const sh = imgRef.current ? imgRef.current.naturalHeight * zoom : 0;
  const ix = (previewW - sw) / 2 + offset.x;
  const iy = (previewH - sh) / 2 + offset.y;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.65)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16,
        padding: 24, width: "100%", maxWidth: previewW + 48,
        boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        {/* Title */}
        <div style={{ fontWeight: 700, fontSize: "1rem", color: "#0f172a" }}>
          Adjust {label}
        </div>

        {/* Crop area */}
        <div
          style={{
            width: previewW, height: previewH, alignSelf: "center",
            borderRadius: circular ? "50%" : 10,
            overflow: "hidden", position: "relative",
            cursor: dragging.current ? "grabbing" : "grab",
            userSelect: "none", background: "#e2e8f0",
            border: "2.5px solid #14B8A6", flexShrink: 0,
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove as any}
          onTouchEnd={onTouchEnd}
        >
          {ready && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src} alt=""
              draggable={false}
              style={{
                position: "absolute",
                left: ix, top: iy,
                width: sw, height: sh,
                pointerEvents: "none", userSelect: "none",
              }}
            />
          )}
          {!ready && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 24, height: 24, border: "3px solid #14B8A6", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            </div>
          )}
        </div>

        {/* Zoom slider */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* minus icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          <input
            type="range"
            min={minZoom}
            max={minZoom * 4}
            step={minZoom * 0.005}
            value={zoom}
            onChange={onSlider}
            style={{ flex: 1, accentColor: "#14B8A6", height: 4 }}
          />
          {/* plus icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </div>
        <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, textAlign: "center" }}>
          Drag to reposition · Scroll or slide to zoom
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button" onClick={onCancel}
            style={{ flex: 1, minHeight: 42, borderRadius: 8, border: "1px solid #e2e8f0", background: "none", color: "#64748b", fontWeight: 600, cursor: "pointer", fontSize: "0.88rem", fontFamily: "inherit" }}
          >
            Cancel
          </button>
          <button
            type="button" onClick={confirm} disabled={!ready}
            style={{ flex: 1, minHeight: 42, borderRadius: 8, border: "none", background: "#0f172a", color: "#fff", fontWeight: 700, cursor: ready ? "pointer" : "wait", fontSize: "0.88rem", fontFamily: "inherit" }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
