"use client";

import Link from "next/link";
import { Heart, Bookmark, Eye, Play } from "lucide-react";
import type { ShowcasePost } from "./ShowcaseFeed";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

const CATEGORY_COLORS: Record<string, string> = {
  Design: "#8b5cf6",
  Development: "#3b82f6",
  Marketing: "#14b8a6",
  Creative: "#f59e0b",
  Content: "#ec4899",
  Other: "#64748b",
};

interface Props {
  post: ShowcasePost;
  onInteract: (postId: string, type: "like" | "save") => void;
  loggedIn: boolean;
}

export default function ShowcasePostCard({ post, onInteract, loggedIn }: Props) {
  const categoryColor = CATEGORY_COLORS[post.category] ?? "#64748b";
  const isVideo = post.mediaType === "video";
  const initials = (post.user.name ?? post.user.twitterHandle).slice(0, 2).toUpperCase();

  return (
    <div
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.15s, transform 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.1)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
        (e.currentTarget as HTMLElement).style.transform = "none";
      }}
    >
      {/* Media */}
      <div style={{ position: "relative", width: "100%", paddingTop: "62.5%", background: "var(--bg-secondary)", flexShrink: 0 }}>
        {isVideo ? (
          <>
            <video
              src={post.mediaUrl}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              muted
              loop
              playsInline
              preload="metadata"
              onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
              onMouseLeave={(e) => (e.currentTarget as HTMLVideoElement).pause()}
            />
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <Play size={16} color="#fff" fill="#fff" />
            </div>
          </>
        ) : (
          <img
            src={post.mediaUrl}
            alt={post.title}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}

        {/* Category badge */}
        <span
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            background: categoryColor,
            color: "#fff",
            fontSize: "0.7rem",
            fontWeight: 600,
            padding: "0.2rem 0.55rem",
            borderRadius: 999,
            letterSpacing: "0.02em",
          }}
        >
          {post.category}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: "0.875rem 1rem", display: "flex", flexDirection: "column", gap: "0.625rem", flex: 1 }}>
        {/* Creator */}
        <Link
          href={`/u/${post.user.twitterHandle}`}
          style={{ display: "flex", alignItems: "center", gap: "0.6rem", textDecoration: "none" }}
        >
          {post.user.image ? (
            <img
              src={post.user.image}
              alt={post.user.name ?? ""}
              style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--teal)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.6rem",
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {post.user.name ?? `@${post.user.twitterHandle}`}
            </div>
            {post.user.role && (
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {post.user.role}
              </div>
            )}
          </div>
        </Link>

        {/* Title */}
        <p
          style={{
            margin: 0,
            fontSize: "0.9rem",
            fontWeight: 600,
            color: "var(--text)",
            lineHeight: 1.35,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {post.title}
        </p>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-muted)",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  padding: "0.15rem 0.5rem",
                  borderRadius: 999,
                }}
              >
                {tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span style={{ fontSize: "0.7rem", color: "var(--text-hint)" }}>+{post.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Actions row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.875rem",
            marginTop: "auto",
            paddingTop: "0.4rem",
            borderTop: "1px solid var(--border)",
          }}
        >
          <button
            onClick={() => onInteract(post.id, "like")}
            disabled={!loggedIn}
            title={loggedIn ? "Like" : "Sign in to like"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              background: "none",
              border: "none",
              cursor: loggedIn ? "pointer" : "default",
              padding: 0,
              color: post.liked ? "#ef4444" : "var(--text-muted)",
              fontSize: "0.8rem",
              fontFamily: "inherit",
              fontWeight: 500,
              transition: "color 0.15s",
            }}
          >
            <Heart size={15} fill={post.liked ? "#ef4444" : "none"} />
            {post.likeCount > 0 && fmt(post.likeCount)}
          </button>

          <button
            onClick={() => onInteract(post.id, "save")}
            disabled={!loggedIn}
            title={loggedIn ? "Save" : "Sign in to save"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              background: "none",
              border: "none",
              cursor: loggedIn ? "pointer" : "default",
              padding: 0,
              color: post.saved ? "var(--teal)" : "var(--text-muted)",
              fontSize: "0.8rem",
              fontFamily: "inherit",
              fontWeight: 500,
              transition: "color 0.15s",
            }}
          >
            <Bookmark size={15} fill={post.saved ? "var(--teal)" : "none"} />
            {post.saveCount > 0 && fmt(post.saveCount)}
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              color: "var(--text-hint)",
              fontSize: "0.8rem",
            }}
          >
            <Eye size={14} />
            {post.views > 0 ? fmt(post.views) : "0"}
          </div>

          <span style={{ marginLeft: "auto", fontSize: "0.725rem", color: "var(--text-hint)" }}>
            {timeAgo(post.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
