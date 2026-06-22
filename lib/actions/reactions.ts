"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { feedReactions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function toggleReaction(
  sessionId: string,
  emoji: string
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  const [existing] = await db
    .select()
    .from(feedReactions)
    .where(
      and(
        eq(feedReactions.sessionId, sessionId),
        eq(feedReactions.userId, userId)
      )
    );

  if (!existing) {
    await db.insert(feedReactions).values({ sessionId, userId, emoji });
    return;
  }

  if (existing.emoji === emoji) {
    await db
      .delete(feedReactions)
      .where(
        and(
          eq(feedReactions.sessionId, sessionId),
          eq(feedReactions.userId, userId)
        )
      );
  } else {
    await db
      .update(feedReactions)
      .set({ emoji })
      .where(
        and(
          eq(feedReactions.sessionId, sessionId),
          eq(feedReactions.userId, userId)
        )
      );
  }
}
