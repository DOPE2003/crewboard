import React from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
  circle?: boolean;
}

export function Skeleton({ width, height, className = "", style, circle }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: typeof width === "number" ? width : (width ?? "100%"),
        height: typeof height === "number" ? height : (height ?? "1rem"),
        borderRadius: circle ? "50%" : undefined,
        ...style,
      }}
    />
  );
}

// ── Composed patterns ──────────────────────────────────────────────────────

export function MessageSkeleton() {
  return (
    <div style={{ display: "flex", gap: 10, padding: "12px 14px", borderBottom: "1px solid var(--card-border)" }}>
      <Skeleton width={44} height={44} circle style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7, paddingTop: 2 }}>
        <Skeleton width="55%" height={13} />
        <Skeleton width="85%" height={11} />
      </div>
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div style={{
      borderRadius: 14, border: "1px solid var(--card-border)",
      overflow: "hidden", background: "var(--card-bg)",
    }}>
      <div style={{ padding: "1rem 1.25rem", display: "flex", gap: "1rem" }}>
        <Skeleton width={42} height={42} circle style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <Skeleton width="65%" height={14} />
          <Skeleton width="40%" height={11} />
          <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
            <Skeleton width={80} height={20} style={{ borderRadius: 99 }} />
            <Skeleton width={100} height={20} style={{ borderRadius: 99 }} />
          </div>
        </div>
      </div>
      <div style={{ borderTop: "1px solid var(--card-border)", padding: "0.65rem 1.25rem", display: "flex", justifyContent: "flex-end" }}>
        <Skeleton width={110} height={32} style={{ borderRadius: 8 }} />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", padding: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Skeleton width={80} height={80} circle style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
          <Skeleton width="60%" height={18} />
          <Skeleton width="40%" height={13} />
          <Skeleton width="35%" height={11} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <Skeleton width="100%" height={12} />
        <Skeleton width="88%" height={12} />
        <Skeleton width="72%" height={12} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Skeleton width={120} height={40} style={{ borderRadius: 10 }} />
        <Skeleton width={100} height={40} style={{ borderRadius: 10 }} />
      </div>
    </div>
  );
}

export function ConversationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <MessageSkeleton key={i} />
      ))}
    </>
  );
}

export function OrderListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {Array.from({ length: count }).map((_, i) => (
        <OrderSkeleton key={i} />
      ))}
    </div>
  );
}

export default Skeleton;
