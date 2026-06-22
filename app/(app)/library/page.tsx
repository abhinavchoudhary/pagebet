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
    <div className="flex flex-col gap-6 px-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 24px)" }}>
      <div className="flex items-center justify-between">
        <h1
          className="font-serif font-semibold"
          style={{ fontSize: 24, color: "var(--espresso)" }}
        >
          My Library
        </h1>
        <AddBookButton />
      </div>

      {allBooks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <p
            className="font-serif text-lg text-center"
            style={{ color: "var(--text-secondary)" }}
          >
            Add your first book to get started
          </p>
        </div>
      ) : (
        <>
          {reading.length > 0 && (
            <div>
              <p
                className="text-[10px] font-semibold uppercase mb-3"
                style={{
                  letterSpacing: "0.1em",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-inter)",
                }}
              >
                Reading now
              </p>
              <div className="grid grid-cols-3 gap-3">
                {reading.map((book) => (
                  <BookTile key={book.id} book={book} />
                ))}
              </div>
            </div>
          )}

          {finished.length > 0 && (
            <div>
              <p
                className="text-[10px] font-semibold uppercase mb-3"
                style={{
                  letterSpacing: "0.1em",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-inter)",
                }}
              >
                Finished
              </p>
              <div className="grid grid-cols-3 gap-3 opacity-60">
                {finished.map((book) => (
                  <BookTile key={book.id} book={book} />
                ))}
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
          className="w-full rounded-[4px] object-cover shadow-sm"
          style={{ aspectRatio: "2/3" }}
        />
      ) : (
        <div
          className="w-full rounded-[4px]"
          style={{ aspectRatio: "2/3", backgroundColor: "var(--espresso)" }}
        />
      )}
      <p
        className="text-xs leading-tight line-clamp-2"
        style={{ color: "var(--text-secondary)", fontFamily: "var(--font-inter)" }}
      >
        {book.title}
      </p>
    </div>
  );
}
