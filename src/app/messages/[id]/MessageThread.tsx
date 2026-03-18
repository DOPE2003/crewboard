"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PusherClient from "pusher-js";
import { sendMessage, markMessagesAsRead } from "@/actions/messages";
import { containsSocial } from "@/lib/filterSocials";

interface Msg {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  read: boolean;
}

interface Props {
  conversationId: string;
  currentUserId: string;
  initialMessages?: Msg[];
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

const GIG_PREFIX = "__GIGREQUEST__:";

interface GigCard {
  id: string;
  title: string;
  price: number;
  days: number;
}

function parseGigCard(body: string): GigCard | null {
  if (!body.startsWith(GIG_PREFIX)) return null;
  try {
    return JSON.parse(body.slice(GIG_PREFIX.length));
  } catch {
    return null;
  }
}

function GigCardBubble({ gig, mine }: { gig: GigCard; mine: boolean }) {
  return (
    <Link href={`/gigs/${gig.id}`} className="msgs-gig-card" style={{
      display: "block",
      textDecoration: "none",
      borderRadius: 14,
      border: mine ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(45,212,191,0.25)",
      background: mine ? "rgba(0,0,0,0.12)" : "rgba(45,212,191,0.06)",
      padding: "0.85rem 1rem",
      maxWidth: 280,
      cursor: "pointer",
    }}>
      <div style={{
        fontFamily: "Space Mono, monospace",
        fontSize: "0.5rem",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "#2DD4BF",
        marginBottom: "0.35rem",
      }}>
        Gig Request
      </div>
      <div style={{
        fontFamily: "Rajdhani, sans-serif",
        fontWeight: 700,
        fontSize: "0.95rem",
        color: mine ? "#fff" : "var(--foreground)",
        lineHeight: 1.3,
        marginBottom: "0.5rem",
      }}>
        {gig.title}
      </div>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <span style={{
          fontFamily: "Space Mono, monospace",
          fontWeight: 700,
          fontSize: "0.88rem",
          color: "#2DD4BF",
        }}>
          ${gig.price}
        </span>
        <span style={{
          fontFamily: "Outfit, sans-serif",
          fontSize: "0.7rem",
          color: mine ? "rgba(255,255,255,0.55)" : "var(--text-muted)",
        }}>
          {gig.days} day{gig.days !== 1 ? "s" : ""} delivery
        </span>
      </div>
      <div style={{
        marginTop: "0.6rem",
        paddingTop: "0.5rem",
        borderTop: mine ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(45,212,191,0.15)",
        fontFamily: "Outfit, sans-serif",
        fontSize: "0.68rem",
        color: mine ? "rgba(255,255,255,0.5)" : "var(--text-muted)",
      }}>
        Tap to view gig →
      </div>
    </Link>
  );
}

export default function MessageThread({ conversationId, currentUserId, initialMessages = [] }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [socialWarning, setSocialWarning] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const threadBodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pusherRef = useRef<InstanceType<typeof PusherClient> | null>(null);

  const scrollToBottom = () => {
    const el = threadBodyRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  // Mark messages as read on mount
  useEffect(() => {
    markMessagesAsRead(conversationId).catch(() => {});
  }, [conversationId]);

  // Pusher real-time subscription
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) return;
    if (pusherRef.current) return; // guard against double-mount in Strict Mode

    try {
      pusherRef.current = new PusherClient(key, { cluster });
      const channel = pusherRef.current.subscribe(`conversation-${conversationId}`);
      channel.bind("new-message", (msg: Msg) => {
        if (msg.senderId !== currentUserId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      });
    } catch {}

    return () => {
      try {
        pusherRef.current?.unsubscribe(`conversation-${conversationId}`);
        pusherRef.current?.disconnect();
        pusherRef.current = null;
      } catch {}
    };
  }, [conversationId, currentUserId]);

  // Scroll to bottom when messages change — scroll CONTAINER not the page
  useEffect(() => {
    scrollToBottom();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const send = async () => {
    if (!body.trim() || sending) return;
    const text = body.trim();
    if (containsSocial(text)) {
      setSocialWarning(true);
      return;
    }
    setSocialWarning(false);
    setSending(true);

    const optimisticMsg: Msg = {
      id: `optimistic-${Date.now()}`,
      senderId: currentUserId,
      body: text,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setBody("");

    try {
      const confirmed = await sendMessage(conversationId, text);
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMsg.id ? confirmed : m))
      );
      setSendError(null);
      router.refresh();
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setBody(text); // restore text so user doesn't lose their message
      setSendError(err?.message ?? "Failed to send. Try again.");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  let lastDate = "";

  return (
    <div className="msgs-thread">
      <div className="msgs-thread-body" ref={threadBodyRef}>
        {messages.length === 0 && (
          <div className="msgs-thread-empty">Send the first message to start the conversation.</div>
        )}
        {messages.map((m) => {
          const mine = m.senderId === currentUserId;
          const dateLabel = formatDate(m.createdAt);
          const showDate = dateLabel !== lastDate;
          lastDate = dateLabel;
          const gigCard = parseGigCard(m.body);

          return (
            <div key={m.id}>
              {showDate && (
                <div className="msgs-date-sep">{dateLabel}</div>
              )}
              <div className={`msgs-bubble-row ${mine ? "mine" : "theirs"}`}>
                {gigCard ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", gap: "0.25rem" }}>
                    <GigCardBubble gig={gigCard} mine={mine} />
                    <span className="msgs-bubble-time" style={{ marginRight: mine ? "0.25rem" : 0, marginLeft: mine ? 0 : "0.25rem" }}>
                      {formatTime(m.createdAt)}
                    </span>
                  </div>
                ) : (
                  <div className={`msgs-bubble ${mine ? "msgs-bubble-mine" : "msgs-bubble-theirs"}`}>
                    <span className="msgs-bubble-text">{m.body}</span>
                    <span className="msgs-bubble-time">{formatTime(m.createdAt)}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div style={{ height: 1 }} />
      </div>

      {socialWarning && (
        <div style={{ padding: "6px 14px", fontSize: "0.72rem", color: "#ef4444", background: "rgba(239,68,68,0.06)", borderTop: "1px solid rgba(239,68,68,0.15)" }}>
          Social handles, emails, and links are not allowed. Keep all contact on Crewboard.
        </div>
      )}
      {sendError && (
        <div style={{ padding: "6px 14px", fontSize: "0.72rem", color: "#ef4444", background: "rgba(239,68,68,0.06)", borderTop: "1px solid rgba(239,68,68,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{sendError}</span>
          <button onClick={() => setSendError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: "1rem", padding: 0, lineHeight: 1 }}>×</button>
        </div>
      )}
      <div className="msgs-input-row">
        <textarea
          ref={inputRef}
          className="msgs-input"
          placeholder="Write a message… (Enter to send)"
          value={body}
          onChange={(e) => { setBody(e.target.value); if (socialWarning) setSocialWarning(false); }}
          onKeyDown={handleKey}
          rows={1}
          style={socialWarning ? { borderColor: "#ef4444" } : {}}
        />
        <button
          className="msgs-send-btn"
          onClick={send}
          disabled={!body.trim() || sending}
          aria-label="Send"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
