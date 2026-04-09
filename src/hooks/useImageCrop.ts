"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface CropState {
  ready: boolean;
  zoom: number;
  minZoom: number;
  offset: { x: number; y: number };
  isDragging: boolean;
  naturalW: number;
  naturalH: number;
}

const INITIAL: CropState = {
  ready: false,
  zoom: 1,
  minZoom: 1,
  offset: { x: 0, y: 0 },
  isDragging: false,
  naturalW: 0,
  naturalH: 0,
};

export function useImageCrop(previewW: number, previewH: number, noZoom = false) {
  const [state, setState] = useState<CropState>(INITIAL);

  // Mirror of state for use inside event handlers (avoids stale closures)
  const S = useRef<CropState>(state);
  S.current = state;

  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Drag tracking refs
  const drag = useRef({ active: false, startMx: 0, startMy: 0, startOx: 0, startOy: 0 });
  const lastMove = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────

  /** Clamp offset so the image always fills the preview area (no black bars). */
  const clamp = useCallback(
    (ox: number, oy: number, z: number) => {
      const img = imgRef.current;
      if (!img) return { x: ox, y: oy };
      const maxX = Math.max(0, (img.naturalWidth * z - previewW) / 2);
      const maxY = Math.max(0, (img.naturalHeight * z - previewH) / 2);
      return {
        x: Math.max(-maxX, Math.min(maxX, ox)),
        y: Math.max(-maxY, Math.min(maxY, oy)),
      };
    },
    [previewW, previewH]
  );

  /** Cancel any ongoing inertia animation. */
  function cancelInertia() {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  }

  /** Start a deceleration loop after drag ends. */
  function startInertia() {
    let vx = velocity.current.x;
    let vy = velocity.current.y;

    function tick() {
      vx *= 0.88;
      vy *= 0.88;
      if (Math.abs(vx) < 0.25 && Math.abs(vy) < 0.25) return;

      const curr = S.current;
      const next = clamp(curr.offset.x + vx, curr.offset.y + vy, curr.zoom);
      setState(prev => ({ ...prev, offset: next }));
      rafId.current = requestAnimationFrame(tick);
    }

    rafId.current = requestAnimationFrame(tick);
  }

  // ── Image loading ─────────────────────────────────────────────────────────

  function loadImage(src: string) {
    cancelInertia();
    setState(INITIAL);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const mz = Math.max(previewW / img.naturalWidth, previewH / img.naturalHeight);
      setState({ ready: true, zoom: mz, minZoom: mz, offset: { x: 0, y: 0 }, isDragging: false, naturalW: img.naturalWidth, naturalH: img.naturalHeight });
    };
    img.src = src;
  }

  // ── Mouse ─────────────────────────────────────────────────────────────────

  /** Call this on the crop container's onMouseDown. */
  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    cancelInertia();
    drag.current = {
      active: true,
      startMx: e.clientX, startMy: e.clientY,
      startOx: S.current.offset.x, startOy: S.current.offset.y,
    };
    lastMove.current = { x: e.clientX, y: e.clientY };
    velocity.current = { x: 0, y: 0 };
    setState(prev => ({ ...prev, isDragging: true }));
  }

  // Global mouse listeners (so drag works even when cursor leaves the container)
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!drag.current.active) return;

      // Exponential smoothing on velocity for a natural feel
      const dx = e.clientX - lastMove.current.x;
      const dy = e.clientY - lastMove.current.y;
      velocity.current = {
        x: dx * 0.5 + velocity.current.x * 0.5,
        y: dy * 0.5 + velocity.current.y * 0.5,
      };
      lastMove.current = { x: e.clientX, y: e.clientY };

      const d = drag.current;
      const next = clamp(
        d.startOx + (e.clientX - d.startMx),
        d.startOy + (e.clientY - d.startMy),
        S.current.zoom,
      );
      setState(prev => ({ ...prev, offset: next }));
    }

    function onMouseUp() {
      if (!drag.current.active) return;
      drag.current.active = false;
      setState(prev => ({ ...prev, isDragging: false }));
      startInertia();
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clamp]);

  // ── Touch + Wheel (passive: false required) ───────────────────────────────

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !state.ready) return;

    let lastTx = 0, lastTy = 0;

    function onTouchStart(e: TouchEvent) {
      cancelInertia();
      lastTx = e.touches[0].clientX;
      lastTy = e.touches[0].clientY;
      velocity.current = { x: 0, y: 0 };
    }

    function onTouchMove(e: TouchEvent) {
      // Must preventDefault to stop page scrolling — requires passive: false
      e.preventDefault();
      const t = e.touches[0];
      const dx = t.clientX - lastTx;
      const dy = t.clientY - lastTy;
      velocity.current = {
        x: dx * 0.5 + velocity.current.x * 0.5,
        y: dy * 0.5 + velocity.current.y * 0.5,
      };
      lastTx = t.clientX;
      lastTy = t.clientY;
      const next = clamp(S.current.offset.x + dx, S.current.offset.y + dy, S.current.zoom);
      setState(prev => ({ ...prev, offset: next }));
    }

    function onTouchEnd() { startInertia(); }

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      if (noZoom) return; // banner: drag-only, no zoom
      const { zoom, minZoom, offset } = S.current;
      const newZ = Math.max(minZoom, Math.min(minZoom * 5, zoom * (1 - e.deltaY * 0.001)));
      const next = clamp(offset.x, offset.y, newZ);
      setState(prev => ({ ...prev, zoom: newZ, offset: next }));
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("wheel", onWheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ready, clamp, noZoom]);

  // ── Zoom via slider ───────────────────────────────────────────────────────

  function setZoom(newZ: number) {
    if (noZoom) return;
    const next = clamp(S.current.offset.x, S.current.offset.y, newZ);
    setState(prev => ({ ...prev, zoom: newZ, offset: next }));
  }

  // ── Export ────────────────────────────────────────────────────────────────

  /** Render the cropped region to a canvas and return a JPEG data URL. */
  function getCrop(outputW: number, outputH: number): string {
    const img = imgRef.current!;
    const { zoom, offset } = S.current;

    const canvas = document.createElement("canvas");
    canvas.width = outputW;
    canvas.height = outputH;
    const ctx = canvas.getContext("2d")!;

    // Map preview-space visible region back to source image coordinates
    const cropX = -((previewW - img.naturalWidth * zoom) / 2 + offset.x) / zoom;
    const cropY = -((previewH - img.naturalHeight * zoom) / 2 + offset.y) / zoom;
    const cropW = previewW / zoom;
    const cropH = previewH / zoom;

    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, outputW, outputH);
    return canvas.toDataURL("image/jpeg", 0.92);
  }

  // Cleanup on unmount
  useEffect(() => () => cancelInertia(), []);

  return {
    containerRef,
    state,
    loadImage,
    setZoom,
    onMouseDown,
    getCrop,
  };
}
