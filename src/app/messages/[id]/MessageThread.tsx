"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PusherClient from "pusher-js";
import { sendMessage, markMessagesAsRead } from "@/actions/messages";
import { containsSocial } from "@/lib/filterSocials";

interface ReplyPreview {
  id: string;
  senderId: string;
  body: string;
}

interface Msg {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  read: boolean;
  replyTo: ReplyPreview | null;
}

interface Props {
  conversationId: string;
  currentUserId: string;
  otherUserHandle: string;
  otherUserName: string | null;
  initialMessages?: Msg[];
}

const QUICK_REPLIES = [
  "👋 What are your rates?",
  "📅 Are you available?",
  "📎 Send portfolio",
];

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "TODAY";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "YESTERDAY";
  return d.toLocaleDateString([], { month: "short", day: "numeric" }).toUpperCase();
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

function replyBodyPreview(body: string): string {
  if (body.startsWith(GIG_PREFIX)) return "Service Request";
  return body.slice(0, 60) + (body.length > 60 ? "…" : "");
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
        fontFamily: "Inter, sans-serif",
        fontSize: "0.5rem",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "#2DD4BF",
        marginBottom: "0.35rem",
      }}>
        Service Request
      </div>
      <div style={{
        fontFamily: "Inter, sans-serif",
        fontWeight: 700,
        fontSize: "0.95rem",
        color: mine ? "#fff" : "var(--foreground)",
        lineHeight: 1.3,
        marginBottom: "0.5rem",
      }}>
        {gig.title}
      </div>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.88rem", color: "#2DD4BF" }}>
          ${gig.price}
        </span>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.7rem", color: mine ? "rgba(255,255,255,0.55)" : "var(--text-muted)" }}>
          {gig.days} day{gig.days !== 1 ? "s" : ""} delivery
        </span>
      </div>
      <div style={{
        marginTop: "0.6rem",
        paddingTop: "0.5rem",
        borderTop: mine ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(45,212,191,0.15)",
        fontFamily: "Inter, sans-serif",
        fontSize: "0.68rem",
        color: mine ? "rgba(255,255,255,0.5)" : "var(--text-muted)",
      }}>
        Tap to view service →
      </div>
    </Link>
  );
}

function QuotedMessage({
  replyTo,
  mine,
  currentUserId,
  otherDisplayName,
}: {
  replyTo: ReplyPreview;
  mine: boolean;
  currentUserId: string;
  otherDisplayName: string;
}) {
  const isMyReply = replyTo.senderId === currentUserId;
  const senderLabel = isMyReply ? "You" : otherDisplayName;
  const bodyText = replyTo.body === "__DELETED__"
    ? "Original message unavailable"
    : replyBodyPreview(replyTo.body);

  return (
    <div className="msgs-quoted">
      <div className="msgs-quoted-sender">{senderLabel}</div>
      <div className={`msgs-quoted-body${mine ? " mine" : ""}`}>{bodyText}</div>
    </div>
  );
}

