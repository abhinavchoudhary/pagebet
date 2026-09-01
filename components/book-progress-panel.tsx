"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CircularProgress } from "@/components/ui/circular-progress";
import { TextField } from "@/components/ui/text-field";
import { bookProgress } from "@/lib/book-progress";
import {
  markBookFinished,
  updateBookProgress,
  updateBookTotalPages,
} from "@/lib/actions/books";
import { toast } from "@/lib/toast";

interface Props {
  bookId: string;
  title: string;
  currentPage: number;
  totalPages: number | null;
  finished: boolean;
}

export function BookProgressPanel({
  bookId,
  title,
  currentPage,
  totalPages,
  finished,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [page, setPage] = useState(currentPage);
  const [editingTotal, setEditingTotal] = useState(false);
  const [totalDraft, setTotalDraft] = useState(String(totalPages ?? ""));

  const progress = bookProgress({ currentPage: page, totalPages, finished });
  const dirty = page !== currentPage;

  function commitPage(next: number) {
    const clamped = Math.max(
      0,
      totalPages ? Math.min(next, totalPages) : next
    );
    setPage(clamped);
  }

  function savePage() {
    startTransition(async () => {
      await updateBookProgress(bookId, page);
      toast.success(
        progress.state === "finished"
          ? `Finished ${title} 🎉`
          : `Progress updated — page ${page}`
      );
      router.refresh();
    });
  }

  function saveTotal() {
    const n = parseInt(totalDraft, 10);
    if (!n || n <= 0) return;
    startTransition(async () => {
      await updateBookTotalPages(bookId, n);
      setEditingTotal(false);
      toast.success(`Total pages set to ${n}`);
      router.refresh();
    });
  }

  function toggleFinished() {
    startTransition(async () => {
      await markBookFinished(bookId, !finished);
      toast.success(finished ? "Moved back to Reading" : `Finished ${title} 🎉`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <CircularProgress value={progress.fraction} size={168} thickness={12}>
        <span className="md-display-small font-serif text-on-surface">
          {progress.unknownTotal ? "—" : `${progress.pct}%`}
        </span>
        <span className="md-body-small text-on-surface-variant">
          {totalPages ? `page ${progress.currentPage} of ${totalPages}` : `page ${page}`}
        </span>
      </CircularProgress>

      {progress.pagesLeft != null && progress.pagesLeft > 0 && (
        <p className="md-body-medium text-on-surface-variant">
          {progress.pagesLeft} pages left
        </p>
      )}

      {/* Stepper */}
      <div className="flex w-full items-center justify-center gap-2">
        <Button
          variant="tonal"
          size="icon"
          aria-label="Back 10 pages"
          disabled={pending}
          onClick={() => commitPage(page - 10)}
        >
          <span className="md-label-medium">−10</span>
        </Button>
        <Button
          variant="tonal"
          size="icon"
          aria-label="Back one page"
          disabled={pending}
          onClick={() => commitPage(page - 1)}
        >
          <Minus className="size-5" />
        </Button>
        <input
          type="number"
          inputMode="numeric"
          aria-label="Current page"
          value={page}
          disabled={pending}
          onChange={(e) => commitPage(parseInt(e.target.value, 10) || 0)}
          className="h-12 w-20 rounded-corner-sm bg-surface-container-highest text-center md-title-large text-on-surface outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        />
        <Button
          variant="tonal"
          size="icon"
          aria-label="Forward one page"
          disabled={pending}
          onClick={() => commitPage(page + 1)}
        >
          <Plus className="size-5" />
        </Button>
        <Button
          variant="tonal"
          size="icon"
          aria-label="Forward 10 pages"
          disabled={pending}
          onClick={() => commitPage(page + 10)}
        >
          <span className="md-label-medium">+10</span>
        </Button>
      </div>

      {dirty && (
        <Button className="md-enter" disabled={pending} onClick={savePage}>
          <Check className="size-5" /> Save progress
        </Button>
      )}

      {/* Total pages */}
      {editingTotal ? (
        <div className="flex w-full items-end gap-2">
          <TextField
            label="Total pages"
            type="number"
            inputMode="numeric"
            value={totalDraft}
            onChange={(e) => setTotalDraft(e.target.value)}
            containerClassName="flex-1"
          />
          <Button variant="text" disabled={pending} onClick={saveTotal}>
            Save
          </Button>
          <Button
            variant="text"
            disabled={pending}
            onClick={() => {
              setEditingTotal(false);
              setTotalDraft(String(totalPages ?? ""));
            }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <button
          type="button"
          className="md-state-layer rounded-corner-full px-3 py-1 md-label-large text-primary"
          onClick={() => setEditingTotal(true)}
        >
          {totalPages ? "Edit total pages" : "Set total pages"}
        </button>
      )}

      <Button
        variant={finished ? "outlined" : "filled-tertiary"}
        disabled={pending}
        onClick={toggleFinished}
        className="w-full"
      >
        {finished ? (
          <>
            <RotateCcw className="size-5" /> Reading again
          </>
        ) : (
          <>
            <Check className="size-5" /> Mark finished
          </>
        )}
      </Button>
    </div>
  );
}
