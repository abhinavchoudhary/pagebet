import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { InferSelectModel } from "drizzle-orm";
import { eq, desc } from "drizzle-orm";

import { db } from "@/lib/db";
import { books } from "@/lib/db/schema";
import { AddBookButton } from "@/components/add-book-button";
import { LinearProgress } from "@/components/ui/linear-progress";
import { bookProgress } from "@/lib/book-progress";

type Book = InferSelectModel<typeof books>;

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const allBooks = await db
    .select()
    .from(books)
    .where(eq(books.userId, session.user.id))
    .orderBy(desc(books.addedAt));

  const reading = allBooks.filter((b) => !b.finished);
  const finished = allBooks.filter((b) => b.finished);

  return (
    <div className="flex flex-col">
      <header
        className="flex items-center justify-between px-4 pb-2"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)" }}
      >
        <h1 className="md-headline-medium text-on-surface">Library</h1>
        <AddBookButton />
      </header>

      {allBooks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-24 text-center">
          <p className="md-title-large text-on-surface-variant">
            Add your first book to get started
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8 px-4 py-4">
          {reading.length > 0 && (
            <Section title="Reading now">
              {reading.map((book) => (
                <BookTile key={book.id} book={book} />
              ))}
            </Section>
          )}
          {finished.length > 0 && (
            <Section title="Finished">
              {finished.map((book) => (
                <BookTile key={book.id} book={book} muted />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p className="mb-3 md-label-medium text-on-surface-variant">{title}</p>
      <div className="grid grid-cols-3 gap-x-3 gap-y-5">{children}</div>
    </section>
  );
}

function BookTile({ book, muted }: { book: Book; muted?: boolean }) {
  const progress = bookProgress({
    currentPage: book.currentPage,
    totalPages: book.totalPages,
    finished: book.finished,
  });

  return (
    <Link
      href={`/library/${book.id}`}
      className="group flex flex-col gap-1.5"
    >
      <div
        className={`relative overflow-hidden rounded-corner-sm transition-transform duration-[var(--md-sys-motion-duration-short-3)] group-active:scale-[0.97] ${
          muted ? "opacity-60" : ""
        }`}
      >
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full object-cover md-elevation-1"
            style={{ aspectRatio: "2 / 3" }}
          />
        ) : (
          <div
            className="w-full bg-primary-container"
            style={{ aspectRatio: "2 / 3" }}
          />
        )}
      </div>
      {!book.finished && (
        <LinearProgress value={progress.fraction} thickness={3} />
      )}
      <p className="line-clamp-2 md-body-small leading-tight text-on-surface-variant">
        {book.title}
      </p>
      {!book.finished && !progress.unknownTotal && progress.pct > 0 && (
        <p className="md-label-small text-on-surface-variant/70">
          {progress.pct}%
        </p>
      )}
    </Link>
  );
}
