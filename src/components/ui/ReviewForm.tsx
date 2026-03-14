"use client";

import { useState } from "react";
import { submitReview } from "@/actions/reviews";

interface Props {
  orderId: string;
  revieweeId: string;
  revieweeName: string;
}

export default function ReviewForm({ orderId, revieweeId, revieweeName }: Props) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (done) {
    return (
      <div style={{ padding: "0.9rem 1.25rem", borderRadius: 12, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", fontSize: "0.78rem", color: "#15803d", fontWeight: 600 }}>
        Review submitted — thanks for your feedback!
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError("Please select a rating"); return; }
    setSubmitting(true);
    setError("");
    try {
      await submitReview(orderId, revieweeId, rating, body);
      setDone(true);
    } catch (err: any) {
      setError(err.message ?? "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#0f172a" }}>
        Rate your experience with {revieweeName}
      </div>

      {/* Star picker */}
      <div style={{ display: "flex", gap: 4 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            style={{
              background: "none", border: "none", cursor: "pointer", padding: 2,
              fontSize: "1.6rem", lineHeight: 1,
              color: star <= (hovered || rating) ? "#f59e0b" : "#e2e8f0",
              transition: "color 0.1s",
            }}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Leave a comment (optional)"
        maxLength={500}
        rows={3}
        style={{
          width: "100%", padding: "0.65rem 0.85rem", borderRadius: 10,
          border: "1px solid rgba(0,0,0,0.12)", fontSize: "0.78rem",
          fontFamily: "Outfit, sans-serif", resize: "vertical",
          outline: "none", boxSizing: "border-box",
        }}
      />

      {error && <div style={{ fontSize: "0.7rem", color: "#ef4444" }}>{error}</div>}

      <button
        type="submit"
        disabled={submitting || rating === 0}
        className="btn-primary"
        style={{ fontSize: "0.78rem", padding: "0.6rem 1.4rem", cursor: rating === 0 ? "not-allowed" : "pointer", opacity: rating === 0 ? 0.5 : 1, alignSelf: "flex-start" }}
      >
        {submitting ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  );
}