export default function MessageThread({
  conversationId,
  currentUserId,
  otherUserHandle,
  otherUserName,
  initialMessages = [],
}: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [socialWarning, setSocialWarning] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showActionId, setShowActionId] = useState<string | null>(null);
  const threadBodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pusherRef = useRef<InstanceType<typeof PusherClient> | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const otherDisplayName = otherUserName ?? `@${otherUserHandle}`;

  const scrollToBottom = () => {
    const el = threadBodyRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  useEffect(() => {
    markMessagesAsRead(conversationId).catch(() => {});
  }, [conversationId]);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) return;
    if (pusherRef.current) return;

    try {
      pusherRef.current = new PusherClient(key, { cluster });
      const channel = pusherRef.current.subscribe(`conversation-${conversationId}`);
      channel.bind("new-message", (msg: Msg) => {
        if (msg.senderId !== currentUserId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, { ...msg, replyTo: msg.replyTo ?? null }];
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

  useEffect(() => {
    scrollToBottom();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  useEffect(() => {
    if (!showActionId) return;
    const handler = () => setShowActionId(null);
    document.addEventListener("touchstart", handler, { passive: true });
    return () => document.removeEventListener("touchstart", handler);
  }, [showActionId]);

  const handleTouchStart = (msgId: string) => {
    longPressTimer.current = setTimeout(() => {
      setShowActionId(msgId);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const send = async () => {
    if (!body.trim() || sending) return;
    const text = body.trim();
    if (containsSocial(text)) {
      setSocialWarning(true);
      return;
    }
    setSocialWarning(false);
    setSending(true);

    const replySnapshot = replyTo;
    const optimisticMsg: Msg = {
      id: `optimistic-${Date.now()}`,
      senderId: currentUserId,
      body: text,
      createdAt: new Date().toISOString(),
      read: false,
      replyTo: replySnapshot ? { id: replySnapshot.id, senderId: replySnapshot.senderId, body: replySnapshot.body } : null,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setBody("");
    setReplyTo(null);

    try {
      const confirmed = await sendMessage(conversationId, text, replySnapshot?.id);
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMsg.id ? { ...confirmed, replyTo: confirmed.replyTo ?? null } : m))
      );
      setSendError(null);
      router.refresh();
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setBody(text);
      setReplyTo(replySnapshot);
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
    if (e.key === "Escape" && replyTo) {
      setReplyTo(null);
    }
  };

  let lastDate = "";

  return (
    <div className="msgs-thread">
      <div className="msgs-thread-body" ref={threadBodyRef}>
        {messages.length === 0 && (
          <div className="msgs-thread-empty">Send the first message to start the conversation.</div>
        )}

        {messages.map((m, idx) => {
          const mine = m.senderId === currentUserId;
          const dateLabel = formatDate(m.createdAt);
          const showDate = dateLabel !== lastDate;
          lastDate = dateLabel;
          const gigCard = parseGigCard(m.body);
          const isShowingAction = showActionId === m.id;
          const isOptimistic = m.id.startsWith("optimistic-");

          // Show sender name only on first in a sequence for received messages
          const prevMsg = idx > 0 ? messages[idx - 1] : null;
          const showSenderName = !mine && (!prevMsg || prevMsg.senderId !== m.senderId);

          return (
            <div key={m.id}>
              {showDate && (
                <div className="msgs-date-sep">
                  <span className="msgs-date-sep-pill">{dateLabel}</span>
                </div>
              )}

              {/* Mobile action bar */}
              {isShowingAction && (
                <div style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", padding: "0 0.75rem 0.25rem" }}>
                  <button
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={() => { setReplyTo(m); setShowActionId(null); inputRef.current?.focus(); }}
                    className="msgs-action-reply-btn"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
                    </svg>
                    Reply
                  </button>
                </div>
              )}

              {showSenderName && (
                <div className="msgs-sender-name">{otherDisplayName}</div>
              )}

              <div
                className={`msgs-bubble-row ${mine ? "mine" : "theirs"}`}
                onMouseEnter={() => setHoveredId(m.id)}
                onMouseLeave={() => setHoveredId(null)}
                onTouchStart={() => handleTouchStart(m.id)}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchEnd}
                style={{ position: "relative" }}
              >
                {/* Desktop hover reply button */}
                {hoveredId === m.id && (
                  <button
                    onClick={() => { setReplyTo(m); inputRef.current?.focus(); }}
                    className="msgs-hover-reply-btn"
                    style={{ [mine ? "left" : "right"]: 4 }}
                    title="Reply"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
                    </svg>
                  </button>
                )}

                {gigCard ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", gap: "0.25rem" }}>
                    {m.replyTo && (
                      <QuotedMessage replyTo={m.replyTo} mine={mine} currentUserId={currentUserId} otherDisplayName={otherDisplayName} />
                    )}
                    <GigCardBubble gig={gigCard} mine={mine} />
                    <span className="msgs-bubble-time" style={{ marginRight: mine ? "0.25rem" : 0, marginLeft: mine ? 0 : "0.25rem" }}>
                      {formatTime(m.createdAt)}
                    </span>
                  </div>
                ) : (
                  <div className={`msgs-bubble ${mine ? "msgs-bubble-mine" : "msgs-bubble-theirs"}`}>
                    {m.replyTo && (
                      <QuotedMessage replyTo={m.replyTo} mine={mine} currentUserId={currentUserId} otherDisplayName={otherDisplayName} />
                    )}
                    <span className="msgs-bubble-text">{m.body}</span>
                    <span className="msgs-bubble-time">{formatTime(m.createdAt)}</span>
                  </div>
                )}
              </div>

              {/* Message status — only for sent messages */}
              {mine && (
                <div className={`msgs-bubble-status${isOptimistic ? " msgs-bubble-status--sending" : ""}`}>
                  {isOptimistic ? "Sending..." : m.read ? `Seen · ${formatTime(m.createdAt)}` : "Delivered"}
                </div>
              )}
            </div>
          );
        })}
        <div style={{ height: 4 }} />
      </div>

      {/* Warnings */}
      {socialWarning && (
        <div className="msgs-warn-bar">
          Social handles, emails, and links are not allowed. Keep all contact on Crewboard.
        </div>
      )}
      {sendError && (
        <div className="msgs-warn-bar msgs-warn-bar--error" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{sendError}</span>
          <button onClick={() => setSendError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: "1rem", padding: 0, lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* Reply preview bar */}
      {replyTo && (
        <div className="msgs-reply-preview">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="msgs-reply-preview-name">
              Replying to {replyTo.senderId === currentUserId ? "You" : otherDisplayName}
            </div>
            <div className="msgs-reply-preview-text">
              {replyBodyPreview(replyTo.body)}
            </div>
          </div>
          <button onClick={() => setReplyTo(null)} className="msgs-reply-cancel" aria-label="Cancel reply">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {/* Quick reply suggestions — show when < 3 messages */}
      {messages.length < 3 && (
        <div className="msgs-quick-replies">
          {QUICK_REPLIES.map((q) => (
            <button
              key={q}
              type="button"
              className="msgs-quick-pill"
              onClick={() => { setBody(q); inputRef.current?.focus(); }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="msgs-input-row">
        <button className="msgs-input-icon-btn" type="button" aria-label="Emoji">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/>
            <line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
        </button>
        <button className="msgs-input-icon-btn" type="button" aria-label="Attachment">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
          </svg>
        </button>
        <textarea
          ref={inputRef}
          className="msgs-input"
          placeholder="Write a message... (Enter to send)"
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
