import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  challengeMembers,
  readingSessions,
  feedReactions,
  books,
  users,
} from "@/lib/db/schema";
import { eq, inArray, desc } from "drizzle-orm";
import { FeedItem } from "@/components/feed-item";

export default async function FeedPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const memberships = await db
    .select({ challengeId: challengeMembers.challengeId })
    .from(challengeMembers)
    .where(eq(challengeMembers.userId, userId));

  if (memberships.length === 0) {
    return (
      <div className="px-4 flex flex-col gap-5" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 24px)" }}>
        <h1 className="font-serif font-semibold" style={{ fontSize: 24, color: "var(--espresso)" }}>
          Feed
        </h1>
        <div className="flex flex-col items-center gap-3 py-20">
          <p className="font-serif text-lg text-center" style={{ color: "var(--text-secondary)" }}>
            The story begins when someone logs a session
          </p>
        </div>
      </div>
    );
  }

  const challengeIds = memberships.map((m) => m.challengeId);

  const peerMemberships = await db
    .select({ userId: challengeMembers.userId })
    .from(challengeMembers)
    .where(inArray(challengeMembers.challengeId, challengeIds));

  const peerIds = [...new Set(peerMemberships.map((m) => m.userId))];

  const sessions = await db
    .select({
      id: readingSessions.id,
      userId: readingSessions.userId,
      pagesRead: readingSessions.pagesRead,
      loggedAt: readingSessions.loggedAt,
      bookTitle: books.title,
      bookCoverUrl: books.coverUrl,
      bookAuthors: books.authors,
      userName: users.name,
      userImage: users.image,
    })
    .from(readingSessions)
    .innerJoin(books, eq(readingSessions.bookId, books.id))
    .innerJoin(users, eq(readingSessions.userId, users.id))
    .where(inArray(readingSessions.userId, peerIds))
    .orderBy(desc(readingSessions.loggedAt))
    .limit(50);

  const sessionIds = sessions.map((s) => s.id);

  const allReactions =
    sessionIds.length > 0
      ? await db
          .select()
          .from(feedReactions)
          .where(inArray(feedReactions.sessionId, sessionIds))
      : [];

  const reactionsBySession: Record<string, Record<string, number>> = {};
  const myReactionBySession: Record<string, string | null> = {};

  for (const r of allReactions) {
    if (!reactionsBySession[r.sessionId]) reactionsBySession[r.sessionId] = {};
    reactionsBySession[r.sessionId][r.emoji] =
      (reactionsBySession[r.sessionId][r.emoji] ?? 0) + 1;
    if (r.userId === userId) myReactionBySession[r.sessionId] = r.emoji;
  }

  return (
    <div className="flex flex-col gap-5 px-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 24px)" }}>
      <div className="flex items-center justify-between">
        <h1 className="font-serif font-semibold" style={{ fontSize: 24, color: "var(--espresso)" }}>
          Feed
        </h1>
      </div>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <p className="font-serif text-lg text-center" style={{ color: "var(--text-secondary)" }}>
            The story begins when someone logs a session
          </p>
        </div>
      ) : (
        sessions.map((s) => (
          <FeedItem
            key={s.id}
            sessionId={s.id}
            userId={s.userId}
            userName={s.userName ?? "Reader"}
            avatarUrl={s.userImage ?? null}
            bookTitle={s.bookTitle}
            bookCoverUrl={s.bookCoverUrl ?? null}
            bookAuthor={s.bookAuthors?.[0] ?? null}
            pagesRead={s.pagesRead}
            loggedAt={s.loggedAt.toISOString()}
            reactions={reactionsBySession[s.id] ?? {}}
            myReaction={myReactionBySession[s.id] ?? null}
            currentUserId={userId}
          />
        ))
      )}
    </div>
  );
}
