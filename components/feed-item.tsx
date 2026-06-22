"use client";

import { useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { toggleReaction } from "@/lib/actions/reactions";

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
  userName,
  avatarUrl,
  bookTitle,
  bookCoverUrl,
  bookAuthor,
  pagesRead,
  loggedAt,
  reactions: initialReactions,
  myReaction: initialMyReaction,
}: FeedItemProps) {
  const [reactions, setReactions] = useState(initialReactions);
  const [myReaction, setMyReaction] = useState(initialMyReaction);
  const [, startTransition] = useTransition();

  function handleReaction(emoji: string) {
    const prev = myReaction;
    const next = prev === emoji ? null : emoji;

    setMyReaction(next);
    setReactions((r) => {
      const updated = { ...r };
      if (prev) updated[prev] = Math.max(0, (updated[prev] ?? 0) - 1);
      if (next) updated[next] = (updated[next] ?? 0) + 1;
      return updated;
    });

    startTransition(async () => {
      await toggleReaction(sessionId, emoji);
    });
  }

  return (
    <div className="rounded-[12px] p-4"
      style={{ backgroundColor: "var(--bg-card)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-default)" }}>
      <div className="flex items-center gap-2 mb-3">
        {avatarUrl ? (
          <img src={avatarUrl} alt={userName} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
            {userName[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-sm font-medium leading-tight" style={{ color: "var(--text-primary)" }}>{userName}</p>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {formatDistanceToNow(new Date(loggedAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      <div className="flex gap-3 items-start">
        {bookCoverUrl ? (
          <img src={bookCoverUrl} alt={bookTitle} className="w-12 rounded-[6px] object-cover" style={{ aspectRatio: "2/3" }} />
        ) : (
          <div className="w-12 flex items-center justify-center rounded-[6px]"
            style={{ aspectRatio: "2/3", backgroundColor: "var(--app-accent-light)" }}>
            <span className="text-lg">📖</span>
          </div>
        )}
        <div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            read <span className="font-semibold" style={{ color: "var(--app-accent)" }}>{pagesRead} pages</span> of
          </p>
          <p className="font-serif text-sm font-medium mt-0.5" style={{ color: "var(--text-primary)" }}>{bookTitle}</p>
          {bookAuthor && (
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>by {bookAuthor}</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-3">
        {REACTIONS.map((emoji) => (
          <button key={emoji} onClick={() => handleReaction(emoji)}
            className="flex items-center gap-1 text-sm px-2 py-1 rounded-full transition-colors"
            style={{
              backgroundColor: myReaction === emoji ? "var(--app-accent-light)" : "var(--bg-subtle)",
              border: myReaction === emoji ? "1px solid var(--app-accent)" : "1px solid transparent",
            }}>
            <span>{emoji}</span>
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{reactions[emoji] ?? 0}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
