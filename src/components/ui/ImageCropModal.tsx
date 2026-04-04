"use client";

import { useImageCrop } from "@/hooks/useImageCrop";
import { useEffect } from "react";

interface Props {
  src: string;
  circular: boolean;
  previewW: number;
  previewH: number;
  outputW: number;
  outputH: number;
  label: string;
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}

export default function ImageCropModal({
  src, circular, previewW, previewH, outputW, outputH, label, onConfirm, onCancel,
}: Props) {
  const { containerRef, state, loadImage, setZoom, onMouseDown, getCrop } =
    useImageCrop(previewW, previewH);

  // Load image when src changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadImage(src); }, [src]);

  function confirm() {
    onConfirm(getCrop(outputW, outputH));
  }

  // Compute image position inside the crop area
  const sw = state.naturalW * state.zoom;
  const sh = state.naturalH * state.zoom;
  const ix = (previewW - sw) / 2 + state.offset.x;
  const iy = (previewH - sh) / 2 + state.offset.y;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/65">
      <div
        className="bg-white rounded-2xl flex flex-col gap-4 w-full"
        style={{
          maxWidth: previewW + 48,
          padding: 24,
          boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
        }}
      >
        {/* Title */}
        <p className="font-bold text-base text-slate-900 m-0">Adjust {label}</p>

        {/* Crop area */}
        <div
          ref={containerRef}
          className="relative select-none bg-slate-200 self-center flex-shrink-0"
          style={{
            width: previewW,
            height: previewH,
            borderRadius: circular ? "50%" : 10,
            overflow: "hidden",
            cursor: state.isDragging ? "grabbing" : "grab",
            border: "2.5px solid #14B8A6",
          }}
          onMouseDown={onMouseDown}
        >
          {state.ready && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              draggable={false}
              style={{
                position: "absolute",
                left: ix,
                top: iy,
                width: sw,
                height: sh,
                pointerEvents: "none",
                userSelect: "none",
              }}
            />
          )}

          {/* Circular mask overlay — dark ring outside the crop circle (avatar only) */}
          {circular && state.ready && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)" }}
            />
          )}

          {!state.ready && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-[3px] border-teal-400 border-t-transparent animate-spin" />
            </div>
          )}
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-2.5">
          {/* minus icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
          <input
            type="range"
            min={state.minZoom}
            max={state.minZoom * 4}
            step={state.minZoom * 0.005}
            value={state.zoom}
            onChange={e => setZoom(parseFloat(e.target.value))}
            disabled={!state.ready}
            className="flex-1 h-1 accent-teal-400"
          />
          {/* plus icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="11" y1="8" x2="11" y2="14"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </div>

        <p className="text-[11px] text-slate-400 text-center -mt-2 m-0">
          Drag to reposition · Scroll or slide to zoom
        </p>

        {/* Buttons */}
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 min-h-[42px] rounded-lg border border-slate-200 bg-transparent text-slate-500 font-semibold text-sm cursor-pointer hover:bg-slate-50 transition-colors"
            style={{ fontFamily: "inherit" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={!state.ready}
            className="flex-1 min-h-[42px] rounded-lg bg-slate-900 text-white font-bold text-sm border-none transition-opacity disabled:opacity-50"
            style={{ cursor: state.ready ? "pointer" : "wait", fontFamily: "inherit" }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
