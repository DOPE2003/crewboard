interface TimelineEvent {
  status: string;
  label: string;
  at: Date | null;
  color: string;
}

const STEPS: { status: string; label: string; color: string }[] = [
  { status: "placed",    label: "Order Placed",    color: "#f59e0b" },
  { status: "funded",    label: "Escrow Funded",   color: "#14b8a6" },
  { status: "accepted",  label: "Accepted",        color: "#3b82f6" },
  { status: "delivered", label: "Delivered",       color: "#8b5cf6" },
  { status: "completed", label: "Completed",       color: "#22c55e" },
];

const ORDER_IDX: Record<string, number> = {
  placed: 0, funded: 1, accepted: 2, delivered: 3, completed: 4,
};

function fmt(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function OrderTimeline({
  events,
  currentStatus,
  placedAt,
}: {
  events: { action: string; createdAt: Date }[];
  currentStatus: string;
  placedAt?: Date;
}) {
  const terminal  = currentStatus === "cancelled" || currentStatus === "disputed";
  const inRevision = currentStatus === "revision_requested";

  const timeline: TimelineEvent[] = STEPS.map((step) => {
    const match = events.find((e) => e.action === `order.${step.status}`);
    // Use placedAt as fallback for the "placed" step
    const at = match ? new Date(match.createdAt) : (step.status === "placed" && placedAt ? placedAt : null);
    return { ...step, at };
  });

  if (terminal) {
    const match = events.find((e) => e.action === `order.${currentStatus}`);
    timeline.push({
      status: currentStatus,
      label: currentStatus === "cancelled" ? "Cancelled" : "Disputed",
      color: currentStatus === "cancelled" ? "#94a3b8" : "#ef4444",
      at: match ? new Date(match.createdAt) : null,
    });
  }

  if (inRevision) {
    const match = events.findLast((e) => e.action === "order.revision_requested");
    timeline.push({
      status: "revision_requested",
      label: "Revision Requested",
      color: "#a78bfa",
      at: match ? new Date(match.createdAt) : null,
    });
  }

  const doneIdx = terminal || inRevision
    ? timeline.length - 1
    : (ORDER_IDX[currentStatus] ?? -1);

  // Index of the active (current, not-yet-done) step — used for pulse
  const activeIdx = terminal || inRevision || currentStatus === "completed" ? -1 : doneIdx;

  return (
    <div style={{ padding: "1.25rem 1.5rem" }}>
      <style>{`
        @keyframes tlPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(20,184,166,0.4); }
          50%       { box-shadow: 0 0 0 5px rgba(20,184,166,0); }
        }
      `}</style>

      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1.1rem" }}>
        Order Timeline
      </div>

      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 0 }}>
        {timeline.map((step, i) => {
          const done    = terminal ? i <= doneIdx : (ORDER_IDX[step.status] ?? 0) <= doneIdx;
          const isActive = i === activeIdx;
          const isLast  = i === timeline.length - 1;

          return (
            <div key={`${step.status}-${i}`} style={{ display: "flex", gap: "0.85rem", position: "relative" }}>
              {/* Connector line */}
              {!isLast && (
                <div style={{
                  position: "absolute", left: 7, top: 18, width: 2, height: "calc(100% - 4px)",
                  background: done ? step.color : "var(--card-border)",
                  opacity: done ? 0.35 : 1,
                  transition: "background 0.3s",
                }} />
              )}

              {/* Dot */}
              <div style={{ flexShrink: 0, marginTop: 2 }}>
                <div style={{
                  width: 16, height: 16, borderRadius: "50%",
                  border: `2px solid ${done ? step.color : "var(--card-border)"}`,
                  background: done ? step.color : "var(--dropdown-bg)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.3s",
                  animation: isActive ? "tlPulse 2s ease-in-out infinite" : "none",
                }}>
                  {done && (
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5 3.5-4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>

              {/* Label + timestamp */}
              <div style={{ paddingBottom: isLast ? 0 : "1.1rem" }}>
                <div style={{
                  fontSize: "0.78rem",
                  fontWeight: done ? 600 : 400,
                  color: isActive ? step.color : done ? "var(--foreground)" : "var(--text-muted)",
                }}>
                  {step.label}
                  {isActive && (
                    <span style={{ marginLeft: 6, fontSize: "0.6rem", fontWeight: 700, color: step.color, background: `${step.color}18`, padding: "1px 6px", borderRadius: 99 }}>
                      Current
                    </span>
                  )}
                </div>
                {step.at ? (
                  <div style={{ fontSize: "0.67rem", color: "var(--text-muted)", marginTop: 1 }}>
                    {fmt(step.at)}
                  </div>
                ) : (
                  !done && (
                    <div style={{ fontSize: "0.67rem", color: "var(--card-border)", marginTop: 1 }}>
                      Pending
                    </div>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
