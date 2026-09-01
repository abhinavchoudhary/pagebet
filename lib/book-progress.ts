export type BookProgressState = "not-started" | "reading" | "finished";

export interface BookProgressInput {
  currentPage: number | null | undefined;
  totalPages: number | null | undefined;
  finished?: boolean;
}

export interface BookProgress {
  /** 0–1, clamped. 0 when total pages is unknown. */
  fraction: number;
  /** 0–100, rounded. */
  pct: number;
  currentPage: number;
  totalPages: number | null;
  pagesLeft: number | null;
  state: BookProgressState;
  /** true when we can't compute a percentage (no total pages) */
  unknownTotal: boolean;
}

/**
 * Single source of truth for "how much of this book have I read".
 * Reused by Library, Home, Feed and the book detail page.
 */
export function bookProgress({
  currentPage,
  totalPages,
  finished,
}: BookProgressInput): BookProgress {
  const total = totalPages && totalPages > 0 ? totalPages : null;
  const current = Math.max(0, currentPage ?? 0);

  if (total === null) {
    return {
      fraction: finished ? 1 : 0,
      pct: finished ? 100 : 0,
      currentPage: current,
      totalPages: null,
      pagesLeft: null,
      state: finished ? "finished" : current > 0 ? "reading" : "not-started",
      unknownTotal: !finished,
    };
  }

  const clamped = Math.min(current, total);
  const fraction = finished ? 1 : clamped / total;
  const state: BookProgressState = finished || clamped >= total
    ? "finished"
    : clamped > 0
      ? "reading"
      : "not-started";

  return {
    fraction,
    pct: Math.round(fraction * 100),
    currentPage: clamped,
    totalPages: total,
    pagesLeft: Math.max(0, total - clamped),
    state,
    unknownTotal: false,
  };
}
