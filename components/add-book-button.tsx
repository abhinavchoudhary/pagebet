"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

import { BookSearch } from "@/components/book-search";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { addBook } from "@/lib/actions/books";
import { toast } from "@/lib/toast";
import type { BookResult } from "@/lib/books";

export function AddBookButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [needsPages, setNeedsPages] = useState<BookResult | null>(null);
  const [pagesInput, setPagesInput] = useState("");

  function save(book: BookResult, pageCount: number | null) {
    startTransition(async () => {
      await addBook({
        googleBooksId: book.id,
        title: book.title,
        authors: book.authors,
        coverUrl: book.coverUrl,
        pageCount,
      });
      setOpen(false);
      setNeedsPages(null);
      setPagesInput("");
      toast.success(`Added ${book.title}`);
      router.refresh();
    });
  }

  function handleSelect(book: BookResult) {
    if (book.pageCount && book.pageCount > 0) {
      save(book, book.pageCount);
    } else {
      setNeedsPages(book);
    }
  }

  return (
    <>
      <Button variant="tonal" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-[18px]" /> Add book
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-surface md-fade">
          <header
            className="flex items-center gap-2 px-2 pb-2"
            style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)" }}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => {
                setOpen(false);
                setNeedsPages(null);
              }}
              className="md-state-layer flex size-10 items-center justify-center rounded-corner-full text-on-surface"
            >
              <X className="size-6" />
            </button>
            <h2 className="md-title-large text-on-surface">
              {needsPages ? "How many pages?" : "Add a book"}
            </h2>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-2">
            {needsPages ? (
              <div className="flex flex-col gap-4">
                <div className="flex gap-3">
                  {needsPages.coverUrl ? (
                    <img
                      src={needsPages.coverUrl}
                      alt=""
                      className="h-24 rounded-corner-xs object-cover"
                      style={{ aspectRatio: "2 / 3" }}
                    />
                  ) : (
                    <div
                      className="h-24 rounded-corner-xs bg-primary-container"
                      style={{ aspectRatio: "2 / 3" }}
                    />
                  )}
                  <div>
                    <p className="md-title-small text-on-surface">
                      {needsPages.title}
                    </p>
                    <p className="md-body-small text-on-surface-variant">
                      {needsPages.authors.join(", ")}
                    </p>
                  </div>
                </div>
                <p className="md-body-medium text-on-surface-variant">
                  Google Books didn&apos;t have a page count for this edition.
                  Add it now so progress tracking works — or skip it.
                </p>
                <TextField
                  label="Total pages"
                  type="number"
                  inputMode="numeric"
                  autoFocus
                  value={pagesInput}
                  onChange={(e) => setPagesInput(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    disabled={pending}
                    onClick={() =>
                      save(needsPages, parseInt(pagesInput, 10) || null)
                    }
                  >
                    {pending ? "Adding…" : "Add book"}
                  </Button>
                  <Button
                    variant="text"
                    disabled={pending}
                    onClick={() => save(needsPages, null)}
                  >
                    Skip
                  </Button>
                </div>
              </div>
            ) : (
              <BookSearch onSelect={handleSelect} />
            )}
          </div>
        </div>
      )}
    </>
  );
}
