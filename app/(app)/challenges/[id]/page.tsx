import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import { db } from "@/lib/db";
import {
  challenges,
  challengeMembers,
  challengeSessionCredits,
  users,
  books,
  readingSessions,
  feedReactions,
} from "@/lib/db/schema";
import { eq, and, sum, desc, inArray } from "drizzle-orm";
import { Leaderboard } from "@/components/leaderboard";
import { InviteHeaderButton } from "@/components/invite-header-button";
import { FeedItem } from "@/components/feed-item";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Card } from "@/components/ui/card";
import { LinearProgress } from "@/components/ui/linear-progress";
import { getRollingWeek } from "@/lib/rolling-week";
import { computePenalty } from "@/lib/penalty";

export default async function ChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [[challenge], [membership], members] = await Promise.all([
    db.select().from(challenges).where(eq(challenges.id, id)),
    db
      .select({ joinedAt: challengeMembers.joinedAt })
      .from(challengeMembers)
      .where(
        and(
          eq(challengeMembers.challengeId, id),
          eq(challengeMembers.userId, userId)
        )
      ),
    db
      .select({
        userId: challengeMembers.userId,
        displayName: users.name,
        avatarUrl: users.image,
        joinedAt: challengeMembers.joinedAt,
      })
      .from(challengeMembers)
      .innerJoin(users, eq(challengeMembers.userId, users.id))
      .where(eq(challengeMembers.challengeId, id)),
  ]);

  if (!challenge) notFound();
  if (!membership) redirect("/");

  const now = new Date();

  const [allCredits, challengeBooks, recentSessions] = await Promise.all([
    db
      .select({
        userId: challengeSessionCredits.userId,
        weekStart: challengeSessionCredits.weekStart,
        total: sum(challengeSessionCredits.pagesCredited),
      })
      .from(challengeSessionCredits)
      .where(eq(challengeSessionCredits.challengeId, id))
      .groupBy(
        challengeSessionCredits.userId,
        challengeSessionCredits.weekStart
      ),
    db
      .selectDistinct({
        userId: readingSessions.userId,
        bookId: books.id,
        title: books.title,
        coverUrl: books.coverUrl,
        finished: books.finished,
        currentPage: books.currentPage,
        totalPages: books.totalPages,
      })
      .from(books)
      .innerJoin(readingSessions, eq(readingSessions.bookId, books.id))
      .innerJoin(
        challengeSessionCredits,
        and(
          eq(challengeSessionCredits.sessionId, readingSessions.id),
          eq(challengeSessionCredits.challengeId, id)
        )
      ),
    db
      .select({
        id: readingSessions.id,
        userId: readingSessions.userId,
        pagesRead: readingSessions.pagesRead,
        loggedAt: readingSessions.loggedAt,
        bookTitle: books.title,
        bookCoverUrl: books.coverUrl,
        bookAuthors: books.authors,
        bookCurrentPage: books.currentPage,
        bookTotalPages: books.totalPages,
        userName: users.name,
        userImage: users.image,
      })
      .from(readingSessions)
      .innerJoin(books, eq(readingSessions.bookId, books.id))
      .innerJoin(users, eq(readingSessions.userId, users.id))
      .innerJoin(
        challengeSessionCredits,
        and(
          eq(challengeSessionCredits.sessionId, readingSessions.id),
          eq(challengeSessionCredits.challengeId, id)
        )
      )
      .orderBy(desc(readingSessions.loggedAt))
      .limit(20),
  ]);

  const leaderboard = members.map((m) => {
    const { weekStart } = getRollingWeek(m.joinedAt, now);
    const weekStartStr = weekStart.toISOString().split("T")[0];
    const memberCredits = allCredits.filter((c) => c.userId === m.userId);
    const weekRow = memberCredits.find((c) => c.weekStart === weekStartStr);
    const pagesThisWeek = Number(weekRow?.total ?? 0);
    const { penaltyExposure } = computePenalty({
      weeklyGoal: challenge.weeklyGoal,
      pagesThisWeek,
      penaltyAmount: Number(challenge.penaltyAmount),
      carryOver: challenge.carryOver,
    });
    return {
      user_id: m.userId,
      display_name: m.displayName ?? "Reader",
      avatar_url: m.avatarUrl ?? null,
      pages_this_week: pagesThisWeek,
      weekly_goal: challenge.weeklyGoal,
      penalty_exposure: penaltyExposure,
    };
  });

  const allTimePagesMap: Record<string, number> = {};
  for (const c of allCredits) {
    allTimePagesMap[c.userId] =
      (allTimePagesMap[c.userId] ?? 0) + Number(c.total ?? 0);
  }

  const sessionIds = recentSessions.map((s) => s.id);
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

  const booksByMember: Record<string, typeof challengeBooks> = {};
  for (const b of challengeBooks) {
    if (!booksByMember[b.userId]) booksByMember[b.userId] = [];
    booksByMember[b.userId].push(b);
  }

  const isCreator = challenge.creatorId === userId;
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/join/${challenge.inviteToken}`;

  const sortedLeaderboard = leaderboard.sort(
    (a, b) => b.pages_this_week - a.pages_this_week
  );
  const allTimeSorted = [...members].sort(
    (a, b) => (allTimePagesMap[b.userId] ?? 0) - (allTimePagesMap[a.userId] ?? 0)
  );

  const myEntry = sortedLeaderboard.find((e) => e.user_id === userId);
  const frac =
    myEntry && myEntry.weekly_goal > 0
      ? Math.min(1, myEntry.pages_this_week / myEntry.weekly_goal)
      : 0;

  return (
    <div className="flex flex-col">
      <ScrollToTop />

      {/* ── Header ── */}
      <header
        className="rounded-b-[28px] bg-surface-container-highest px-5 pb-6"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/"
            className="md-state-layer -ml-2 flex size-10 items-center justify-center rounded-corner-full text-on-surface"
            aria-label="Back"
          >
            <ArrowLeft className="size-6" />
          </Link>
          <div className="flex items-center gap-1">
            {challenge.inviteActive && <InviteHeaderButton url={inviteUrl} />}
            {isCreator && (
              <Link
                href={`/challenges/${id}/settings`}
                aria-label="Settings"
                className="md-state-layer flex size-10 items-center justify-center rounded-corner-full text-on-surface-variant"
              >
                <Settings className="z-[1] size-5" />
              </Link>
            )}
          </div>
        </div>

        <h1 className="md-headline-medium text-on-surface">{challenge.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 md-body-small text-on-surface-variant">
          <span className="font-semibold text-primary">
            {challenge.penaltyCurrency}
            {Number(challenge.penaltyAmount)}/pg
          </span>
          <span>{members.length} readers</span>
          <span>{challenge.weeklyGoal} pg/week goal</span>
        </div>
      </header>

      <div className="flex flex-col gap-6 px-5 py-6">
        {/* Your progress */}
        {myEntry && (
          <section>
            <p className="mb-3 md-label-medium text-on-surface-variant">
              Your progress this week
            </p>
            <Card variant="elevated" className="p-4">
              <div className="mb-3 flex items-end justify-between">
                <p className="md-headline-small text-on-surface">
                  {myEntry.pages_this_week}
                  <span className="md-body-medium text-on-surface-variant">
                    {" "}
                    / {myEntry.weekly_goal} pg
                  </span>
                </p>
                <span className="md-label-large text-primary">
                  {Math.round(frac * 100)}%
                </span>
              </div>
              <LinearProgress value={frac} thickness={8} />
              {myEntry.pages_this_week < myEntry.weekly_goal && (
                <p className="mt-3 md-body-small text-on-surface-variant">
                  Need {myEntry.weekly_goal - myEntry.pages_this_week} more pages
                </p>
              )}
            </Card>
          </section>
        )}

        {challenge.description && (
          <p className="md-body-medium text-on-surface-variant">
            {challenge.description}
          </p>
        )}

        <section>
          <p className="mb-3 md-label-medium text-on-surface-variant">
            Group standings
          </p>
          <Leaderboard
            entries={sortedLeaderboard}
            penaltyCurrency={challenge.penaltyCurrency}
            currentUserId={userId}
          />
        </section>

        {/* All-time */}
        <section>
          <p className="mb-3 md-label-medium text-on-surface-variant">All-time</p>
          <div className="overflow-hidden rounded-corner-lg border border-outline-variant">
            {allTimeSorted.map((m, i) => {
              const total = allTimePagesMap[m.userId] ?? 0;
              const daysSinceJoined = Math.max(
                1,
                Math.ceil((now.getTime() - m.joinedAt.getTime()) / 86400000)
              );
              const avgDaily = total > 0 ? Math.round(total / daysSinceJoined) : 0;
              const isMe = m.userId === userId;
              return (
                <div
                  key={m.userId}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{
                    backgroundColor: isMe
                      ? "var(--md-sys-color-surface-container-highest)"
                      : "var(--md-sys-color-surface-container-low)",
                    borderTop:
                      i === 0
                        ? undefined
                        : "1px solid var(--md-sys-color-outline-variant)",
                  }}
                >
                  <span className="w-5 shrink-0 text-center tabular-nums md-body-small text-on-surface-variant">
                    {i + 1}
                  </span>
                  {m.avatarUrl ? (
                    <img
                      src={m.avatarUrl}
                      alt={m.displayName ?? ""}
                      className="size-7 shrink-0 rounded-corner-full object-cover"
                    />
                  ) : (
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-corner-full bg-primary-container md-label-small text-on-primary-container">
                      {m.displayName?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate md-body-medium ${
                        isMe ? "font-semibold text-on-surface" : "text-on-surface"
                      }`}
                    >
                      {m.displayName?.split(" ")[0]}
                      {isMe ? " (you)" : ""}
                    </p>
                    <p className="md-body-small text-on-surface-variant">
                      {avgDaily} pg/day avg
                    </p>
                  </div>
                  <span className="tabular-nums md-title-small text-on-surface">
                    {total.toLocaleString()}
                  </span>
                  <span className="md-body-small text-on-surface-variant">pg</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Bookshelves */}
        {Object.keys(booksByMember).length > 0 && (
          <section>
            <p className="mb-3 md-label-medium text-on-surface-variant">
              Bookshelves
            </p>
            <div className="flex flex-col gap-4">
              {members.map((m) => {
                const memberBooks = booksByMember[m.userId];
                if (!memberBooks?.length) return null;
                const isMe = m.userId === userId;
                return (
                  <div key={m.userId}>
                    <div className="mb-2 flex items-center gap-2">
                      {m.avatarUrl ? (
                        <img
                          src={m.avatarUrl}
                          alt=""
                          className="size-5 rounded-corner-full object-cover"
                        />
                      ) : (
                        <div className="flex size-5 items-center justify-center rounded-corner-full bg-primary-container text-[10px] text-on-primary-container">
                          {m.displayName?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <p className="md-body-small text-on-surface-variant">
                        {m.displayName?.split(" ")[0]}
                        {isMe ? " (you)" : ""}
                      </p>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {memberBooks.map((b) => (
                        <div
                          key={b.bookId}
                          className="w-12 shrink-0"
                          style={{ opacity: b.finished ? 0.5 : 1 }}
                        >
                          {b.coverUrl ? (
                            <img
                              src={b.coverUrl}
                              alt={b.title}
                              className="w-12 rounded-corner-xs object-cover md-elevation-1"
                              style={{ aspectRatio: "2 / 3" }}
                            />
                          ) : (
                            <div
                              className="w-12 rounded-corner-xs bg-primary-container"
                              style={{ aspectRatio: "2 / 3" }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Activity */}
        {recentSessions.length > 0 && (
          <section>
            <p className="mb-3 md-label-medium text-on-surface-variant">
              Recent activity
            </p>
            <div className="flex flex-col gap-4">
              {recentSessions.map((s) => (
                <FeedItem
                  key={s.id}
                  sessionId={s.id}
                  userId={s.userId}
                  userName={s.userName ?? "Reader"}
                  avatarUrl={s.userImage ?? null}
                  bookTitle={s.bookTitle}
                  bookCoverUrl={s.bookCoverUrl ?? null}
                  bookAuthor={s.bookAuthors?.[0] ?? null}
                  bookCurrentPage={s.bookCurrentPage}
                  bookTotalPages={s.bookTotalPages}
                  pagesRead={s.pagesRead}
                  loggedAt={s.loggedAt.toISOString()}
                  reactions={reactionsBySession[s.id] ?? {}}
                  myReaction={myReactionBySession[s.id] ?? null}
                  currentUserId={userId}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
