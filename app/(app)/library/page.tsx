import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { books } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { AddBookButton } from "@/components/add-book-button";
import type { InferSelectModel } from "drizzle-orm";

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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
          My Library
        </h1>
        <AddBookButton />
      </div>

      {allBooks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <span className="text-4xl">📚</span>
          <p className="font-serif text-lg text-center" style={{ color: "var(--text-secondary)" }}>
            Add your first book to get started
          </p>
        </div>
      ) : (
        <>
          {reading.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                Reading now
              </p>
              <div className="grid grid-cols-3 gap-3">
                {reading.map((book) => <BookTile key={book.id} book={book} />)}
              </div>
            </div>
          )}

          {finished.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                Finished
              </p>
              <div className="grid grid-cols-3 gap-3 opacity-60">
                {finished.map((book) => <BookTile key={book.id} book={book} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BookTile({ book }: { book: Book }) {
  return (
    <div className="flex flex-col gap-1.5">
      {book.coverUrl ? (
        <img
          src={book.coverUrl}
          alt={book.title}
          className="w-full rounded-[8px] object-cover shadow-sm"
          style={{ aspectRatio: "2/3" }}
        />
      ) : (
        <div
          className="w-full rounded-[8px] flex items-center justify-center"
          style={{ aspectRatio: "2/3", backgroundColor: "var(--app-accent-light)" }}
        >
          <span className="text-2xl">📖</span>
        </div>
      )}
      <p className="text-xs leading-tight line-clamp-2" style={{ color: "var(--text-secondary)" }}>
        {book.title}
      </p>
    </div>
  );
}
