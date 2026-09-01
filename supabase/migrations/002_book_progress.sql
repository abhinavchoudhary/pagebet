-- Per-book reading progress.
-- Adds books.current_page: the page the reader is currently on. Maintained
-- automatically when reading sessions are logged/edited/deleted
-- (lib/actions/sessions.ts → recomputeBookProgress) and settable directly from
-- the book detail page (lib/actions/books.ts → updateBookProgress).
--
-- Apply with the project's usual flow: `npx drizzle-kit push`
-- (schema of record is lib/db/schema.ts), or run this statement directly.

alter table books
  add column if not exists current_page integer not null default 0;

-- Backfill existing rows from their logged sessions.
update books b
set current_page = least(
  coalesce(b.total_pages, 2147483647),
  greatest(
    coalesce((select sum(s.pages_read) from reading_sessions s where s.book_id = b.id), 0),
    coalesce((select max(s.page_position) from reading_sessions s where s.book_id = b.id), 0)
  )
)
where current_page = 0;
