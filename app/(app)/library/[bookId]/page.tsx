import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";

import { db } from "@/lib/db";
import { books, readingSessions } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { TopAppBar } from "@/components/ui/top-app-bar";
import { BookProgressPanel } from "@/components/book-progress-panel";
import { bookProgress } from "@/lib/book-progress";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [book] = await db
    .select()
    .from(books)
    .where(and(eq(books.id, bookId), eq(books.userId, session.user.id)));

  if (!book) notFound();

  const sessions = await db
    .select({
      id: readingSessions.id,
      pagesRead: readingSessions.pagesRead,
      logMode: readingSessions.logMode,
      pagePosition: readingSessions.pagePosition,
      loggedAt: readingSessions.loggedAt,
    })
    .from(readingSessions)
    .where(eq(readingSessions.bookId, bookId))
    .orderBy(desc(readingSessions.loggedAt))
    .limit(40);

  const progress = bookProgress({
    currentPage: book.currentPage,
    totalPages: book.totalPages,
    finished: book.finished,
  });

  return (
    <div className="flex flex-col">
      <TopAppBar backHref="/library" title="" />

      <div className="flex flex-col items-center gap-4 px-5 pb-4">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="rounded-corner-sm object-cover md-elevation-2"
            style={{ aspectRatio: "2 / 3", height: "11rem" }}
          />
        ) : (
          <div
            className="rounded-corner-sm bg-primary-container md-elevation-1"
            style={{ height: "11rem", aspectRatio: "2 / 3" }}
          />
        )}
        <div className="text-center">
          <h1 className="md-headline-small text-on-surface">{book.title}</h1>
          {book.authors?.[0] && (
            <p className="md-body-medium text-on-surface-variant">
              {book.authors.join(", ")}
            </p>
          )}
          {progress.state === "finished" && (
            <span className="mt-2 inline-flex items-center rounded-corner-sm bg-tertiary-container px-2 py-0.5 md-label-small text-on-tertiary-container">
              Finished
            </span>
          )}
        </div>
      </div>

      <div className="px-5 py-4">
        <BookProgressPanel
          bookId={book.id}
          title={book.title}
          currentPage={book.currentPage}
          totalPages={book.totalPages}
          finished={book.finished}
        />
      </div>

      {sessions.length > 0 && (
        <div className="px-5 py-4">
          <p className="mb-2 md-label-medium text-on-surface-variant">
            Reading history
          </p>
          <div className="overflow-hidden rounded-corner-lg border border-outline-variant">
            {sessions.map((s, i) => (
              <div
                key={s.id}
                className="flex items-center justify-between px-4 py-3"
                style={{
                  borderTop:
                    i === 0 ? undefined : "1px solid var(--md-sys-color-outline-variant)",
                }}
              >
                <div>
                  <p className="md-body-medium text-on-surface">
                    +{s.pagesRead} pages
                  </p>
                  <p className="md-body-small text-on-surface-variant">
                    {s.logMode === "cumulative" && s.pagePosition
                      ? `reached page ${s.pagePosition}`
                      : "pages read"}
                  </p>
                </div>
                <span className="md-body-small text-on-surface-variant">
                  {format(new Date(s.loggedAt), "MMM d")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
