"use client";

import { useState } from "react";
import { Drawer } from "vaul";
import { Search, ChevronRight, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { computePagesRead } from "@/lib/pages-credit";
import { weekStartDateString } from "@/lib/rolling-week";
import type { Database } from "@/lib/supabase/types";

type Book = Database["public"]["Tables"]["books"]["Row"];
type LogMode = "cumulative" | "direct";

interface LogSessionDrawerProps {
  open: boolean;
  onClose: () => void;
  books: Book[];
  challenges: Array<{
    id: string;
    name: string;
    joined_at: string;
  }>;
  userId: string;
  onSuccess?: () => void;
}

export function LogSessionDrawer({
  open,
  onClose,
  books,
  challenges,
  userId,
  onSuccess,
}: LogSessionDrawerProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [logMode, setLogMode] = useState<LogMode>("direct");
  const [inputValue, setInputValue] = useState("");
  const [pagesPreview, setPagesPreview] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

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
      const { data } = await supabase
        .from("reading_sessions")
        .select("page_position")
        .eq("user_id", userId)
        .eq("book_id", selectedBook.id)
        .eq("log_mode", "cumulative")
        .not("page_position", "is", null)
        .order("logged_at", { ascending: false })
        .limit(1);

      const lastPos = data?.[0]?.page_position ?? null;
      setPagesPreview(computePagesRead("cumulative", num, lastPos));
    }
  }

  async function handleSubmit() {
    if (!selectedBook || !pagesPreview || pagesPreview <= 0) return;
    setSubmitting(true);

    try {
      const num = parseInt(inputValue, 10);
      let lastPos: number | null = null;

      if (logMode === "cumulative") {
        const { data } = await supabase
          .from("reading_sessions")
          .select("page_position")
          .eq("user_id", userId)
          .eq("book_id", selectedBook.id)
          .eq("log_mode", "cumulative")
          .not("page_position", "is", null)
          .order("logged_at", { ascending: false })
          .limit(1);
        lastPos = data?.[0]?.page_position ?? null;
      }

      const pages = computePagesRead(logMode, num, lastPos);
      if (pages <= 0) {
        setSubmitting(false);
        return;
      }

      const { data: session, error } = await supabase
        .from("reading_sessions")
        .insert({
          user_id: userId,
          book_id: selectedBook.id,
          log_mode: logMode,
          page_position: logMode === "cumulative" ? num : null,
          pages_read: pages,
        })
        .select("id")
        .single();

      if (error || !session) throw error;

      const credits = challenges.map((c) => ({
        session_id: session.id,
        challenge_id: c.id,
        user_id: userId,
        pages_credited: pages,
        week_start: weekStartDateString(new Date(c.joined_at)),
      }));

      if (credits.length > 0) {
        await supabase.from("challenge_session_credits").insert(credits);
      }

      setStep(3);
      onSuccess?.();
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
          className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-[20px] outline-none"
          style={{
            backgroundColor: "var(--bg-card)",
            boxShadow: "var(--shadow-drawer)",
            maxHeight: "92dvh",
          }}
        >
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-gray-200" />

          {step === 1 && (
            <div className="flex flex-col flex-1 overflow-hidden px-5 py-4">
              <Drawer.Title className="font-serif text-xl font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                What did you read?
              </Drawer.Title>
              <div
                className="flex items-center gap-2 rounded-[10px] px-3 py-2.5 mb-4"
                style={{ backgroundColor: "var(--bg-subtle)" }}
              >
                <Search size={16} style={{ color: "var(--text-muted)" }} />
                <input
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-inter)" }}
                  placeholder="Search your library…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredBooks.length === 0 ? (
                  <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
                    No books found. Add one in Library.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {filteredBooks.map((book) => (
                      <button
                        key={book.id}
                        onClick={() => {
                          setSelectedBook(book);
                          setStep(2);
                        }}
                        className="flex flex-col gap-2 p-3 rounded-[12px] text-left transition-colors"
                        style={{ backgroundColor: "var(--bg-subtle)" }}
                      >
                        {book.cover_url ? (
                          <img
                            src={book.cover_url}
                            alt={book.title}
                            className="w-full aspect-[2/3] object-cover rounded-[8px]"
                          />
                        ) : (
                          <div
                            className="w-full aspect-[2/3] rounded-[8px] flex items-center justify-center"
                            style={{ backgroundColor: "var(--app-accent-light)" }}
                          >
                            <span className="text-2xl">📖</span>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-medium leading-tight line-clamp-2" style={{ color: "var(--text-primary)" }}>
                            {book.title}
                          </p>
                          {book.authors?.[0] && (
                            <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: "var(--text-muted)" }}>
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
                <button onClick={() => setStep(1)} className="text-sm" style={{ color: "var(--app-accent)" }}>
                  ← Back
                </button>
                <Drawer.Title className="font-serif text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                  How far did you get?
                </Drawer.Title>
              </div>

              <div className="flex gap-2">
                {(["direct", "cumulative"] as LogMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setLogMode(mode);
                      setPagesPreview(null);
                      setInputValue("");
                    }}
                    className="flex-1 py-2 rounded-full text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: logMode === mode ? "var(--app-accent)" : "var(--bg-subtle)",
                      color: logMode === mode ? "#fff" : "var(--text-secondary)",
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
                    fontSize: "40px",
                    fontFamily: "var(--font-lora)",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                  placeholder="0"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    computePreview(e.target.value);
                  }}
                  autoFocus
                />
                {pagesPreview !== null && (
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    That's <span style={{ color: "var(--app-accent)", fontWeight: 600 }}>+{pagesPreview} pages</span> towards your goals
                  </p>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={!pagesPreview || pagesPreview <= 0 || submitting}
                className="w-full py-3.5 rounded-[10px] font-serif text-base font-semibold text-white transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ backgroundColor: "var(--app-accent)" }}
              >
                <ChevronRight size={18} />
                Preview
              </button>
            </div>
          )}

          {step === 3 && selectedBook && (
            <div className="flex flex-col px-5 py-4 gap-6 items-center">
              <Drawer.Title className="font-serif text-xl font-semibold self-start" style={{ color: "var(--text-primary)" }}>
                Nicely done
              </Drawer.Title>
              <div className="flex items-center gap-4 w-full p-4 rounded-[12px]" style={{ backgroundColor: "var(--bg-subtle)" }}>
                {selectedBook.cover_url ? (
                  <img src={selectedBook.cover_url} alt={selectedBook.title} className="w-12 rounded-[6px]" />
                ) : (
                  <span className="text-3xl">📖</span>
                )}
                <div>
                  <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{selectedBook.title}</p>
                  <p className="text-sm mt-0.5" style={{ color: "var(--app-accent)", fontWeight: 600 }}>+{pagesPreview} pages</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    Added to {challenges.length} challenge{challenges.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-full py-3.5 rounded-[10px] font-serif text-base font-semibold text-white flex items-center justify-center gap-2"
                style={{ backgroundColor: "var(--app-accent)" }}
              >
                <Check size={18} />
                Log it
              </button>
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
