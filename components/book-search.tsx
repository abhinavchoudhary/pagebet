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
      {/* Material 3 search bar */}
      <div className="flex items-center gap-3 rounded-corner-full bg-surface-container-high px-4 md-elevation-1">
        <Search className="size-5 text-on-surface-variant" />
        <input
          className="h-14 flex-1 bg-transparent md-body-large text-on-surface outline-none placeholder:text-on-surface-variant"
          placeholder="Search by title or author"
          value={query}
          autoFocus
          onChange={(e) => handleChange(e.target.value)}
        />
      </div>

      {loading && (
        <p className="py-4 text-center md-body-medium text-on-surface-variant">
          Searching…
        </p>
      )}

      {!loading && results.length > 0 && (
        <div className="flex flex-col">
          {results.map((book) => (
            <button
              key={book.id}
              onClick={() => onSelect(book)}
              className="md-state-layer flex items-center gap-3 rounded-corner-md p-3 text-left"
            >
              {book.coverUrl ? (
                <img
                  src={book.coverUrl}
                  alt=""
                  className="w-10 rounded-corner-xs object-cover"
                  style={{ aspectRatio: "2 / 3" }}
                />
              ) : (
                <div
                  className="flex w-10 items-center justify-center rounded-corner-xs bg-primary-container"
                  style={{ aspectRatio: "2 / 3" }}
                >
                  📖
                </div>
              )}
              <div className="z-[1] min-w-0 flex-1">
                <p className="line-clamp-1 md-body-large text-on-surface">
                  {book.title}
                </p>
                {book.authors.length > 0 && (
                  <p className="line-clamp-1 md-body-small text-on-surface-variant">
                    {book.authors.join(", ")}
                  </p>
                )}
                {book.pageCount ? (
                  <p className="md-body-small text-on-surface-variant">
                    {book.pageCount} pages
                  </p>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
