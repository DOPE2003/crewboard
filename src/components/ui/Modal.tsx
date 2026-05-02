"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children, footer }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div 
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1.5rem"
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: "var(--card-bg)", borderRadius: 20, width: "100%", maxWidth: 440,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)", animation: "modalIn 0.2s ease-out",
          border: "1px solid var(--card-border)", overflow: "hidden"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: translateY(10px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        {/* Header */}
        <div style={{ padding: "1.5rem 1.5rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--foreground)", margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: "0 1.5rem 1.5rem", fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{ padding: "1rem 1.5rem", background: "rgba(var(--foreground-rgb), 0.02)", borderTop: "1px solid var(--card-border)", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
