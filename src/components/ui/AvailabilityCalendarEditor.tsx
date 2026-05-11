"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import WorkCalendar from "@/components/ui/WorkCalendar";
import { updateAvailabilitySettings } from "@/actions/profile";

const RESPONSE_OPTIONS = [
  { value: "within 1 hour",   label: "Within 1 hour" },
  { value: "within 2 hours",  label: "Within 2 hours" },
  { value: "within 24 hours", label: "Within 24 hours" },
  { value: "within 2 days",   label: "Within 2 days" },
  { value: "within a week",   label: "Within a week" },
];

interface Props {
  initialUnavailableDays: string[];
  initialResponseTime: string | null;
  initialAvailability: string;
  bookedDays: string[];
  workedDays: string[];
}

export default function AvailabilityCalendarEditor({
  initialUnavailableDays,
  initialResponseTime,
  initialAvailability,
  bookedDays,
  workedDays,
}: Props) {
  const router = useRouter();
  const [unavailableDays, setUnavailableDays] = useState<string[]>(initialUnavailableDays);
  const [responseTime, setResponseTime]       = useState(initialResponseTime ?? "");
  const [availability, setAvailability]       = useState(initialAvailability);
  const [isPending, startTx]                  = useTransition();
  const [saveState, setSaveState]             = useState<"idle" | "saved" | "error">("idle");
  const [error, setError]                     = useState<string | null>(null);
  const [dirty, setDirty]                     = useState(false);

  function mark(field: "rt" | "av" | "days") {
    setSaveState("idle");
    setDirty(true);
    if (field !== "days") setError(null);
  }

  function handleToggleDay(day: string) {
    setUnavailableDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
    mark("days");
  }

  function handleSave() {
    setError(null);
    startTx(async () => {
      const res = await updateAvailabilitySettings({ unavailableDays, responseTime: responseTime || null, availability });
      if ("error" in res) { setError(res.error); setSaveState("error"); return; }
      setSaveState("saved");
      setDirty(false);
      router.refresh();
    });
  }

  const isVacation = availability === "vacation";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>

      {/* Vacation toggle */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.6rem 0.85rem", borderRadius: 9,
        background: isVacation ? "rgba(148,163,184,0.1)" : "rgba(20,184,166,0.04)",
        border: `1px solid ${isVacation ? "rgba(148,163,184,0.25)" : "rgba(20,184,166,0.12)"}`,
      }}>
        <div>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--foreground)" }}>Vacation Mode</div>
          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: 1 }}>
            {isVacation ? "Clients see you as unavailable" : "Toggle if you're taking time off"}
          </div>
        </div>
        <button
          onClick={() => {
            setAvailability(isVacation ? "available" : "vacation");
            mark("av");
          }}
          style={{
            width: 38, height: 22, borderRadius: 99, border: "none", cursor: "pointer",
            background: isVacation ? "#94a3b8" : "rgba(148,163,184,0.25)",
            position: "relative", flexShrink: 0, transition: "background 0.2s",
          }}
          aria-label="Toggle vacation mode"
        >
          <span style={{
            position: "absolute", top: 3, left: isVacation ? 18 : 3,
            width: 16, height: 16, borderRadius: "50%", background: "#fff",
            transition: "left 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          }} />
        </button>
      </div>

      {/* Response time */}
      <div>
        <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
          Response Time
        </div>
        <select
          value={responseTime}
          onChange={e => { setResponseTime(e.target.value); mark("rt"); }}
          style={{
            width: "100%", padding: "7px 10px", borderRadius: 8, fontSize: "0.75rem",
            border: "1px solid var(--card-border)", background: "var(--card-bg)",
            color: "var(--foreground)", fontFamily: "inherit", cursor: "pointer",
          }}
        >
          <option value="">Not set</option>
          {RESPONSE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Calendar */}
      <div>
        <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
          Mark Unavailable Days
        </div>
        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "0.6rem", lineHeight: 1.45 }}>
          Click any upcoming day to block it. Clients will see those days as unavailable.
        </div>
        <WorkCalendar
          bookedDays={bookedDays}
          workedDays={workedDays}
          unavailableDays={unavailableDays}
          isEditable
          onToggleDay={handleToggleDay}
        />
      </div>

      {/* Save button */}
      {dirty && (
        <button
          onClick={handleSave}
          disabled={isPending}
          style={{
            padding: "8px 0", borderRadius: 8, fontSize: "0.75rem", fontWeight: 700,
            border: "none", cursor: isPending ? "not-allowed" : "pointer",
            background: saveState === "saved" ? "rgba(34,197,94,0.1)" : "rgba(20,184,166,0.9)",
            color: saveState === "saved" ? "#16a34a" : "#fff",
            fontFamily: "inherit", transition: "background 0.15s",
            width: "100%",
          }}
        >
          {isPending ? "Saving…" : saveState === "saved" ? "✓ Saved" : "Save Availability"}
        </button>
      )}

      {error && (
        <p style={{ margin: 0, fontSize: "0.7rem", color: "#ef4444" }}>{error}</p>
      )}
    </div>
  );
}
