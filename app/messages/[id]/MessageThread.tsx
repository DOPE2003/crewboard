"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import PusherClient from "pusher-js";

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

export default function MessageThread({ conversationId, currentUserId }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load initial messages
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages/${conversationId}`, { cache: "no-store" });
      if (!res.ok) return;
      const data: Msg[] = await res.json();
      setMessages(data);
    } catch { /* ignore */ }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Pusher real-time subscription
  useEffect(() => {
    const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe(`conversation-${conversationId}`);

    channel.bind("new-message", (msg: Msg) => {
      // Only append if it's from the other person (our own messages are added optimistically)
      if (msg.senderId !== currentUserId) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`conversation-${conversationId}`);
      pusher.disconnect();
    };
  }, [conversationId, currentUserId]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!body.trim() || sending) return;
    const text = body.trim();
    setSending(true);

    // Optimistic: add message immediately to local state
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
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (res.ok) {
        const confirmed: Msg = await res.json();
        // Replace optimistic message with real one
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticMsg.id ? confirmed : m))
        );
      }
    } catch {
      // Remove optimistic on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
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
      <div className="msgs-thread-body">
        {messages.length === 0 && (
          <div className="msgs-thread-empty">Send the first message to start the conversation.</div>
        )}
        {messages.map((m) => {
          const mine = m.senderId === currentUserId;
          const dateLabel = formatDate(m.createdAt);
          const showDate = dateLabel !== lastDate;
          lastDate = dateLabel;

          return (
            <div key={m.id}>
              {showDate && (
                <div className="msgs-date-sep">{dateLabel}</div>
              )}
              <div className={`msgs-bubble-row ${mine ? "mine" : "theirs"}`}>
                <div className={`msgs-bubble ${mine ? "msgs-bubble-mine" : "msgs-bubble-theirs"}`}>
                  <span className="msgs-bubble-text">{m.body}</span>
                  <span className="msgs-bubble-time">{formatTime(m.createdAt)}</span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="msgs-input-row">
        <textarea
          ref={inputRef}
          className="msgs-input"
          placeholder="Write a message… (Enter to send)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
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
