"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  readingSessions,
  challengeSessionCredits,
  challengeMembers,
  challenges,
  books,
} from "@/lib/db/schema";
import { computePagesRead } from "@/lib/pages-credit";
import { weekStartDateString } from "@/lib/rolling-week";
import { eq, and, desc, isNotNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Recompute a book's stored reading position from its sessions:
 *   currentPage = max(latest cumulative page position, sum of all pages read)
 * capped at the book's total pages. Keeps `finished` in sync when a total is
 * known. Called after any session insert / edit / delete.
 */
export async function recomputeBookProgress(bookId: string): Promise<void> {
  const [book] = await db
    .select({ totalPages: books.totalPages })
    .from(books)
    .where(eq(books.id, bookId));
  if (!book) return;

  const [agg] = await db
    .select({
      summed: sql<number>`coalesce(sum(${readingSessions.pagesRead}), 0)`,
      maxPos: sql<number>`coalesce(max(${readingSessions.pagePosition}), 0)`,
    })
    .from(readingSessions)
    .where(eq(readingSessions.bookId, bookId));

  let currentPage = Math.max(Number(agg?.summed ?? 0), Number(agg?.maxPos ?? 0));
  if (book.totalPages && book.totalPages > 0) {
    currentPage = Math.min(currentPage, book.totalPages);
  }

  const finished = !!book.totalPages && currentPage >= book.totalPages;

  await db
    .update(books)
    .set({ currentPage, ...(finished ? { finished: true } : {}) })
    .where(eq(books.id, bookId));

  revalidatePath("/library");
  revalidatePath(`/library/${bookId}`);
}

export async function logSession(data: {
  bookId: string;
  logMode: "cumulative" | "direct";
  inputValue: number;
}): Promise<{ success: boolean; pagesRead?: number }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  let lastPos: number | null = null;
  if (data.logMode === "cumulative") {
    const [last] = await db
      .select({ pagePosition: readingSessions.pagePosition })
      .from(readingSessions)
      .where(
        and(
          eq(readingSessions.userId, userId),
          eq(readingSessions.bookId, data.bookId),
          eq(readingSessions.logMode, "cumulative"),
          isNotNull(readingSessions.pagePosition)
        )
      )
      .orderBy(desc(readingSessions.loggedAt))
      .limit(1);
    lastPos = last?.pagePosition ?? null;
  }

  const pagesRead = computePagesRead(data.logMode, data.inputValue, lastPos);
  if (pagesRead <= 0) return { success: false };

  const [newSession] = await db
    .insert(readingSessions)
    .values({
      userId,
      bookId: data.bookId,
      logMode: data.logMode,
      pagePosition: data.logMode === "cumulative" ? data.inputValue : null,
      pagesRead,
    })
    .returning({ id: readingSessions.id });

  const memberships = await db
    .select({
      challengeId: challengeMembers.challengeId,
      joinedAt: challengeMembers.joinedAt,
      archived: challenges.archived,
    })
    .from(challengeMembers)
    .innerJoin(challenges, eq(challengeMembers.challengeId, challenges.id))
    .where(
      and(
        eq(challengeMembers.userId, userId),
        eq(challenges.archived, false)
      )
    );

  if (memberships.length > 0) {
    await db.insert(challengeSessionCredits).values(
      memberships.map((m) => ({
        sessionId: newSession.id,
        challengeId: m.challengeId,
        userId,
        pagesCredited: pagesRead,
        weekStart: weekStartDateString(m.joinedAt),
      }))
    );
  }

  await recomputeBookProgress(data.bookId);

  return { success: true, pagesRead };
}

export interface SessionSnapshot {
  id: string;
  bookId: string;
  logMode: "cumulative" | "direct";
  pagePosition: number | null;
  pagesRead: number;
  loggedAt: string;
}

export async function deleteSession(
  sessionId: string
): Promise<SessionSnapshot | null> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [existing] = await db
    .select()
    .from(readingSessions)
    .where(eq(readingSessions.id, sessionId));

  if (!existing || existing.userId !== session.user.id) throw new Error("Not found");

  await db.delete(readingSessions).where(eq(readingSessions.id, sessionId));
  await recomputeBookProgress(existing.bookId);

  return {
    id: existing.id,
    bookId: existing.bookId,
    logMode: existing.logMode,
    pagePosition: existing.pagePosition,
    pagesRead: existing.pagesRead,
    loggedAt: existing.loggedAt.toISOString(),
  };
}

/** Re-insert a session removed via deleteSession (the toast "Undo" action). */
export async function restoreSession(snap: SessionSnapshot): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  await db.insert(readingSessions).values({
    id: snap.id,
    userId,
    bookId: snap.bookId,
    logMode: snap.logMode,
    pagePosition: snap.pagePosition,
    pagesRead: snap.pagesRead,
    loggedAt: new Date(snap.loggedAt),
  });

  const memberships = await db
    .select({
      challengeId: challengeMembers.challengeId,
      joinedAt: challengeMembers.joinedAt,
    })
    .from(challengeMembers)
    .innerJoin(challenges, eq(challengeMembers.challengeId, challenges.id))
    .where(and(eq(challengeMembers.userId, userId), eq(challenges.archived, false)));

  if (memberships.length > 0) {
    await db
      .insert(challengeSessionCredits)
      .values(
        memberships.map((m) => ({
          sessionId: snap.id,
          challengeId: m.challengeId,
          userId,
          pagesCredited: snap.pagesRead,
          weekStart: weekStartDateString(m.joinedAt),
        }))
      )
      .onConflictDoNothing();
  }

  await recomputeBookProgress(snap.bookId);
}

export async function editSessionPages(
  sessionId: string,
  newPagesRead: number
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (newPagesRead <= 0) return;

  const [existing] = await db
    .select({ userId: readingSessions.userId, bookId: readingSessions.bookId })
    .from(readingSessions)
    .where(eq(readingSessions.id, sessionId));

  if (!existing || existing.userId !== session.user.id) throw new Error("Not found");

  await Promise.all([
    db.update(readingSessions).set({ pagesRead: newPagesRead }).where(eq(readingSessions.id, sessionId)),
    db.update(challengeSessionCredits).set({ pagesCredited: newPagesRead }).where(eq(challengeSessionCredits.sessionId, sessionId)),
  ]);
  await recomputeBookProgress(existing.bookId);
}

export async function getLastCumulativePosition(bookId: string): Promise<number | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [last] = await db
    .select({ pagePosition: readingSessions.pagePosition })
    .from(readingSessions)
    .where(
      and(
        eq(readingSessions.userId, session.user.id),
        eq(readingSessions.bookId, bookId),
        eq(readingSessions.logMode, "cumulative"),
        isNotNull(readingSessions.pagePosition)
      )
    )
    .orderBy(desc(readingSessions.loggedAt))
    .limit(1);

  return last?.pagePosition ?? null;
}
