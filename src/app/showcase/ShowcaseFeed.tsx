"use client";

import { useState, useCallback } from "react";
import ShowcasePostCard from "./ShowcasePostCard";

export type ShowcasePost = {
  id: string;
  title: string;
  description: string | null;
  mediaUrl: string;
  mediaType: string;
  category: string;
  tags: string[];
  views: number;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    twitterHandle: string;
    image: string | null;
    userTitle: string | null;
  };
  likeCount: number;
  saveCount: number;
  liked: boolean;
  saved: boolean;
};

interface Props {
  initialPosts: ShowcasePost[];
  initialNextCursor: string | null;
  category: string;
  loggedIn: boolean;
}

export default function ShowcaseFeed({ initialPosts, initialNextCursor, category, loggedIn }: Props) {
  const [posts, setPosts] = useState<ShowcasePost[]>(initialPosts);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ cursor: nextCursor });
      if (category !== "all") params.set("category", category);
      const res = await fetch(`/api/showcase/posts?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setPosts((prev) => [...prev, ...(data.posts ?? [])]);
      setNextCursor(data.nextCursor ?? null);
    } finally {
      setLoading(false);
    }
  }, [nextCursor, loading, category]);

  const handleInteract = useCallback(
    async (postId: string, type: "like" | "save") => {
      if (!loggedIn) return;

      // Optimistic update
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const wasActive = type === "like" ? p.liked : p.saved;
          return {
            ...p,
            liked: type === "like" ? !p.liked : p.liked,
            saved: type === "save" ? !p.saved : p.saved,
            likeCount: type === "like" ? p.likeCount + (wasActive ? -1 : 1) : p.likeCount,
            saveCount: type === "save" ? p.saveCount + (wasActive ? -1 : 1) : p.saveCount,
          };
        })
      );

      const res = await fetch("/api/showcase/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, type }),
      }).catch(() => null);

      // Revert if request failed
      if (!res || !res.ok) {
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id !== postId) return p;
            const wasActive = type === "like" ? !p.liked : !p.saved;
            return {
              ...p,
              liked: type === "like" ? !p.liked : p.liked,
              saved: type === "save" ? !p.saved : p.saved,
              likeCount: type === "like" ? p.likeCount + (wasActive ? -1 : 1) : p.likeCount,
              saveCount: type === "save" ? p.saveCount + (wasActive ? -1 : 1) : p.saveCount,
            };
          })
        );
      }
    },
    [loggedIn]
  );

  if (posts.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "5rem 1rem",
          color: "var(--text-muted)",
          background: "var(--bg-secondary)",
          borderRadius: 16,
          border: "1px dashed var(--border)",
        }}
      >
        <p style={{ fontSize: "1.05rem", fontWeight: 500, color: "var(--text)" }}>No posts yet</p>
        <p style={{ marginTop: "0.4rem", fontSize: "0.875rem" }}>
          {loggedIn ? "Be the first to share your work." : "Sign in to post your work."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {posts.map((post) => (
          <ShowcasePostCard
            key={post.id}
            post={post}
            onInteract={handleInteract}
            loggedIn={loggedIn}
          />
        ))}
      </div>

      {nextCursor && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: "2.5rem" }}>
          <button
            onClick={loadMore}
            disabled={loading}
            style={{
              padding: "0.6rem 2.5rem",
              background: "transparent",
              border: "1px solid var(--border-md)",
              borderRadius: 8,
              color: "var(--text-muted)",
              fontSize: "0.875rem",
              cursor: loading ? "default" : "pointer",
              fontWeight: 500,
              opacity: loading ? 0.6 : 1,
              fontFamily: "inherit",
            }}
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </>
  );
}
