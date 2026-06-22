"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/lib/supabase/client";

const REACTIONS = ["👏", "🔥", "📚"] as const;

interface FeedItemProps {
  sessionId: string;
  userId: string;
  userName: string;
  avatarUrl: string | null;
  bookTitle: string;
  bookCoverUrl: string | null;
  bookAuthor: string | null;
  pagesRead: number;
  loggedAt: string;
  reactions: Record<string, number>;
  myReaction: string | null;
  currentUserId: string;
}

export function FeedItem({
  sessionId,
  userId,
  userName,
  avatarUrl,
  bookTitle,
  bookCoverUrl,
  bookAuthor,
  pagesRead,
  loggedAt,
  reactions: initialReactions,
  myReaction: initialMyReaction,
  currentUserId,
}: FeedItemProps) {
  const [reactions, setReactions] = useState(initialReactions);
  const [myReaction, setMyReaction] = useState(initialMyReaction);
  const supabase = createClient();

  async function handleReaction(emoji: string) {
    const prev = myReaction;

    if (prev === emoji) {
      setMyReaction(null);
      setReactions((r) => ({ ...r, [emoji]: Math.max(0, (r[emoji] ?? 0) - 1) }));
      await supabase
        .from("feed_reactions")
        .delete()
        .eq("session_id", sessionId)
        .eq("user_id", currentUserId);
    } else {
      if (prev) {
        setReactions((r) => ({ ...r, [prev]: Math.max(0, (r[prev] ?? 0) - 1) }));
      }
      setMyReaction(emoji);
      setReactions((r) => ({ ...r, [emoji]: (r[emoji] ?? 0) + 1 }));

      if (prev) {
        await supabase
          .from("feed_reactions")
          .update({ emoji })
          .eq("session_id", sessionId)
          .eq("user_id", currentUserId);
      } else {
        await supabase
          .from("feed_reactions")
          .insert({ session_id: sessionId, user_id: currentUserId, emoji });
      }
    }
  }

  return (
    <div
      className="rounded-[12px] p-4"
      style={{
        backgroundColor: "var(--bg-card)",
        boxShadow: "var(--shadow-card)",
        border: "1px solid var(--border-default)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        {avatarUrl ? (
          <img src={avatarUrl} alt={userName} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}
          >
            {userName[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-sm font-medium leading-tight" style={{ color: "var(--text-primary)" }}>
            {userName}
          </p>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {formatDistanceToNow(new Date(loggedAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      <div className="flex gap-3 items-start">
        {bookCoverUrl ? (
          <img
            src={bookCoverUrl}
            alt={bookTitle}
            className="w-12 rounded-[6px] object-cover"
            style={{ aspectRatio: "2/3" }}
          />
        ) : (
          <div
            className="w-12 flex items-center justify-center rounded-[6px]"
            style={{
              aspectRatio: "2/3",
              backgroundColor: "var(--app-accent-light)",
            }}
          >
            <span className="text-lg">📖</span>
          </div>
        )}
        <div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            read <span className="font-semibold" style={{ color: "var(--app-accent)" }}>{pagesRead} pages</span> of
          </p>
          <p className="font-serif text-sm font-medium mt-0.5" style={{ color: "var(--text-primary)" }}>
            {bookTitle}
          </p>
          {bookAuthor && (
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
              by {bookAuthor}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-3">
        {REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleReaction(emoji)}
            className="flex items-center gap-1 text-sm px-2 py-1 rounded-full transition-colors"
            style={{
              backgroundColor: myReaction === emoji ? "var(--app-accent-light)" : "var(--bg-subtle)",
              border: myReaction === emoji ? "1px solid var(--app-accent)" : "1px solid transparent",
            }}
          >
            <span>{emoji}</span>
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              {reactions[emoji] ?? 0}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
