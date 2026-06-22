"use client";

import { useState, useRef } from "react";
import { Search } from "lucide-react";
import type { BookResult } from "@/lib/books";

interface BookSearchProps {
  onSelect: (book: BookResult) => void;
}

export function BookSearch({ onSelect }: BookSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(value: string) {
    setQuery(value);
    if (debounce.current) clearTimeout(debounce.current);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/books?q=${encodeURIComponent(value)}`);
        if (res.ok) setResults(await res.json());
      } finally {
        setLoading(false);
      }
    }, 350);
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex items-center gap-2 rounded-[10px] px-3 py-2.5"
        style={{ backgroundColor: "var(--bg-subtle)" }}
      >
        <Search size={16} style={{ color: "var(--text-muted)" }} />
        <input
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-inter)" }}
          placeholder="Search by title or author…"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
        />
      </div>

      {loading && (
        <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
          Searching…
        </p>
      )}

      {!loading && results.length > 0 && (
        <div className="flex flex-col gap-2">
          {results.map((book) => (
            <button
              key={book.id}
              onClick={() => onSelect(book)}
              className="flex items-center gap-3 p-3 rounded-[10px] text-left transition-colors"
              style={{ backgroundColor: "var(--bg-subtle)" }}
            >
              {book.coverUrl ? (
                <img src={book.coverUrl} alt={book.title} className="w-10 rounded-[4px] object-cover" style={{ aspectRatio: "2/3" }} />
              ) : (
                <div
                  className="w-10 rounded-[4px] flex items-center justify-center"
                  style={{ aspectRatio: "2/3", backgroundColor: "var(--app-accent-light)" }}
                >
                  <span>📖</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1" style={{ color: "var(--text-primary)" }}>
                  {book.title}
                </p>
                {book.authors.length > 0 && (
                  <p className="text-xs line-clamp-1 mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {book.authors.join(", ")}
                  </p>
                )}
                {book.pageCount && (
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {book.pageCount} pages
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
