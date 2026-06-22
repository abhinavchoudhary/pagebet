"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { toggleReaction } from "@/lib/actions/reactions";
import { deleteSession, editSessionPages } from "@/lib/actions/sessions";

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
  pagesRead: initialPagesRead,
  loggedAt,
  reactions: initialReactions,
  myReaction: initialMyReaction,
  currentUserId,
}: FeedItemProps) {
  const [reactions, setReactions] = useState(initialReactions);
  const [myReaction, setMyReaction] = useState(initialMyReaction);
  const [pagesRead, setPagesRead] = useState(initialPagesRead);
  const [showMenu, setShowMenu] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editValue, setEditValue] = useState(String(initialPagesRead));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const isOwn = userId === currentUserId;

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
    startTransition(async () => { await toggleReaction(sessionId, emoji); });
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    startTransition(async () => {
      await deleteSession(sessionId);
      setDeleted(true);
      router.refresh();
    });
  }

  function handleSaveEdit() {
    const pages = parseInt(editValue, 10);
    if (!pages || pages <= 0) return;
    startTransition(async () => {
      await editSessionPages(sessionId, pages);
      setPagesRead(pages);
      setEditMode(false);
      setShowMenu(false);
      router.refresh();
    });
  }

  if (deleted) return null;

  return (
    <div
      className="rounded-[4px] p-4"
      style={{
        backgroundColor: "var(--cream)",
        boxShadow: "var(--shadow-card)",
        border: "1px solid var(--border-default)",
      }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2.5 mb-3">
        {avatarUrl ? (
          <img src={avatarUrl} alt={userName} className="w-9 h-9 rounded-full object-cover shrink-0" />
        ) : (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
            style={{ backgroundColor: "#e4d8c4", color: "var(--text-muted)" }}
          >
            {userName[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold leading-tight"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-inter)" }}
          >
            {userName}
          </p>
          <p
            className="text-[11px]"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}
          >
            {formatDistanceToNow(new Date(loggedAt), { addSuffix: true })}
          </p>
        </div>
        {isOwn && !editMode && (
          <button
            onClick={() => { setShowMenu(!showMenu); setConfirmDelete(false); }}
            className="w-7 h-7 flex items-center justify-center rounded-full text-base leading-none"
            style={{ color: "var(--text-muted)", backgroundColor: showMenu ? "var(--bg-subtle)" : "transparent" }}
          >
            ···
          </button>
        )}
      </div>

      {/* Owner actions menu */}
      {isOwn && showMenu && !editMode && (
        <div
          className="flex items-center gap-2 mb-3 px-3 py-2 rounded-[4px]"
          style={{ backgroundColor: "var(--bg-subtle)" }}
        >
          {confirmDelete ? (
            <>
              <span className="text-xs flex-1" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-inter)" }}>
                Delete this log?
              </span>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs px-2 py-1 rounded-[4px]"
                style={{ color: "var(--text-muted)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="text-xs px-3 py-1 rounded-[4px] font-medium"
                style={{ backgroundColor: "var(--penalty-bg)", color: "var(--penalty)" }}
              >
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setEditMode(true); setEditValue(String(pagesRead)); }}
                className="flex-1 text-xs py-1 text-center font-medium"
                style={{ color: "var(--sienna)" }}
              >
                Edit pages
              </button>
              <div className="w-px h-3" style={{ backgroundColor: "var(--border-strong)" }} />
              <button
                onClick={handleDelete}
                className="flex-1 text-xs py-1 text-center font-medium"
                style={{ color: "var(--penalty)" }}
              >
                Delete
              </button>
              <div className="w-px h-3" style={{ backgroundColor: "var(--border-strong)" }} />
              <button onClick={() => setShowMenu(false)} className="text-xs px-1" style={{ color: "var(--text-muted)" }}>✕</button>
            </>
          )}
        </div>
      )}

      {/* Edit mode */}
      {editMode && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-inter)" }}>
            Pages read:
          </span>
          <input
            type="number"
            inputMode="numeric"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-20 text-center text-sm font-semibold outline-none rounded-[4px] px-2 py-1"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)" }}
            autoFocus
          />
          <button
            onClick={handleSaveEdit}
            className="text-xs px-3 py-1.5 rounded-[4px] font-medium text-white"
            style={{ backgroundColor: "var(--sienna)" }}
          >
            Save
          </button>
          <button
            onClick={() => { setEditMode(false); setShowMenu(false); }}
            className="text-xs px-2 py-1"
            style={{ color: "var(--text-muted)" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Book chip */}
      <div
        className="flex gap-3 items-start rounded-[4px] p-3"
        style={{ backgroundColor: "var(--bg-subtle)" }}
      >
        {bookCoverUrl ? (
          <img
            src={bookCoverUrl}
            alt={bookTitle}
            className="rounded-[2px] object-cover shrink-0"
            style={{ width: 30, height: 42 }}
          />
        ) : (
          <div
            className="rounded-[2px] shrink-0"
            style={{ width: 30, height: 42, backgroundColor: "var(--espresso)" }}
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-inter)" }}>
            Read{" "}
            <span className="font-semibold" style={{ color: "var(--espresso)" }}>
              {pagesRead} pages
            </span>
          </p>
          <p className="font-serif text-sm font-semibold mt-0.5 leading-snug" style={{ color: "var(--espresso)" }}>
            {bookTitle}
          </p>
          {bookAuthor && (
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}>
              {bookAuthor}
            </p>
          )}
          {/* Mini progress bar */}
          <div
            className="mt-2 rounded-full overflow-hidden"
            style={{ height: 3, width: 120, backgroundColor: "#dfd0b8" }}
          >
            <div
              style={{
                height: "100%",
                width: "40%",
                backgroundColor: "#c8913a",
                borderRadius: "inherit",
              }}
            />
          </div>
        </div>
      </div>

      {/* Reactions */}
      <div className="flex gap-2 mt-3">
        {REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleReaction(emoji)}
            className="flex items-center gap-1 text-sm px-2.5 py-1 rounded-full transition-colors"
            style={{
              backgroundColor: myReaction === emoji ? "var(--app-accent-light)" : "transparent",
              border: `1px solid ${myReaction === emoji ? "var(--amber)" : "var(--border-default)"}`,
            }}
          >
            <span>{emoji}</span>
            <span
              className="text-[11px]"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}
            >
              {reactions[emoji] ?? 0}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
