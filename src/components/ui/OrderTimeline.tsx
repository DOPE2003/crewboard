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

function fmt(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function OrderTimeline({
  events,
  currentStatus,
}: {
  events: { action: string; createdAt: Date }[];
  currentStatus: string;
}) {
  const terminal = currentStatus === "cancelled" || currentStatus === "disputed";
  const inRevision = currentStatus === "revision_requested";

  const timeline: TimelineEvent[] = STEPS.map((step) => {
    const match = events.find((e) => e.action === `order.${step.status}`);
    return { ...step, at: match ? new Date(match.createdAt) : null };
  });

  // For cancelled/disputed, append a final node
  if (terminal) {
    const match = events.find((e) => e.action === `order.${currentStatus}`);
    timeline.push({
      status: currentStatus,
      label: currentStatus === "cancelled" ? "Cancelled" : "Disputed",
      color: currentStatus === "cancelled" ? "#94a3b8" : "#ef4444",
      at: match ? new Date(match.createdAt) : null,
    });
  }

  // For revision_requested, append as a step after delivered
  if (inRevision) {
    const match = events.findLast((e) => e.action === "order.revision_requested");
    timeline.push({
      status: "revision_requested",
      label: "Revision Requested",
      color: "#a78bfa",
      at: match ? new Date(match.createdAt) : null,
    });
  }

  // Determine which steps are done
  const ORDER = ["placed","funded","accepted","delivered","completed"];
  const doneIdx = terminal || inRevision
    ? timeline.length - 1
    : ORDER.indexOf(currentStatus);

  return (
    <div style={{ padding: "1.25rem 1.5rem" }}>
      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1.1rem" }}>
        Order Timeline
      </div>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 0 }}>
        {timeline.map((step, i) => {
          const done = terminal ? i <= doneIdx : ORDER.indexOf(step.status) <= doneIdx;
          const isLast = i === timeline.length - 1;

          return (
            <div key={step.status} style={{ display: "flex", gap: "0.85rem", position: "relative" }}>
              {/* Connector line */}
              {!isLast && (
                <div style={{
                  position: "absolute", left: 7, top: 18, width: 2, height: "calc(100% - 4px)",
                  background: done ? step.color : "var(--card-border)",
                  opacity: done ? 0.4 : 1,
                  transition: "background 0.2s",
                }} />
              )}

              {/* Dot */}
              <div style={{ flexShrink: 0, marginTop: 2 }}>
                <div style={{
                  width: 16, height: 16, borderRadius: "50%",
                  border: `2px solid ${done ? step.color : "var(--card-border)"}`,
                  background: done ? step.color : "var(--dropdown-bg)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s",
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
                <div style={{ fontSize: "0.78rem", fontWeight: done ? 600 : 400, color: done ? "var(--foreground)" : "var(--text-muted)" }}>
                  {step.label}
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
