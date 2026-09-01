"use client";

import { useState } from "react";
import { Drawer } from "vaul";
import { ArrowLeft, ChevronRight } from "lucide-react";

import { logSession, getLastCumulativePosition } from "@/lib/actions/sessions";
import { computePagesRead } from "@/lib/pages-credit";
import { SegmentedButton } from "@/components/ui/segmented-button";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

type LogMode = "cumulative" | "direct";

interface Book {
  id: string;
  title: string;
  authors: string[] | null;
  coverUrl: string | null;
}

interface LogSessionDrawerProps {
  open: boolean;
  onClose: () => void;
  books: Book[];
  onSuccess?: () => void;
}

export function LogSessionDrawer({
  open,
  onClose,
  books,
  onSuccess,
}: LogSessionDrawerProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [logMode, setLogMode] = useState<LogMode>("direct");
  const [inputValue, setInputValue] = useState("");
  const [pagesPreview, setPagesPreview] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.authors ?? []).some((a) =>
        a.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  async function computePreview(value: string) {
    if (!selectedBook || !value) {
      setPagesPreview(null);
      return;
    }
    const num = parseInt(value, 10);
    if (isNaN(num) || num <= 0) {
      setPagesPreview(null);
      return;
    }
    if (logMode === "direct") {
      setPagesPreview(num);
    } else {
      const lastPos = await getLastCumulativePosition(selectedBook.id);
      setPagesPreview(computePagesRead("cumulative", num, lastPos));
    }
  }

  async function handleSubmit() {
    if (!selectedBook || !pagesPreview || pagesPreview <= 0 || !inputValue) return;
    setSubmitting(true);
    try {
      const result = await logSession({
        bookId: selectedBook.id,
        logMode,
        inputValue: parseInt(inputValue, 10),
      });
      if (result.success) {
        toast.success(
          `+${result.pagesRead ?? pagesPreview} pages · ${selectedBook.title}`
        );
        handleClose();
        onSuccess?.();
      } else {
        toast.error("That didn't add any new pages");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStep(1);
    setSelectedBook(null);
    setLogMode("direct");
    setInputValue("");
    setPagesPreview(null);
    setSearchQuery("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Drawer.Root open={open} onOpenChange={(o) => !o && handleClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" />
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-lg flex-col rounded-t-[28px] bg-surface-container-low text-on-surface outline-none md-elevation-3"
          style={{ maxHeight: "92dvh" }}
        >
          <div className="mx-auto mt-3 h-1 w-8 rounded-corner-full bg-on-surface-variant/40" />

          {step === 1 && (
            <div className="flex flex-1 flex-col overflow-hidden px-5 py-4">
              <Drawer.Title className="mb-4 md-headline-small text-on-surface">
                What did you read?
              </Drawer.Title>
              <input
                className="mb-2 h-12 w-full rounded-corner-full bg-surface-container-high px-4 md-body-large text-on-surface outline-none placeholder:text-on-surface-variant"
                placeholder="Search your library"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="-mx-5 flex-1 overflow-y-auto px-5">
                {filteredBooks.length === 0 ? (
                  <p className="py-8 text-center md-body-medium text-on-surface-variant">
                    No books found. Add one in Library.
                  </p>
                ) : (
                  filteredBooks.map((book) => (
                    <button
                      key={book.id}
                      onClick={() => {
                        setSelectedBook(book);
                        setStep(2);
                      }}
                      className="md-state-layer flex w-full items-center gap-3 rounded-corner-md py-3 pl-2 pr-3 text-left"
                    >
                      {book.coverUrl ? (
                        <img
                          src={book.coverUrl}
                          alt=""
                          className="z-[1] w-9 shrink-0 rounded-corner-xs object-cover"
                          style={{ aspectRatio: "2 / 3" }}
                        />
                      ) : (
                        <div
                          className="z-[1] w-9 shrink-0 rounded-corner-xs bg-primary-container"
                          style={{ aspectRatio: "2 / 3" }}
                        />
                      )}
                      <div className="z-[1] min-w-0 flex-1">
                        <p className="line-clamp-2 md-body-large leading-tight text-on-surface">
                          {book.title}
                        </p>
                        {book.authors?.[0] && (
                          <p className="line-clamp-1 md-body-small text-on-surface-variant">
                            {book.authors[0]}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="z-[1] size-5 shrink-0 text-on-surface-variant" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {step === 2 && selectedBook && (
            <div className="flex flex-col gap-6 px-5 py-4 md-blur-in">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep(1)}
                  aria-label="Back"
                  className="md-state-layer -ml-2 flex size-10 items-center justify-center rounded-corner-full text-on-surface"
                >
                  <ArrowLeft className="size-6" />
                </button>
                <Drawer.Title className="md-headline-small text-on-surface">
                  How far did you get?
                </Drawer.Title>
              </div>

              <SegmentedButton<LogMode>
                value={logMode}
                onChange={(m) => {
                  setLogMode(m);
                  setPagesPreview(null);
                  setInputValue("");
                }}
                options={[
                  { value: "direct", label: "Pages I read" },
                  { value: "cumulative", label: "I'm on page" },
                ]}
              />

              <div className="flex flex-col items-center gap-3">
                <input
                  type="number"
                  inputMode="numeric"
                  className="w-full bg-transparent text-center md-display-medium text-on-surface outline-none"
                  placeholder="0"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    computePreview(e.target.value);
                  }}
                  autoFocus
                />
                {pagesPreview !== null && (
                  <p className="md-body-medium text-on-surface-variant">
                    That&apos;s{" "}
                    <span className="font-semibold text-primary">
                      +{pagesPreview} pages
                    </span>{" "}
                    towards your goals
                  </p>
                )}
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!pagesPreview || pagesPreview <= 0 || submitting}
                className="w-full"
                size="lg"
              >
                {submitting ? "Logging…" : "Log it"}
              </Button>
            </div>
          )}

          <div
            style={{ height: "env(safe-area-inset-bottom, 0px)" }}
            aria-hidden
          />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
