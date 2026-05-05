"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import PusherClient from "pusher-js";
import { sendMessage, markMessagesAsRead } from "@/actions/messages";
import { respondToOffer, getOfferStatus } from "@/actions/offers";

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
  { label: "👋 What are your rates?", text: "What are your rates?" },
  { label: "📅 Are you available?", text: "Are you available?" },
  { label: "Send portfolio", text: "Send me your portfolio" },
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
const FILE_PREFIX = "__FILE__:";
const OFFER_PREFIX = "__OFFER__:";

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

interface FilePayload {
  name: string;
  size: number;
  type: string;
  data?: string; // legacy field name (web uploads)
  url?: string;  // field name used by iOS uploads
}

function parseFilePayload(body: string): FilePayload | null {
  if (!body.startsWith(FILE_PREFIX)) return null;
  try { return JSON.parse(body.slice(FILE_PREFIX.length)); } catch { return null; }
}

function FileBubble({ payload, mine }: { payload: FilePayload; mine: boolean }) {
  const isImage = payload.type.startsWith("image/");
  const isVideo = payload.type.startsWith("video/");
  const isAudio = payload.type.startsWith("audio/");
  const sizeLabel = payload.size > 1024 * 1024
    ? `${(payload.size / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(payload.size / 1024)} KB`;
  // Support both field names: iOS sends "url", web legacy sends "data"
  const src = payload.url ?? payload.data ?? "";
  if (isImage) {
    return (
      <a href={src} download={payload.name} target="_blank" rel="noopener noreferrer" style={{ display: "block", maxWidth: 260 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={payload.name} style={{ width: "100%", borderRadius: 12, display: "block", cursor: "pointer" }} />
        <div style={{ fontSize: 10, color: mine ? "rgba(0,0,0,0.45)" : "var(--text-muted)", marginTop: 4, textAlign: "right" }}>{payload.name}</div>
      </a>
    );
  }
  if (isVideo) {
    return (
      <div style={{ maxWidth: 300 }}>
        <video controls src={src} style={{ width: "100%", borderRadius: 12, display: "block" }} />
        <div style={{ fontSize: 10, color: mine ? "rgba(0,0,0,0.45)" : "var(--text-muted)", marginTop: 4, textAlign: "right" }}>{payload.name} · {sizeLabel}</div>
      </div>
    );
  }
  if (isAudio) {
    return (
      <div style={{ minWidth: 220, maxWidth: 300 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 14px", borderRadius: 12,
          background: mine ? "rgba(0,0,0,0.08)" : "rgba(20,184,166,0.08)",
          border: `1px solid ${mine ? "rgba(0,0,0,0.1)" : "rgba(20,184,166,0.2)"}`,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={mine ? "#0f766e" : "#14B8A6"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: mine ? "rgba(0,0,0,0.8)" : "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{payload.name}</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{sizeLabel}</div>
          </div>
        </div>
        <audio controls src={src} style={{ width: "100%", marginTop: 6, height: 32 }} />
      </div>
    );
  }
  return (
    <a href={src} download={payload.name} target="_blank" rel="noopener noreferrer" style={{
      display: "flex", alignItems: "center", gap: 10, textDecoration: "none",
      padding: "10px 14px", borderRadius: 12,
      background: mine ? "rgba(0,0,0,0.08)" : "rgba(20,184,166,0.08)",
      border: `1px solid ${mine ? "rgba(0,0,0,0.1)" : "rgba(20,184,166,0.2)"}`,
      minWidth: 180, maxWidth: 260,
    }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={mine ? "#0f766e" : "#14B8A6"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
      </svg>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: mine ? "rgba(0,0,0,0.8)" : "var(--foreground)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{payload.name}</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{sizeLabel}</div>
      </div>
    </a>
  );
}

interface OfferPayload {
  offerId: string;
  title: string;
  description: string;
  amount: number;
  deliveryDays: number;
  senderId: string;
  status: "pending" | "accepted" | "declined" | "cancelled" | "disputed";
}

function parseOfferPayload(body: string): OfferPayload | null {
  if (!body.startsWith(OFFER_PREFIX)) return null;
  try { return JSON.parse(body.slice(OFFER_PREFIX.length)); } catch { return null; }
}

const STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)"  },
  accepted:  { label: "Accepted",  color: "#14B8A6", bg: "rgba(20,184,166,0.08)",  border: "rgba(20,184,166,0.2)"  },
  declined:  { label: "Declined",  color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)"   },
  cancelled: { label: "Cancelled", color: "#6b7280", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.2)" },
  disputed:  { label: "Disputed",  color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)"   },
};

function OfferBubble({
  payload,
  mine,
  currentUserId,
  onStatusChange,
}: {
  payload: OfferPayload;
  mine: boolean;
  currentUserId: string;
  onStatusChange: (offerId: string, status: "accepted" | "declined", orderId?: string) => void;
}) {
  const [status, setStatus] = useState<OfferPayload["status"]>(payload.status);
  const [orderId, setOrderId] = useState<string | undefined>();
  const [responding, setResponding] = useState<"accept" | "decline" | null>(null);
  const [respondError, setRespondError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isReceiver = !mine;
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

  // Sync real status from DB on mount — message body can be stale after page refresh
  useEffect(() => {
    getOfferStatus(payload.offerId).then((res) => {
      if (!res) return;
      if (res.status !== status) setStatus(res.status as OfferPayload["status"]);
      if (res.orderId) setOrderId(res.orderId);
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload.offerId]);

  const respond = (action: "accept" | "decline") => {
    setResponding(action);
    setRespondError(null);
    startTransition(async () => {
      try {
        const res = await respondToOffer(payload.offerId, action);
        if ("error" in res) {
          setRespondError(res.error);
          return;
        }
        const newStatus = res.status;
        const newOrderId = res.status === "accepted" ? res.orderId : undefined;
        setStatus(newStatus);
        setOrderId(newOrderId);
        onStatusChange(payload.offerId, newStatus, newOrderId);
      } catch (e: any) {
        setRespondError("Something went wrong. Please try again.");
      } finally {
        setResponding(null);
      }
    });
  };

  return (
    <div style={{
      minWidth: 260, maxWidth: 320,
      borderRadius: 16,
      border: `1.5px solid ${cfg.border}`,
      background: "var(--background)",
      overflow: "hidden",
      boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
    }}>
      {/* Top accent bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}88)` }} />

      <div style={{ padding: "14px 16px" }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            </svg>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: cfg.color }}>
              {status === "pending" && isReceiver ? "Contract Offer — Accept to begin" : "Contract Offer"}
            </span>
          </div>
          {/* Status badge */}
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
            background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
          }}>
            {cfg.label}
          </span>
        </div>

        {/* Title */}
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", marginBottom: 4, lineHeight: 1.3 }}>
          {payload.title}
        </div>

        {/* Description */}
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {payload.description}
        </div>

        {/* Amount + Delivery */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: status === "pending" && isReceiver ? 14 : 0 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#14B8A6", lineHeight: 1 }}>
            ${payload.amount}
          </span>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
            {payload.deliveryDays} day{payload.deliveryDays !== 1 ? "s" : ""} delivery
          </span>
        </div>

        {/* Actions: only receiver sees Accept/Decline while pending */}
        {status === "pending" && isReceiver && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => respond("decline")}
                disabled={!!responding || isPending}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: 9, fontSize: 13, fontWeight: 700,
                  border: "1px solid var(--card-border)", background: "transparent",
                  color: "var(--text-muted)", cursor: "pointer", fontFamily: "inherit",
                  opacity: responding === "decline" ? 0.6 : 1,
                }}
              >
                {responding === "decline" ? "..." : "Decline"}
              </button>
              <button
                onClick={() => respond("accept")}
                disabled={!!responding || isPending}
                style={{
                  flex: 2, padding: "8px 0", borderRadius: 9, fontSize: 13, fontWeight: 700,
                  border: "none", background: "#14B8A6", color: "#fff",
                  cursor: "pointer", fontFamily: "inherit",
                  opacity: responding === "accept" ? 0.7 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                {responding === "accept" ? "Accepting..." : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Accept Offer
                  </>
                )}
              </button>
            </div>
            {respondError && (
              <p style={{ margin: 0, fontSize: 11, color: "#ef4444", textAlign: "center", lineHeight: 1.4 }}>
                {respondError}
              </p>
            )}
          </div>
        )}

        {/* Accepted: link to order */}
        {status === "accepted" && orderId && (
          <Link
            href={`/orders/${orderId}`}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "9px 0", borderRadius: 9, fontSize: 13, fontWeight: 700,
              background: "rgba(20,184,166,0.1)", color: "#14B8A6",
              border: "1px solid rgba(20,184,166,0.25)", textDecoration: "none",
              marginTop: 2,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            View Order & Fund Escrow
          </Link>
        )}

        {/* Accepted: orderId not yet resolved client-side → link to offers list */}
        {status === "accepted" && !orderId && (
          <Link
            href="/orders"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "9px 0", borderRadius: 9, fontSize: 13, fontWeight: 700,
              background: "rgba(20,184,166,0.1)", color: "#14B8A6",
              border: "1px solid rgba(20,184,166,0.25)", textDecoration: "none",
              marginTop: 2,
            }}
          >
            View Order →
          </Link>
        )}

        {/* Pending (sender) or declined — show View Offer button */}
        {(status === "declined" || (status === "pending" && !isReceiver)) && (
          <Link
            href="/offers"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "9px 0", borderRadius: 9, fontSize: 13, fontWeight: 700,
              background: "transparent", color: "var(--text-muted)",
              border: "1px solid var(--card-border)", textDecoration: "none",
              marginTop: 2,
            }}
          >
            View Offer →
          </Link>
        )}
      </div>
    </div>
  );
}

