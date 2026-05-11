"use client";

import { useState, useMemo } from "react";
import OfferCard from "./OfferCard";

type Tab    = "received" | "sent";
type Filter = "all" | "pending" | "accepted" | "declined";

const TABS: { id: Tab; label: string }[] = [
  { id: "received", label: "Received Offers" },
  { id: "sent",     label: "Sent Offers"     },
];

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all",      label: "All"      },
  { id: "pending",  label: "Active"   },
  { id: "accepted", label: "Accepted" },
  { id: "declined", label: "Expired"  },
];

export default function OffersClient({
  sent,
  received,
}: {
  sent: any[];
  received: any[];
}) {
  const [tab,    setTab]    = useState<Tab>("received");
  const [filter, setFilter] = useState<Filter>("all");

  const pool = tab === "received" ? received : sent;

  const filtered = useMemo(() => {
    let list = filter === "all" ? [...pool] : pool.filter(o => o.status === filter);
    // newest always on top; within same time, pending received float up
    list.sort((a, b) => {
      if (filter === "all" && tab === "received") {
        const aPend = a.status === "pending" ? 0 : 1;
        const bPend = b.status === "pending" ? 0 : 1;
        if (aPend !== bPend) return aPend - bPend;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [pool, filter, tab]);

  const counts = useMemo(() => ({
    all:      pool.length,
    pending:  pool.filter(o => o.status === "pending").length,
    accepted: pool.filter(o => o.status === "accepted").length,
    declined: pool.filter(o => o.status === "declined").length,
  }), [pool]);

  const pendingReceived = received.filter(o => o.status === "pending").length;

  return (
    <>
      <style>{`
        .offers-tab-btn:hover { background: rgba(20,184,166,0.06) !important; }
      `}</style>

      {/* ── Primary Tabs ── */}
      <div style={{
        display: "flex", gap: 8,
        marginBottom: "1.5rem",
        padding: "4px",
        background: "var(--card-bg)",
        border: "1px solid var(--card-border)",
        borderRadius: 14,
      }}>
        {TABS.map(t => {
          const total  = t.id === "received" ? received.length : sent.length;
          const badge  = t.id === "received" ? pendingReceived : 0;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              className="offers-tab-btn"
              onClick={() => { setTab(t.id); setFilter("all"); }}
              style={{
                flex: 1,
                padding: "11px 20px",
                border: "none",
                borderRadius: 10,
                background: active ? "#14B8A6" : "transparent",
                color: active ? "#fff" : "var(--text-muted)",
                fontSize: "0.9rem",
                fontWeight: active ? 800 : 600,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.15s",
                letterSpacing: active ? "-0.01em" : "0",
              }}
            >
              {t.label}
              {total > 0 && (
                <span style={{
                  fontSize: "0.68rem", fontWeight: 700,
                  padding: "2px 7px", borderRadius: 99,
                  background: active ? "rgba(255,255,255,0.25)" : "rgba(20,184,166,0.1)",
                  color: active ? "#fff" : "#14B8A6",
                  minWidth: 20, textAlign: "center",
                }}>
                  {total}
                </span>
              )}
              {badge > 0 && !active && (
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: "#f59e0b", flexShrink: 0,
                  boxShadow: "0 0 0 2px rgba(245,158,11,0.25)",
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Filter pills ── */}
      <div style={{
        display: "flex", gap: 6, marginBottom: "1.25rem",
        overflowX: "auto", paddingBottom: 2,
      }}>
        {FILTERS.map(f => {
          const n      = counts[f.id];
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: "5px 14px", borderRadius: 99, flexShrink: 0,
                border: `1px solid ${active ? "rgba(20,184,166,0.4)" : "var(--card-border)"}`,
                background: active ? "rgba(20,184,166,0.08)" : "transparent",
                color: active ? "#14B8A6" : "var(--text-muted)",
                fontSize: "0.76rem", fontWeight: active ? 700 : 500,
                cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 5,
                transition: "all 0.12s",
              }}
            >
              {f.label}
              {n > 0 && (
                <span style={{
                  fontSize: "0.62rem", fontWeight: 700,
                  padding: "0 5px", borderRadius: 99,
                  background: active ? "rgba(20,184,166,0.15)" : "rgba(128,128,128,0.1)",
                  color: active ? "#14B8A6" : "var(--text-muted)",
                }}>
                  {n}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── List ── */}
      {filtered.length === 0 ? (
        <div style={{
          padding: "3rem 2rem", textAlign: "center",
          background: "var(--card-bg)", borderRadius: 14,
          border: "1px solid var(--card-border)",
          color: "var(--text-muted)", fontSize: "0.85rem",
        }}>
          {filter === "all"
            ? tab === "received"
              ? "No offers received yet."
              : "No offers sent yet. Start a conversation and click Send Offer."
            : `No ${FILTERS.find(f => f.id === filter)?.label.toLowerCase()} offers.`}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          {filtered.map(offer => (
            <OfferCard key={offer.id} offer={offer} type={tab} />
          ))}
        </div>
      )}
    </>
  );
}
