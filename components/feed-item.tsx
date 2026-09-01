"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal } from "lucide-react";

import { toggleReaction } from "@/lib/actions/reactions";
import {
  deleteSession,
  editSessionPages,
  restoreSession,
} from "@/lib/actions/sessions";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { LinearProgress } from "@/components/ui/linear-progress";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import { bookProgress } from "@/lib/book-progress";
import { toast } from "@/lib/toast";

const REACTIONS = [
  { key: "👏", label: "Clap" },
  { key: "🔥", label: "Fire" },
  { key: "📚", label: "Read" },
] as const;

interface FeedItemProps {
  sessionId: string;
  userId: string;
  userName: string;
  avatarUrl: string | null;
  bookTitle: string;
  bookCoverUrl: string | null;
  bookAuthor: string | null;
  bookCurrentPage?: number | null;
  bookTotalPages?: number | null;
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
  bookCurrentPage,
  bookTotalPages,
  pagesRead: initialPagesRead,
  loggedAt,
  reactions: initialReactions,
  myReaction: initialMyReaction,
  currentUserId,
}: FeedItemProps) {
  const [reactions, setReactions] = useState(initialReactions);
  const [myReaction, setMyReaction] = useState<string | null>(initialMyReaction);
  const [pagesRead, setPagesRead] = useState(initialPagesRead);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editValue, setEditValue] = useState(String(initialPagesRead));
  const [deleted, setDeleted] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const isOwn = userId === currentUserId;
  const progress = bookProgress({
    currentPage: bookCurrentPage,
    totalPages: bookTotalPages,
  });

  function handleReaction(key: string) {
    const prev = myReaction;
    const next = prev === key ? null : key;
    setMyReaction(next);
    setReactions((r) => {
      const updated = { ...r };
      if (prev) updated[prev] = Math.max(0, (updated[prev] ?? 0) - 1);
      if (next) updated[next] = (updated[next] ?? 0) + 1;
      return updated;
    });
    startTransition(async () => {
      await toggleReaction(sessionId, key);
    });
  }

  function handleDelete() {
    setMenuOpen(false);
    setDeleted(true);
    startTransition(async () => {
      const snap = await deleteSession(sessionId);
      router.refresh();
      if (snap) {
        toast.undo("Reading log deleted", () => {
          startTransition(async () => {
            await restoreSession(snap);
            setDeleted(false);
            router.refresh();
          });
        });
      }
    });
  }

  function handleSaveEdit() {
    const pages = parseInt(editValue, 10);
    if (!pages || pages <= 0) return;
    startTransition(async () => {
      await editSessionPages(sessionId, pages);
      setPagesRead(pages);
      setEditMode(false);
      setMenuOpen(false);
      toast.success("Updated");
      router.refresh();
    });
  }

  if (deleted) return null;

  return (
    <Card variant="elevated" className="p-4">
      <div className="mb-3 flex items-center gap-2.5">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={userName}
            className="size-9 shrink-0 rounded-corner-full object-cover"
          />
        ) : (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-corner-full bg-primary-container md-title-small text-on-primary-container">
            {userName[0]?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="md-title-small text-on-surface">{userName}</p>
          <p className="md-body-small text-on-surface-variant">
            {formatDistanceToNow(new Date(loggedAt), { addSuffix: true })}
          </p>
        </div>
        {isOwn && !editMode && (
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Options"
            className="md-state-layer flex size-9 items-center justify-center rounded-corner-full text-on-surface-variant"
          >
            <MoreHorizontal className="z-[1] size-5" />
          </button>
        )}
      </div>

      {isOwn && menuOpen && !editMode && (
        <div className="mb-3 flex gap-2 md-enter">
          <Button
            variant="tonal"
            size="sm"
            onClick={() => {
              setEditMode(true);
              setEditValue(String(pagesRead));
            }}
          >
            Edit pages
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      )}

      {editMode && (
        <div className="mb-3 flex items-end gap-2">
          <TextField
            label="Pages read"
            type="number"
            inputMode="numeric"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            containerClassName="flex-1"
            autoFocus
          />
          <Button size="sm" onClick={handleSaveEdit}>
            Save
          </Button>
          <Button
            variant="text"
            size="sm"
            onClick={() => {
              setEditMode(false);
              setMenuOpen(false);
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      <div className="flex gap-3 rounded-corner-md bg-surface-container p-3">
        {bookCoverUrl ? (
          <img
            src={bookCoverUrl}
            alt=""
            className="h-[42px] w-[30px] shrink-0 rounded-corner-xs object-cover"
          />
        ) : (
          <div className="h-[42px] w-[30px] shrink-0 rounded-corner-xs bg-primary-container" />
        )}
        <div className="min-w-0 flex-1">
          <p className="md-body-medium text-on-surface-variant">
            Read{" "}
            <span className="font-semibold text-on-surface">
              {pagesRead} pages
            </span>
          </p>
          <p className="mt-0.5 line-clamp-1 md-title-small text-on-surface">
            {bookTitle}
          </p>
          {bookAuthor && (
            <p className="md-body-small text-on-surface-variant">{bookAuthor}</p>
          )}
          {!progress.unknownTotal && progress.pct > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <LinearProgress
                value={progress.fraction}
                thickness={3}
                className="max-w-[120px]"
              />
              <span className="md-label-small text-on-surface-variant">
                {progress.pct}%
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        {REACTIONS.map(({ key, label }) => (
          <Chip
            key={key}
            selected={myReaction === key}
            onClick={() => handleReaction(key)}
          >
            <span>{label}</span>
            {(reactions[key] ?? 0) > 0 && (
              <span className="opacity-70">{reactions[key]}</span>
            )}
          </Chip>
        ))}
      </div>
    </Card>
  );
}