function replyBodyPreview(body: string): string {
  if (body.startsWith(GIG_PREFIX)) return "Service Request";
  if (body.startsWith(OFFER_PREFIX)) {
    try {
      const p = JSON.parse(body.slice(OFFER_PREFIX.length));
      return `Offer: ${p.title} — $${p.amount}`;
    } catch {}
    return "Custom Offer";
  }
  if (body.startsWith(FILE_PREFIX)) {
    try {
      const p = JSON.parse(body.slice(FILE_PREFIX.length));
      if (p.type?.startsWith("image/")) return `📷 ${p.name}`;
      if (p.type?.startsWith("video/")) return `🎥 ${p.name}`;
      if (p.type?.startsWith("audio/")) return `🎵 ${p.name}`;
      return `📎 ${p.name}`;
    } catch {}
    return "📎 File";
  }
  return body.slice(0, 60) + (body.length > 60 ? "…" : "");
}

function GigCardBubble({ gig }: { gig: GigCard; mine: boolean }) {
  return (
    <Link href={`/gigs/${gig.id}`} className="msgs-gig-card" style={{
      display: "block",
      textDecoration: "none",
      borderRadius: 16,
      border: "1.5px solid #e5e7eb",
      background: "white",
      padding: "16px",
      maxWidth: 280,
      cursor: "pointer",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    }}>
      {/* Header */}
      <div style={{
        fontFamily: "Inter, sans-serif",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "#14B8A6",
        marginBottom: 10,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
        </svg>
        Service Request
      </div>
      {/* Title */}
      <div style={{
        fontFamily: "Inter, sans-serif",
        fontWeight: 700,
        fontSize: 14,
        color: "#111827",
        lineHeight: 1.4,
        marginBottom: 6,
      }}>
        {gig.title}
      </div>
      {/* Price + delivery */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 18, color: "#14B8A6" }}>
          ${gig.price}
        </span>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#9ca3af" }}>
          {gig.days} day{gig.days !== 1 ? "s" : ""} delivery
        </span>
      </div>
      {/* CTA */}
      <div style={{
        display: "block",
        textAlign: "center",
        background: "#f0fdfa",
        color: "#14B8A6",
        border: "1px solid #99f6e4",
        borderRadius: 10,
        padding: "8px 16px",
        fontFamily: "Inter, sans-serif",
        fontSize: 12,
        fontWeight: 700,
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
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showActionId, setShowActionId] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<FilePayload | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const threadBodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const pusherRef = useRef<InstanceType<typeof PusherClient> | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          // Clear typing indicator when message arrives
          setOtherIsTyping(false);
        }
      });
      channel.bind("typing", (data: { userId: string }) => {
        if (data.userId !== currentUserId) {
          setOtherIsTyping(true);
          if (typingClearRef.current) clearTimeout(typingClearRef.current);
          typingClearRef.current = setTimeout(() => setOtherIsTyping(false), 2500);
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

  const sendText = async (text: string) => {
    if (!text || sending) return;
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
      // Show safety banner only for image attachments or wallet addresses
      const isImage = text.startsWith(FILE_PREFIX) && (() => { try { return JSON.parse(text.slice(FILE_PREFIX.length)).type?.startsWith("image/"); } catch { return false; } })();
      const hasWalletAddress = /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/.test(text) || /\b0x[a-fA-F0-9]{40}\b/.test(text);
      if (isImage || hasWalletAddress) {
        setShowPaymentPopup(true);
        setTimeout(() => setShowPaymentPopup(false), 5000);
      }
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

  const send = async () => {
    if (attachedFile) {
      const text = FILE_PREFIX + JSON.stringify(attachedFile);
      setAttachedFile(null);
      await sendText(text);
      if (body.trim()) await sendText(body.trim());
      setBody("");
      return;
    }
    if (!body.trim() || sending) return;
    await sendText(body.trim());
  };

  const handleQuickReply = async (text: string) => {
    if (!text || sending) return;
    await sendText(text);
  };

  const processFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { setSendError("File too large (max 10 MB)"); return; }
    setUploading(true);
    setUploadProgress(0);
    setSendError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      const uploadPromise = new Promise<{ url: string }>((resolve, reject) => {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 90));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText)); } catch { reject(new Error("Invalid response")); }
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              reject(new Error(err.error || "Upload failed"));
            } catch { reject(new Error(`Upload failed (${xhr.status})`)); }
          }
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.open("POST", "/api/messages/upload");
        xhr.send(formData);
      });

      const result = await uploadPromise;
      setUploadProgress(100);
      // Brief pause at 100% for visual satisfaction
      await new Promise(r => setTimeout(r, 200));
      setAttachedFile({ name: file.name, size: file.size, type: file.type, data: result.url });
    } catch (err: any) {
      setSendError(err?.message ?? "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    processFile(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragOver(false);
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragOver(false);
    dragCounter.current = 0;
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
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
    <div
      className="msgs-thread"
      style={{ position: "relative" }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragOver && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 50,
          background: "rgba(20,184,166,0.07)",
          border: "2px dashed #14B8A6",
          borderRadius: 12,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 12, pointerEvents: "none",
        }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(20,184,166,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#14B8A6" }}>Drop to attach</span>
        </div>
      )}
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

                {(() => {
                  const filePayload = parseFilePayload(m.body);
                  const offerPayload = parseOfferPayload(m.body);
                  if (gigCard) return (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", gap: "0.25rem" }}>
                      {m.replyTo && <QuotedMessage replyTo={m.replyTo} mine={mine} currentUserId={currentUserId} otherDisplayName={otherDisplayName} />}
                      <GigCardBubble gig={gigCard} mine={mine} />
                      <span className="msgs-bubble-time" style={{ marginRight: mine ? "0.25rem" : 0, marginLeft: mine ? 0 : "0.25rem" }}>{formatTime(m.createdAt)}</span>
                    </div>
                  );
                  if (offerPayload) return (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", gap: "0.25rem" }}>
                      {m.replyTo && <QuotedMessage replyTo={m.replyTo} mine={mine} currentUserId={currentUserId} otherDisplayName={otherDisplayName} />}
                      <OfferBubble
                        payload={offerPayload}
                        mine={mine}
                        currentUserId={currentUserId}
                        onStatusChange={(offerId, newStatus, newOrderId) => {
                          setMessages(prev => prev.map(msg =>
                            msg.id === m.id
                              ? { ...msg, body: OFFER_PREFIX + JSON.stringify({ ...offerPayload, status: newStatus }) }
                              : msg
                          ));
                          if (newOrderId) {
                            // Update the offer bubble body with orderId for link
                          }
                        }}
                      />
                      <span className="msgs-bubble-time" style={{ marginRight: mine ? "0.25rem" : 0, marginLeft: mine ? 0 : "0.25rem" }}>{formatTime(m.createdAt)}</span>
                    </div>
                  );
                  if (filePayload) return (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", gap: "0.25rem" }}>
                      {m.replyTo && <QuotedMessage replyTo={m.replyTo} mine={mine} currentUserId={currentUserId} otherDisplayName={otherDisplayName} />}
                      <FileBubble payload={filePayload} mine={mine} />
                      <span className="msgs-bubble-time" style={{ marginRight: mine ? "0.25rem" : 0, marginLeft: mine ? 0 : "0.25rem" }}>{formatTime(m.createdAt)}</span>
                    </div>
                  );
                  return (
                    <div className={`msgs-bubble ${mine ? "msgs-bubble-mine" : "msgs-bubble-theirs"}`}>
                      {m.replyTo && <QuotedMessage replyTo={m.replyTo} mine={mine} currentUserId={currentUserId} otherDisplayName={otherDisplayName} />}
                      <span className="msgs-bubble-text">{m.body}</span>
                      <span className="msgs-bubble-time">{formatTime(m.createdAt)}</span>
                    </div>
                  );
                })()}
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
        {/* Typing indicator */}
        {otherIsTyping && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 16px 8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 3, background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, padding: "6px 12px" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text-muted)", animation: "typingDot 1.2s ease-in-out infinite" }} />
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text-muted)", animation: "typingDot 1.2s ease-in-out 0.2s infinite" }} />
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text-muted)", animation: "typingDot 1.2s ease-in-out 0.4s infinite" }} />
            </div>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{otherDisplayName} is typing…</span>
            <style>{`@keyframes typingDot { 0%,60%,100%{transform:translateY(0);opacity:0.4} 30%{transform:translateY(-4px);opacity:1} }`}</style>
          </div>
        )}
        <div style={{ height: 4 }} />
      </div>

      {/* Payment safety popup */}
      {showPaymentPopup && (
        <div style={{
          position: "absolute", bottom: 90, left: "50%", transform: "translateX(-50%)",
          zIndex: 100, width: "calc(100% - 32px)", maxWidth: 420,
          background: "#1a1a1a", borderRadius: 14,
          padding: "14px 16px", boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          display: "flex", alignItems: "flex-start", gap: 12,
          animation: "fadeSlideUp 0.25s ease",
        }}>
          <style>{`@keyframes fadeSlideUp { from { opacity:0; transform:translateX(-50%) translateY(10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 3 }}>Stay safe on Crewboard</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>Use our payment system for secure transactions and avoid scammers.</div>
          </div>
          <button onClick={() => setShowPaymentPopup(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 2, flexShrink: 0, lineHeight: 1 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
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
              key={q.text}
              type="button"
              className="msgs-quick-pill"
              onClick={() => handleQuickReply(q.text)}
              disabled={sending}
            >
              {q.label}
            </button>
          ))}
        </div>
      )}

      {/* File preview bar */}
      {(attachedFile || uploading) && (
        <div style={{
          padding: "10px 14px 6px",
          borderTop: "1px solid var(--card-border)",
          background: "var(--dropdown-bg)",
        }}>
          <style>{`
            @keyframes uploadPulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
            @keyframes uploadGlow { 0%{box-shadow:0 0 0 0 rgba(20,184,166,0.3)} 70%{box-shadow:0 0 0 8px rgba(20,184,166,0)} 100%{box-shadow:0 0 0 0 rgba(20,184,166,0)} }
            @keyframes uploadCheck { 0%{transform:scale(0) rotate(-45deg);opacity:0} 50%{transform:scale(1.2) rotate(0deg);opacity:1} 100%{transform:scale(1) rotate(0deg);opacity:1} }
            @keyframes uploadShimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
          `}</style>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "var(--background)",
            border: uploading ? "1px solid rgba(20,184,166,0.3)" : "1px solid var(--card-border)",
            borderRadius: 12,
            padding: "8px 10px",
            boxShadow: uploading ? "0 2px 12px rgba(20,184,166,0.1)" : "0 1px 4px rgba(0,0,0,0.06)",
            transition: "all 0.3s ease",
          }}>
            {/* Thumbnail / icon */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              {(attachedFile?.type ?? "").startsWith("image/") && attachedFile ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={attachedFile.data} alt={attachedFile.name}
                  style={{
                    width: 52, height: 52, borderRadius: 8, objectFit: "cover",
                    border: "1px solid var(--card-border)",
                    animation: uploading ? "uploadPulse 1.5s ease-in-out infinite" : "none",
                  }} />
              ) : (
                <div style={{
                  width: 52, height: 52, borderRadius: 8,
                  background: uploading ? "rgba(20,184,166,0.12)" : "rgba(20,184,166,0.08)",
                  border: "1px solid rgba(20,184,166,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  animation: uploading ? "uploadGlow 1.5s ease-in-out infinite" : "none",
                }}>
                  {uploading ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "uploadPulse 1.2s ease-in-out infinite" }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
                    </svg>
                  )}
                </div>
              )}
              {/* Completion checkmark overlay */}
              {!uploading && attachedFile && (
                <div style={{
                  position: "absolute", bottom: -3, right: -3,
                  width: 18, height: 18, borderRadius: "50%",
                  background: "#14B8A6", display: "flex", alignItems: "center", justifyContent: "center",
                  animation: "uploadCheck 0.4s ease forwards",
                  border: "2px solid var(--background)",
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {attachedFile?.name ?? "Uploading..."}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                {attachedFile ? (
                  attachedFile.size > 1024 * 1024 ? `${(attachedFile.size / 1024 / 1024).toFixed(1)} MB` : `${Math.round(attachedFile.size / 1024)} KB`
                ) : ""}
                {uploading && <span style={{ marginLeft: 4, color: "#14B8A6", fontWeight: 600 }}>Uploading {uploadProgress}%</span>}
                {!uploading && attachedFile && <span style={{ marginLeft: 4, color: "#14B8A6", fontWeight: 600 }}>Ready</span>}
              </div>
              {/* Animated progress bar */}
              {uploading && (
                <div style={{ height: 4, borderRadius: 99, background: "var(--card-border)", marginTop: 6, overflow: "hidden", position: "relative" }}>
                  <div style={{
                    height: "100%", borderRadius: 99,
                    background: "linear-gradient(90deg, #14B8A6, #0d9488, #14B8A6)",
                    backgroundSize: "200% 100%",
                    width: `${uploadProgress}%`,
                    transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    animation: uploadProgress < 100 ? "uploadShimmer 1.5s linear infinite" : "none",
                  }} />
                </div>
              )}
            </div>
            <button
              onClick={() => { setAttachedFile(null); setUploading(false); setUploadProgress(0); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, display: "flex", flexShrink: 0, borderRadius: 6 }}
              aria-label="Remove file"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="msgs-input-row">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          onChange={handleFileAttach}
          accept="image/*,video/*,.pdf,.doc,.docx,.zip,.txt,.csv,.xls,.xlsx,.ppt,.pptx,.mp3,.wav,.mp4,.mov,.avi"
        />
        {/* Attachment button */}
        <button
          className="msgs-input-icon-btn"
          type="button"
          aria-label="Attachment"
          onClick={() => fileInputRef.current?.click()}
          style={attachedFile ? { color: "#14B8A6" } : {}}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
          </svg>
        </button>
        <textarea
          ref={inputRef}
          className="msgs-input"
          placeholder={attachedFile ? "Add a caption… (optional)" : "Write a message… (Enter to send)"}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            // Debounce typing event (fire at most every 1s)
            if (typingTimerRef.current) return;
            typingTimerRef.current = setTimeout(() => {
              typingTimerRef.current = null;
              fetch("/api/typing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId }) }).catch(() => {});
            }, 800);
          }}
          onKeyDown={handleKey}
          rows={1}
          style={{}}
        />
        <button
          className="msgs-send-btn"
          onClick={send}
          disabled={(!body.trim() && !attachedFile) || sending || uploading}
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
