"use client";

import { useState } from "react";

interface Props {
  bookedDays: string[];
  workedDays: string[];
  unavailableDays?: string[];
  isEditable?: boolean;
  onToggleDay?: (day: string) => void;
}

const DAY_HEADERS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function WorkCalendar({ bookedDays, workedDays, unavailableDays = [], isEditable = false, onToggleDay }: Props) {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const bookedSet      = new Set(bookedDays);
  const workedSet      = new Set(workedDays);
  const unavailableSet = new Set(unavailableDays);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel  = new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function dayStr(d: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  function isPast(ds: string): boolean {
    return ds < todayStr;
  }

  const bookedThisMonth      = bookedDays.filter(d => d.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)).length;
  const workedThisMonth      = workedDays.filter(d => d.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)).length;
  const unavailThisMonth     = unavailableDays.filter(d => d.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)).length;

  return (
    <div>
      {/* Month nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <button
          onClick={prevMonth}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px 6px", borderRadius: 6, fontSize: 14, lineHeight: 1 }}
          aria-label="Previous month"
        >‹</button>
        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--foreground)" }}>{monthLabel}</span>
        <button
          onClick={nextMonth}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px 6px", borderRadius: 6, fontSize: 14, lineHeight: 1 }}
          aria-label="Next month"
        >›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
        {DAY_HEADERS.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", padding: "2px 0", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;

          const ds            = dayStr(day);
          const isToday       = ds === todayStr;
          const isBooked      = bookedSet.has(ds);
          const isWorked      = workedSet.has(ds);
          const isUnavailable = unavailableSet.has(ds);
          const hasBoth       = isBooked && isWorked;
          const past          = isPast(ds);
          const canClick      = isEditable && !past && !isBooked && !isWorked && !!onToggleDay;

          let bg     = "transparent";
          let color  = "var(--text-muted)";
          let border = "transparent";
          let opacity = 1;
          let textDecoration = "none";

          if (isToday) {
            bg = "#14b8a6"; color = "#fff"; border = "#14b8a6";
          } else if (hasBoth) {
            bg = "rgba(20,184,166,0.15)"; color = "var(--foreground)"; border = "rgba(20,184,166,0.4)";
          } else if (isBooked) {
            bg = "rgba(245,158,11,0.12)"; color = "#b45309"; border = "rgba(245,158,11,0.35)";
          } else if (isWorked) {
            bg = "rgba(20,184,166,0.1)"; color = "#0f766e"; border = "rgba(20,184,166,0.3)";
          } else if (isUnavailable) {
            bg = "rgba(148,163,184,0.1)"; color = "var(--text-muted)"; border = "rgba(148,163,184,0.22)";
            opacity = 0.7;
          }

          return (
            <div
              key={ds}
              onClick={canClick ? () => onToggleDay!(ds) : undefined}
              title={canClick ? (isUnavailable ? "Mark available" : "Mark unavailable") : undefined}
              style={{
                textAlign: "center",
                padding: "4px 2px",
                borderRadius: 6,
                fontSize: "0.72rem",
                fontWeight: isToday ? 800 : (isBooked || isWorked || isUnavailable) ? 700 : 400,
                background: bg,
                color,
                border: `1px solid ${border}`,
                lineHeight: 1.6,
                position: "relative",
                opacity,
                textDecoration: isUnavailable && !isToday && !isBooked && !isWorked ? "line-through" : textDecoration,
                cursor: canClick ? "pointer" : "default",
                userSelect: "none",
                transition: canClick ? "opacity 0.1s" : undefined,
              }}
            >
              {day}
              {hasBoth && (
                <span style={{ position: "absolute", top: 1, right: 2, width: 4, height: 4, borderRadius: "50%", background: "#f59e0b", display: "block" }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Month summary */}
      {(bookedThisMonth > 0 || workedThisMonth > 0 || unavailThisMonth > 0) && (
        <div style={{ marginTop: "0.85rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {bookedThisMonth > 0 && (
            <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: "rgba(245,158,11,0.1)", color: "#b45309", border: "1px solid rgba(245,158,11,0.25)" }}>
              {bookedThisMonth} booked
            </span>
          )}
          {workedThisMonth > 0 && (
            <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: "rgba(20,184,166,0.1)", color: "#0f766e", border: "1px solid rgba(20,184,166,0.25)" }}>
              {workedThisMonth} worked
            </span>
          )}
          {unavailThisMonth > 0 && (
            <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: "rgba(148,163,184,0.1)", color: "var(--text-muted)", border: "1px solid rgba(148,163,184,0.2)" }}>
              {unavailThisMonth} unavailable
            </span>
          )}
        </div>
      )}

      {/* Legend */}
      <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        <LegendDot bg="rgba(245,158,11,0.2)" border="rgba(245,158,11,0.4)" label="Booked" />
        <LegendDot bg="rgba(20,184,166,0.15)" border="rgba(20,184,166,0.35)" label="Worked" />
        {unavailableDays.length > 0 || isEditable ? (
          <LegendDot bg="rgba(148,163,184,0.15)" border="rgba(148,163,184,0.3)" label="Unavailable" />
        ) : null}
        <LegendDot bg="#14b8a6" border="#14b8a6" label="Today" />
      </div>
    </div>
  );
}

function LegendDot({ bg, border, label }: { bg: string; border: string; label: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.65rem", color: "var(--text-muted)" }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: bg, border: `1px solid ${border}`, display: "inline-block", flexShrink: 0 }} />
      {label}
    </span>
  );
}
