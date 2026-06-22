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
        <div className="flex-1">
          <p className="text-sm font-medium leading-tight" style={{ color: "var(--text-primary)" }}>{userName}</p>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
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

      {isOwn && showMenu && !editMode && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-[8px]" style={{ backgroundColor: "var(--bg-subtle)" }}>
          {confirmDelete ? (
            <>
              <span className="text-xs flex-1" style={{ color: "var(--text-secondary)" }}>Delete this log?</span>
              <button onClick={() => setConfirmDelete(false)} className="text-xs px-2 py-1 rounded-[6px]" style={{ color: "var(--text-muted)" }}>
                Cancel
              </button>
              <button onClick={handleDelete} className="text-xs px-3 py-1 rounded-[6px] font-medium" style={{ backgroundColor: "var(--penalty-bg)", color: "var(--penalty)" }}>
                Delete
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { setEditMode(true); setEditValue(String(pagesRead)); }}
                className="flex-1 text-xs py-1 text-center font-medium" style={{ color: "var(--app-accent)" }}>
                Edit pages
              </button>
              <div className="w-px h-3" style={{ backgroundColor: "var(--border-strong)" }} />
              <button onClick={handleDelete} className="flex-1 text-xs py-1 text-center font-medium" style={{ color: "var(--penalty)" }}>
                Delete
              </button>
              <div className="w-px h-3" style={{ backgroundColor: "var(--border-strong)" }} />
              <button onClick={() => setShowMenu(false)} className="text-xs px-1" style={{ color: "var(--text-muted)" }}>✕</button>
            </>
          )}
        </div>
      )}

      {editMode && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Pages read:</span>
          <input
            type="number"
            inputMode="numeric"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-20 text-center text-sm font-semibold outline-none rounded-[6px] px-2 py-1"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)" }}
            autoFocus
          />
          <button onClick={handleSaveEdit} className="text-xs px-3 py-1.5 rounded-[6px] font-medium text-white" style={{ backgroundColor: "var(--app-accent)" }}>
            Save
          </button>
          <button onClick={() => { setEditMode(false); setShowMenu(false); }} className="text-xs px-2 py-1" style={{ color: "var(--text-muted)" }}>✕</button>
        </div>
      )}

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
