"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { books } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function addBook(data: {
  googleBooksId: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  pageCount: number | null;
}): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  await db
    .insert(books)
    .values({
      userId,
      googleBooksId: data.googleBooksId,
      title: data.title,
      authors: data.authors,
      coverUrl: data.coverUrl,
      totalPages: data.pageCount,
    })
    .onConflictDoNothing();

  revalidatePath("/library");
}

export async function markBookFinished(bookId: string, finished: boolean): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [book] = await db
    .select({ totalPages: books.totalPages, currentPage: books.currentPage })
    .from(books)
    .where(and(eq(books.id, bookId), eq(books.userId, session.user.id)));
  if (!book) throw new Error("Not found");

  await db
    .update(books)
    .set({
      finished,
      // Snap the progress bar to 100% / back to the last logged position.
      currentPage: finished
        ? book.totalPages ?? book.currentPage
        : book.currentPage,
    })
    .where(and(eq(books.id, bookId), eq(books.userId, session.user.id)));

  revalidatePath("/library");
  revalidatePath(`/library/${bookId}`);
}

/** Explicitly set where the reader currently is in a book. */
export async function updateBookProgress(
  bookId: string,
  currentPage: number
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [book] = await db
    .select({ totalPages: books.totalPages })
    .from(books)
    .where(and(eq(books.id, bookId), eq(books.userId, session.user.id)));
  if (!book) throw new Error("Not found");

  let next = Math.max(0, Math.round(currentPage));
  if (book.totalPages && book.totalPages > 0) {
    next = Math.min(next, book.totalPages);
  }
  const finished = !!book.totalPages && next >= book.totalPages;

  await db
    .update(books)
    .set({ currentPage: next, finished })
    .where(and(eq(books.id, bookId), eq(books.userId, session.user.id)));

  revalidatePath("/library");
  revalidatePath(`/library/${bookId}`);
  revalidatePath("/");
}

/** Correct a book's total page count (e.g. a different edition). */
export async function updateBookTotalPages(
  bookId: string,
  totalPages: number
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const total = Math.max(1, Math.round(totalPages));

  const [book] = await db
    .select({ currentPage: books.currentPage })
    .from(books)
    .where(and(eq(books.id, bookId), eq(books.userId, session.user.id)));
  if (!book) throw new Error("Not found");

  const currentPage = Math.min(book.currentPage, total);

  await db
    .update(books)
    .set({ currentPage, totalPages: total, finished: currentPage >= total })
    .where(and(eq(books.id, bookId), eq(books.userId, session.user.id)));

  revalidatePath("/library");
  revalidatePath(`/library/${bookId}`);
}
