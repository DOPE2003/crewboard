"use client";

import { useState, useRef } from "react";
import { Twitter, Send, Globe, Plus, Github, Linkedin, X } from "lucide-react";
import { updateSocialLinks } from "@/actions/profile";
import { useRouter } from "next/navigation";

interface Props {
  twitterHandle: string;
  twitterHandle2: string | null;
  telegramHandle: string | null;
  website: string | null;
  website2: string | null;
  website3: string | null;
  githubHandle: string | null;
  discordHandle: string | null;
  linkedinHandle: string | null;
  isOwnProfile: boolean;
  isTwitterUser?: boolean;
}

function DiscordIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z" />
    </svg>
  );
}

export default function SocialLinksEditor({
  twitterHandle, twitterHandle2, telegramHandle, website, website2, website3,
  githubHandle, discordHandle, linkedinHandle, isOwnProfile, isTwitterUser = false,
}: Props) {
  const router = useRouter();
  const [editingTw2, setEditingTw2] = useState(false);
  const [editingTg, setEditingTg] = useState(false);
  const [editingWeb, setEditingWeb] = useState(false);
  const [editingWeb2, setEditingWeb2] = useState(false);
  const [editingWeb3, setEditingWeb3] = useState(false);
  const [editingGh, setEditingGh] = useState(false);
  const [editingDiscord, setEditingDiscord] = useState(false);
  const [editingLinkedin, setEditingLinkedin] = useState(false);
  const [tw2Val, setTw2Val] = useState(twitterHandle2 ?? "");
  const [tgVal, setTgVal] = useState(telegramHandle ?? "");
  const [webVal, setWebVal] = useState(website ?? "");
  const [web2Val, setWeb2Val] = useState(website2 ?? "");
  const [web3Val, setWeb3Val] = useState(website3 ?? "");
  const [ghVal, setGhVal] = useState(githubHandle ?? "");
  const [discordVal, setDiscordVal] = useState(discordHandle ?? "");
  const [linkedinVal, setLinkedinVal] = useState(linkedinHandle ?? "");
  const [saving, setSaving] = useState(false);
  const tw2Ref = useRef<HTMLInputElement>(null);
  const tgRef = useRef<HTMLInputElement>(null);
  const webRef = useRef<HTMLInputElement>(null);
  const web2Ref = useRef<HTMLInputElement>(null);
  const web3Ref = useRef<HTMLInputElement>(null);
  const ghRef = useRef<HTMLInputElement>(null);
  const discordRef = useRef<HTMLInputElement>(null);
  const linkedinRef = useRef<HTMLInputElement>(null);

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

  const inputStyle: React.CSSProperties = {
    fontSize: "12px", padding: "4px 8px", borderRadius: 8,
    border: "1px solid #14B8A6", outline: "none",
    background: "var(--background)", color: "var(--foreground)",
    width: 120,
  };

  async function save(field: string, value: string, setEditing: (v: boolean) => void) {
    if (saving) return;
    setSaving(true);
    try {
      await updateSocialLinks({ [field]: value });
      router.refresh();
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  function renderHandlePill(
    label: string,
    icon: React.ReactNode,
    value: string | null,
    editVal: string,
    setEditVal: (v: string) => void,
    editing: boolean,
    setEditing: (v: boolean) => void,
    fieldKey: string,
    hrefFn: (v: string) => string,
    placeholder: string,
    ref: React.RefObject<HTMLInputElement | null>,
    wide?: boolean,
  ) {
    if (editing) {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          {icon}
          <input
            ref={ref}
            autoFocus
            value={editVal}
            onChange={e => setEditVal(e.target.value)}
            placeholder={placeholder}
            onBlur={() => save(fieldKey, editVal, setEditing)}
            onKeyDown={e => {
              if (e.key === "Enter") { e.preventDefault(); save(fieldKey, editVal, setEditing); }
              if (e.key === "Escape") { setEditing(false); setEditVal(value ?? ""); }
            }}
            style={{ ...inputStyle, width: wide ? 160 : 120 }}
          />
        </span>
      );
    }
    if (value) {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 0 }}>
          <a
            href={hrefFn(value)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={isOwnProfile ? (e) => { e.preventDefault(); setEditing(true); } : undefined}
            style={pill}
          >
            {icon}
            {wide ? value.replace(/^https?:\/\//, "").replace(/\/$/, "") : value}
          </a>
          {isOwnProfile && (
            <button
              onClick={() => { setEditVal(""); save(fieldKey, "", setEditing); }}
              title={`Remove ${label}`}
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 20, height: 20, borderRadius: "50%", border: "none",
                background: "transparent", color: "var(--text-muted)", cursor: "pointer",
                marginLeft: -4, padding: 0, transition: "color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              <X size={10} strokeWidth={2.5} />
            </button>
          )}
        </span>
      );
    }
    if (isOwnProfile) {
      return (
        <button onClick={() => setEditing(true)} style={{ ...addPill, background: "none", border: "0.5px dashed var(--card-border)" }}>
          <Plus size={11} />
          Add {label}
        </button>
      );
    }
    return null;
  }

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {/* Primary X — only shown for real Twitter OAuth users */}
      {isTwitterUser && (
        <a
          href={`https://twitter.com/${twitterHandle}`}
          target="_blank"
          rel="noopener noreferrer"
          style={pill}
        >
          <Twitter size={12} />
          @{twitterHandle}
        </a>
      )}

      {/* X account (editable) — for Twitter users this is a second account; for others it's their primary */}
      {renderHandlePill(
        "X Account",
        <Twitter size={12} style={{ flexShrink: 0 }} />,
        twitterHandle2, tw2Val, setTw2Val, editingTw2, setEditingTw2,
        "twitterHandle2", v => `https://twitter.com/${v}`, "@handle", tw2Ref,
      )}

      {/* Telegram */}
      {renderHandlePill(
        "Telegram",
        <Send size={12} style={{ color: "#14B8A6", flexShrink: 0 }} />,
        telegramHandle, tgVal, setTgVal, editingTg, setEditingTg,
        "telegramHandle", v => `https://t.me/${v}`, "username", tgRef,
      )}

      {/* GitHub */}
      {renderHandlePill(
        "GitHub",
        <Github size={12} style={{ flexShrink: 0 }} />,
        githubHandle, ghVal, setGhVal, editingGh, setEditingGh,
        "githubHandle", v => `https://github.com/${v}`, "username", ghRef,
      )}

      {/* Discord */}
      {renderHandlePill(
        "Discord",
        <DiscordIcon size={12} />,
        discordHandle, discordVal, setDiscordVal, editingDiscord, setEditingDiscord,
        "discordHandle", v => `https://discord.com/users/${v}`, "username#0000", discordRef,
      )}

      {/* LinkedIn */}
      {renderHandlePill(
        "LinkedIn",
        <Linkedin size={12} style={{ flexShrink: 0 }} />,
        linkedinHandle, linkedinVal, setLinkedinVal, editingLinkedin, setEditingLinkedin,
        "linkedinHandle", v => `https://linkedin.com/in/${v}`, "username", linkedinRef,
      )}

      {/* Website */}
      {renderHandlePill(
        "Website",
        <Globe size={12} style={{ color: "#14B8A6", flexShrink: 0 }} />,
        website, webVal, setWebVal, editingWeb, setEditingWeb,
        "website", v => v.startsWith("http") ? v : `https://${v}`, "https://yoursite.com", webRef, true,
      )}

      {/* Website 2 — only show add button if website 1 exists */}
      {(website2 || (isOwnProfile && website)) && renderHandlePill(
        "Website",
        <Globe size={12} style={{ color: "#14B8A6", flexShrink: 0 }} />,
        website2, web2Val, setWeb2Val, editingWeb2, setEditingWeb2,
        "website2", v => v.startsWith("http") ? v : `https://${v}`, "https://another.com", web2Ref, true,
      )}

      {/* Website 3 — only show add button if website 2 exists */}
      {(website3 || (isOwnProfile && website2)) && renderHandlePill(
        "Website",
        <Globe size={12} style={{ color: "#14B8A6", flexShrink: 0 }} />,
        website3, web3Val, setWeb3Val, editingWeb3, setEditingWeb3,
        "website3", v => v.startsWith("http") ? v : `https://${v}`, "https://another.com", web3Ref, true,
      )}
    </div>
  );
}
