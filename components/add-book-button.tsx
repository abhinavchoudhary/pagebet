"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { BookSearch } from "@/components/book-search";
import { createClient } from "@/lib/supabase/client";
import type { BookResult } from "@/lib/books";

interface AddBookButtonProps {
  userId: string;
}

export function AddBookButton({ userId }: AddBookButtonProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  async function handleSelect(book: BookResult) {
    setSaving(true);
    try {
      await supabase.from("books").upsert({
        user_id: userId,
        google_books_id: book.id,
        title: book.title,
        authors: book.authors,
        cover_url: book.coverUrl,
        total_pages: book.pageCount,
      }, { onConflict: "user_id,google_books_id" });

      setOpen(false);
      window.location.reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-sm font-medium text-white"
        style={{ backgroundColor: "var(--app-accent)" }}
      >
        <Plus size={16} />
        Add book
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: "var(--border-default)" }}>
            <h2 className="font-serif text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Add a book
            </h2>
            <button onClick={() => setOpen(false)}>
              <X size={20} style={{ color: "var(--text-muted)" }} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <BookSearch onSelect={handleSelect} />
            {saving && (
              <p className="text-sm text-center mt-4" style={{ color: "var(--text-muted)" }}>
                Saving…
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
