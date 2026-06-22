"use client";

import { useState } from "react";
import { Drawer } from "vaul";
import { Search, ChevronRight, Check } from "lucide-react";
import { logSession, getLastCumulativePosition } from "@/lib/actions/sessions";
import { computePagesRead } from "@/lib/pages-credit";

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
  const [step, setStep] = useState<1 | 2 | 3>(1);
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
    if (!selectedBook || !value) { setPagesPreview(null); return; }
    const num = parseInt(value, 10);
    if (isNaN(num) || num <= 0) { setPagesPreview(null); return; }
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
        setStep(3);
        onSuccess?.();
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
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-[20px] outline-none max-w-lg mx-auto"
          style={{ backgroundColor: "var(--old-lace)", boxShadow: "var(--shadow-drawer)", maxHeight: "92dvh" }}
        >
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full" style={{ backgroundColor: "var(--border-default)" }} />

          {step === 1 && (
            <div className="flex flex-col flex-1 overflow-hidden px-5 py-4">
              <Drawer.Title
                className="font-serif font-semibold mb-4"
                style={{ fontSize: 21, color: "var(--espresso)" }}
              >
                What did you read?
              </Drawer.Title>
              <div
                className="flex items-center gap-2 rounded-[4px] px-3 py-2.5 mb-4"
                style={{ backgroundColor: "var(--cream)", border: "1px solid var(--border-default)" }}
              >
                <Search size={16} style={{ color: "var(--text-muted)" }} />
                <input
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-inter)" }}
                  placeholder="Search your library…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredBooks.length === 0 ? (
                  <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}>
                    No books found. Add one in Library.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {filteredBooks.map((book) => (
                      <button
                        key={book.id}
                        onClick={() => { setSelectedBook(book); setStep(2); }}
                        className="flex flex-col gap-2 p-3 rounded-[4px] text-left"
                        style={{ backgroundColor: "var(--cream)", border: "1px solid var(--border-default)" }}
                      >
                        {book.coverUrl ? (
                          <img src={book.coverUrl} alt={book.title} className="w-full aspect-[2/3] object-cover rounded-[2px]" />
                        ) : (
                          <div
                            className="w-full aspect-[2/3] rounded-[2px] flex items-center justify-center"
                            style={{ backgroundColor: "var(--espresso)" }}
                          />
                        )}
                        <div>
                          <p
                            className="text-xs font-medium leading-tight line-clamp-2"
                            style={{ color: "var(--text-primary)", fontFamily: "var(--font-inter)" }}
                          >
                            {book.title}
                          </p>
                          {book.authors?.[0] && (
                            <p
                              className="text-[11px] mt-0.5 line-clamp-1"
                              style={{ color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}
                            >
                              {book.authors[0]}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && selectedBook && (
            <div className="flex flex-col px-5 py-4 gap-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="text-sm"
                  style={{ color: "var(--sienna)", fontFamily: "var(--font-inter)" }}
                >
                  ← Back
                </button>
                <Drawer.Title
                  className="font-serif font-semibold"
                  style={{ fontSize: 21, color: "var(--espresso)" }}
                >
                  How far did you get?
                </Drawer.Title>
              </div>

              <div className="flex gap-2">
                {(["direct", "cumulative"] as LogMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => { setLogMode(mode); setPagesPreview(null); setInputValue(""); }}
                    className="flex-1 py-2 rounded-full text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: logMode === mode ? "var(--espresso)" : "var(--cream)",
                      color: logMode === mode ? "#fff" : "var(--text-secondary)",
                      border: `1px solid ${logMode === mode ? "transparent" : "var(--border-default)"}`,
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    {mode === "direct" ? "Pages I read" : "I'm on page"}
                  </button>
                ))}
              </div>

              <div className="flex flex-col items-center gap-3">
                <input
                  type="number"
                  inputMode="numeric"
                  className="text-center outline-none bg-transparent w-full"
                  style={{
                    fontSize: "48px",
                    fontFamily: "var(--font-newsreader)",
                    fontWeight: 600,
                    color: "var(--espresso)",
                    letterSpacing: "-0.03em",
                  }}
                  placeholder="0"
                  value={inputValue}
                  onChange={(e) => { setInputValue(e.target.value); computePreview(e.target.value); }}
                  autoFocus
                />
                {pagesPreview !== null && (
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}
                  >
                    That&apos;s{" "}
                    <span style={{ color: "var(--sienna)", fontWeight: 600 }}>
                      +{pagesPreview} pages
                    </span>{" "}
                    towards your goals
                  </p>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={!pagesPreview || pagesPreview <= 0 || submitting}
                className="w-full py-3.5 rounded-[4px] text-base font-semibold text-white disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ backgroundColor: "var(--sienna)", fontFamily: "var(--font-inter)" }}
              >
                <ChevronRight size={18} />
                {submitting ? "Logging…" : "Confirm"}
              </button>
            </div>
          )}

          {step === 3 && selectedBook && (
            <div className="flex flex-col px-5 py-4 gap-6 items-center">
              <Drawer.Title
                className="font-serif font-semibold self-start"
                style={{ fontSize: 21, color: "var(--espresso)" }}
              >
                Nicely done
              </Drawer.Title>
              <div
                className="flex items-center gap-4 w-full p-4 rounded-[4px]"
                style={{ backgroundColor: "var(--cream)", border: "1px solid var(--border-default)" }}
              >
                {selectedBook.coverUrl ? (
                  <img src={selectedBook.coverUrl} alt={selectedBook.title} className="w-12 rounded-[2px]" />
                ) : (
                  <div
                    className="w-12 rounded-[2px] shrink-0"
                    style={{ height: 64, backgroundColor: "var(--espresso)" }}
                  />
                )}
                <div>
                  <p
                    className="font-medium text-sm"
                    style={{ color: "var(--text-primary)", fontFamily: "var(--font-inter)" }}
                  >
                    {selectedBook.title}
                  </p>
                  <p
                    className="text-sm mt-0.5 font-semibold"
                    style={{ color: "var(--amber)", fontFamily: "var(--font-inter)" }}
                  >
                    +{pagesPreview} pages
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-full py-3.5 rounded-[4px] text-base font-semibold text-white flex items-center justify-center gap-2"
                style={{ backgroundColor: "var(--sienna)", fontFamily: "var(--font-inter)" }}
              >
                <Check size={18} /> Done
              </button>
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
