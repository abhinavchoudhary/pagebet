"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  readingSessions,
  challengeSessionCredits,
  challengeMembers,
  challenges,
} from "@/lib/db/schema";
import { computePagesRead } from "@/lib/pages-credit";
import { weekStartDateString } from "@/lib/rolling-week";
import { eq, and, desc, isNotNull } from "drizzle-orm";

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

  return { success: true, pagesRead };
}

export async function deleteSession(sessionId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [existing] = await db
    .select({ userId: readingSessions.userId })
    .from(readingSessions)
    .where(eq(readingSessions.id, sessionId));

  if (!existing || existing.userId !== session.user.id) throw new Error("Not found");

  await db.delete(readingSessions).where(eq(readingSessions.id, sessionId));
}

export async function editSessionPages(
  sessionId: string,
  newPagesRead: number
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (newPagesRead <= 0) return;

  const [existing] = await db
    .select({ userId: readingSessions.userId })
    .from(readingSessions)
    .where(eq(readingSessions.id, sessionId));

  if (!existing || existing.userId !== session.user.id) throw new Error("Not found");

  await Promise.all([
    db.update(readingSessions).set({ pagesRead: newPagesRead }).where(eq(readingSessions.id, sessionId)),
    db.update(challengeSessionCredits).set({ pagesCredited: newPagesRead }).where(eq(challengeSessionCredits.sessionId, sessionId)),
  ]);
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
