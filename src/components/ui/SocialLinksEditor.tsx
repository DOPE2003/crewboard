"use client";

import { useState, useRef } from "react";
import { Twitter, Send, Globe, Plus, Github } from "lucide-react";
import { updateSocialLinks } from "@/actions/profile";
import { useRouter } from "next/navigation";

interface Props {
  twitterHandle: string;
  telegramHandle: string | null;
  website: string | null;
  githubHandle: string | null;
  isOwnProfile: boolean;
}

export default function SocialLinksEditor({ twitterHandle, telegramHandle, website, githubHandle, isOwnProfile }: Props) {
  const router = useRouter();
  const [editingTg, setEditingTg] = useState(false);
  const [editingWeb, setEditingWeb] = useState(false);
  const [editingGh, setEditingGh] = useState(false);
  const [tgVal, setTgVal] = useState(telegramHandle ?? "");
  const [webVal, setWebVal] = useState(website ?? "");
  const [ghVal, setGhVal] = useState(githubHandle ?? "");
  const [saving, setSaving] = useState(false);
  const tgRef = useRef<HTMLInputElement>(null);
  const webRef = useRef<HTMLInputElement>(null);
  const ghRef = useRef<HTMLInputElement>(null);

  const pill: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 5,
    fontSize: "12px", fontWeight: 500, padding: "5px 12px", borderRadius: 99,
    background: "var(--background)", color: "var(--text-muted)",
    border: "0.5px solid var(--card-border)", textDecoration: "none",
    transition: "border-color 0.15s, color 0.15s", cursor: "pointer",
  };

  const addPill: React.CSSProperties = {
    ...pill,
    border: "0.5px dashed var(--card-border)",
  };

  async function saveTg() {
    if (saving) return;
    setSaving(true);
    try {
      await updateSocialLinks({ telegramHandle: tgVal });
      router.refresh();
    } finally {
      setSaving(false);
      setEditingTg(false);
    }
  }

  async function saveWeb() {
    if (saving) return;
    setSaving(true);
    try {
      await updateSocialLinks({ website: webVal });
      router.refresh();
    } finally {
      setSaving(false);
      setEditingWeb(false);
    }
  }

  async function saveGh() {
    if (saving) return;
    setSaving(true);
    try {
      await updateSocialLinks({ githubHandle: ghVal });
      router.refresh();
    } finally {
      setSaving(false);
      setEditingGh(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {/* Twitter — always shown */}
      <a
        href={`https://twitter.com/${twitterHandle}`}
        target="_blank"
        rel="noopener noreferrer"
        style={pill}
      >
        <Twitter size={12} />
        @{twitterHandle}
      </a>

      {/* Telegram */}
      {editingTg ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Send size={12} style={{ color: "#14B8A6", flexShrink: 0 }} />
          <input
            ref={tgRef}
            autoFocus
            value={tgVal}
            onChange={e => setTgVal(e.target.value)}
            placeholder="username"
            onBlur={saveTg}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); saveTg(); } if (e.key === "Escape") { setEditingTg(false); setTgVal(telegramHandle ?? ""); } }}
            style={{
              fontSize: "12px", padding: "4px 8px", borderRadius: 8,
              border: "1px solid #14B8A6", outline: "none",
              background: "var(--background)", color: "var(--foreground)",
              width: 120,
            }}
          />
        </span>
      ) : telegramHandle ? (
        <a
          href={`https://t.me/${telegramHandle}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={isOwnProfile ? (e) => { e.preventDefault(); setEditingTg(true); } : undefined}
          style={pill}
        >
          <Send size={12} />
          {telegramHandle}
        </a>
      ) : isOwnProfile ? (
        <button onClick={() => { setEditingTg(true); }} style={{ ...addPill, background: "none", border: "0.5px dashed var(--card-border)" }}>
          <Plus size={11} />
          Add Telegram
        </button>
      ) : null}

      {/* Website */}
      {editingWeb ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Globe size={12} style={{ color: "#14B8A6", flexShrink: 0 }} />
          <input
            ref={webRef}
            autoFocus
            value={webVal}
            onChange={e => setWebVal(e.target.value)}
            placeholder="https://yoursite.com"
            onBlur={saveWeb}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); saveWeb(); } if (e.key === "Escape") { setEditingWeb(false); setWebVal(website ?? ""); } }}
            style={{
              fontSize: "12px", padding: "4px 8px", borderRadius: 8,
              border: "1px solid #14B8A6", outline: "none",
              background: "var(--background)", color: "var(--foreground)",
              width: 160,
            }}
          />
        </span>
      ) : website ? (
        <a
          href={website.startsWith("http") ? website : `https://${website}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={isOwnProfile ? (e) => { e.preventDefault(); setEditingWeb(true); } : undefined}
          style={pill}
        >
          <Globe size={12} />
          {website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
        </a>
      ) : isOwnProfile ? (
        <button onClick={() => setEditingWeb(true)} style={{ ...addPill, background: "none", border: "0.5px dashed var(--card-border)" }}>
          <Plus size={11} />
          Add Website
        </button>
      ) : null}

      {/* GitHub */}
      {editingGh ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Github size={12} style={{ color: "#14B8A6", flexShrink: 0 }} />
          <input
            ref={ghRef}
            autoFocus
            value={ghVal}
            onChange={e => setGhVal(e.target.value)}
            placeholder="username"
            onBlur={saveGh}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); saveGh(); } if (e.key === "Escape") { setEditingGh(false); setGhVal(githubHandle ?? ""); } }}
            style={{
              fontSize: "12px", padding: "4px 8px", borderRadius: 8,
              border: "1px solid #14B8A6", outline: "none",
              background: "var(--background)", color: "var(--foreground)",
              width: 120,
            }}
          />
        </span>
      ) : githubHandle ? (
        <a
          href={`https://github.com/${githubHandle}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={isOwnProfile ? (e) => { e.preventDefault(); setEditingGh(true); } : undefined}
          style={pill}
        >
          <Github size={12} />
          {githubHandle}
        </a>
      ) : isOwnProfile ? (
        <button onClick={() => setEditingGh(true)} style={{ ...addPill, background: "none", border: "0.5px dashed var(--card-border)" }}>
          <Plus size={11} />
          Add GitHub
        </button>
      ) : null}
    </div>
  );
}
