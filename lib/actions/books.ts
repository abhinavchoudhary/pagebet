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

  await db
    .update(books)
    .set({ finished })
    .where(and(eq(books.id, bookId), eq(books.userId, session.user.id)));

  revalidatePath("/library");
}
