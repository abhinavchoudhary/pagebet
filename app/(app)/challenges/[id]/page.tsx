import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Settings } from "lucide-react";
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
import { InviteLinkCopy } from "@/components/invite-link-copy";
import { FeedItem } from "@/components/feed-item";
import { ScrollToTop } from "@/components/scroll-to-top";
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

  const [challenge] = await db
    .select()
    .from(challenges)
    .where(eq(challenges.id, id));
  if (!challenge) notFound();

  const [membership] = await db
    .select({ joinedAt: challengeMembers.joinedAt })
    .from(challengeMembers)
    .where(
      and(
        eq(challengeMembers.challengeId, id),
        eq(challengeMembers.userId, userId)
      )
    );

  if (!membership) redirect("/");

  const members = await db
    .select({
      userId: challengeMembers.userId,
      displayName: users.name,
      avatarUrl: users.image,
      joinedAt: challengeMembers.joinedAt,
    })
    .from(challengeMembers)
    .innerJoin(users, eq(challengeMembers.userId, users.id))
    .where(eq(challengeMembers.challengeId, id));

  const now = new Date();

  const memberIds = members.map((m) => m.userId);

  const [leaderboard, allTimeTotals, challengeBooks, recentSessions] = await Promise.all([
    Promise.all(
      members.map(async (m) => {
        const { weekStart } = getRollingWeek(m.joinedAt, now);
        const [creditSum] = await db
          .select({ total: sum(challengeSessionCredits.pagesCredited) })
          .from(challengeSessionCredits)
          .where(
            and(
              eq(challengeSessionCredits.challengeId, id),
              eq(challengeSessionCredits.userId, m.userId),
              eq(
                challengeSessionCredits.weekStart,
                weekStart.toISOString().split("T")[0]
              )
            )
          );

        const pagesThisWeek = Number(creditSum?.total ?? 0);
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
      })
    ),

    db
      .select({
        userId: challengeSessionCredits.userId,
        total: sum(challengeSessionCredits.pagesCredited),
      })
      .from(challengeSessionCredits)
      .where(eq(challengeSessionCredits.challengeId, id))
      .groupBy(challengeSessionCredits.userId),

    db
      .selectDistinct({
        userId: readingSessions.userId,
        bookId: books.id,
        title: books.title,
        coverUrl: books.coverUrl,
        finished: books.finished,
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

    memberIds.length > 0
      ? db
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
          .innerJoin(
            challengeSessionCredits,
            and(
              eq(challengeSessionCredits.sessionId, readingSessions.id),
              eq(challengeSessionCredits.challengeId, id)
            )
          )
          .orderBy(desc(readingSessions.loggedAt))
          .limit(20)
      : Promise.resolve([]),
  ]);

  const allTimePagesMap = Object.fromEntries(
    allTimeTotals.map((r) => [r.userId, Number(r.total ?? 0)])
  );

  const booksByMember: Record<string, typeof challengeBooks> = {};
  for (const b of challengeBooks) {
    if (!booksByMember[b.userId]) booksByMember[b.userId] = [];
    booksByMember[b.userId].push(b);
  }

  const isCreator = challenge.creatorId === userId;
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/join/${challenge.inviteToken}`;

  const sessionIds = recentSessions.map((s) => s.id);
  const allReactions = sessionIds.length > 0
    ? await db.select().from(feedReactions).where(inArray(feedReactions.sessionId, sessionIds))
    : [];
  const reactionsBySession: Record<string, Record<string, number>> = {};
  const myReactionBySession: Record<string, string | null> = {};
  for (const r of allReactions) {
    if (!reactionsBySession[r.sessionId]) reactionsBySession[r.sessionId] = {};
    reactionsBySession[r.sessionId][r.emoji] = (reactionsBySession[r.sessionId][r.emoji] ?? 0) + 1;
    if (r.userId === userId) myReactionBySession[r.sessionId] = r.emoji;
  }

  const sortedLeaderboard = leaderboard.sort(
    (a, b) => b.pages_this_week - a.pages_this_week
  );
  const allTimeSorted = [...members].sort(
    (a, b) =>
      (allTimePagesMap[b.userId] ?? 0) - (allTimePagesMap[a.userId] ?? 0)
  );

  const myEntry = sortedLeaderboard.find((e) => e.user_id === userId);
  const pct =
    myEntry && myEntry.weekly_goal > 0
      ? Math.min(
          100,
          Math.round((myEntry.pages_this_week / myEntry.weekly_goal) * 100)
        )
      : 0;

  return (
    <div className="flex flex-col">
      <ScrollToTop />
      {/* ── Dark espresso header ── */}
      <div
        className="relative px-5"
        style={{ backgroundColor: "#3b2412", paddingBottom: "52px", paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)" }}
      >
        {/* Back row */}
        <div className="flex items-center justify-between mb-5">
          <Link
            href="/"
            className="flex items-center gap-1"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            <ChevronLeft size={18} />
            <span
              className="text-[13px]"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              Back
            </span>
          </Link>
          {isCreator && (
            <Link href={`/challenges/${id}/settings`}>
              <Settings size={20} style={{ color: "rgba(255,255,255,0.6)" }} />
            </Link>
          )}
        </div>

        {/* Challenge title */}
        <h1
          className="font-serif font-semibold leading-tight"
          style={{ fontSize: 28, color: "#ffffff" }}
        >
          {challenge.name}
        </h1>

        {/* Metadata row */}
        <div
          className="flex items-center gap-3 mt-2"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          <span className="text-[13px] font-bold" style={{ color: "#c8913a" }}>
            {challenge.penaltyCurrency}
            {Number(challenge.penaltyAmount)}/pg
          </span>
          <span
            className="text-[13px]"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            {members.length} readers
          </span>
          <span
            className="text-[13px]"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            {challenge.weeklyGoal} pg/week goal
          </span>
        </div>
      </div>

      {/* ── Ivory panel ── */}
      <div
        className="flex flex-col gap-5 px-5 pt-6 flex-1"
        style={{
          backgroundColor: "#fdf5e6",
          borderRadius: "28px 28px 0 0",
          marginTop: -28,
        }}
      >
        {/* Your progress card */}
        {myEntry && (
          <div>
            <p
              className="text-[10px] font-semibold uppercase mb-3"
              style={{
                letterSpacing: "0.1em",
                color: "#9c826a",
                fontFamily: "var(--font-inter)",
              }}
            >
              Your Progress This Week
            </p>
            <div
              className="rounded-[4px] p-4"
              style={{
                backgroundColor: "#fefaf2",
                boxShadow: "0 4px 20px rgba(59,36,18,0.09)",
              }}
            >
              <div className="flex items-end justify-between mb-3">
                <div className="flex items-baseline gap-2">
                  <span
                    className="font-serif font-semibold"
                    style={{ fontSize: 38, color: "#3b2412", lineHeight: 1 }}
                  >
                    {myEntry.pages_this_week}
                  </span>
                  <span
                    className="text-[15px]"
                    style={{ color: "#5a3e28", fontFamily: "var(--font-inter)" }}
                  >
                    / {myEntry.weekly_goal} pg
                  </span>
                </div>
                <span
                  className="text-sm font-bold"
                  style={{ color: "#7a4a1e", fontFamily: "var(--font-inter)" }}
                >
                  {pct}%
                </span>
              </div>
              <div
                className="rounded-full overflow-hidden mb-3"
                style={{ height: 8, backgroundColor: "#dfd0b8" }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    backgroundColor: "#c8913a",
                    borderRadius: "inherit",
                  }}
                />
              </div>
              {myEntry.pages_this_week < myEntry.weekly_goal && (
                <p
                  className="text-xs"
                  style={{ color: "#5a3e28", fontFamily: "var(--font-inter)" }}
                >
                  Need{" "}
                  {myEntry.weekly_goal - myEntry.pages_this_week} more pages
                </p>
              )}
            </div>
          </div>
        )}

        {challenge.description && (
          <p
            className="text-sm leading-relaxed"
            style={{
              color: "var(--text-secondary)",
              fontFamily: "var(--font-inter)",
            }}
          >
            {challenge.description}
          </p>
        )}

        {/* This week leaderboard */}
        <div>
          <p
            className="text-[10px] font-semibold uppercase mb-3"
            style={{
              letterSpacing: "0.1em",
              color: "#9c826a",
              fontFamily: "var(--font-inter)",
            }}
          >
            Group Standings
          </p>
          <Leaderboard
            entries={sortedLeaderboard}
            penaltyCurrency={challenge.penaltyCurrency}
            currentUserId={userId}
          />
        </div>

        {/* All-time stats */}
        <div>
          <p
            className="text-[10px] font-semibold uppercase mb-3"
            style={{
              letterSpacing: "0.1em",
              color: "#9c826a",
              fontFamily: "var(--font-inter)",
            }}
          >
            All-time
          </p>
          <div
            className="rounded-[4px] overflow-hidden"
            style={{ border: "1px solid var(--border-default)" }}
          >
            {allTimeSorted.map((m, i) => {
              const total = allTimePagesMap[m.userId] ?? 0;
              const daysSinceJoined = Math.max(
                1,
                Math.ceil(
                  (now.getTime() - m.joinedAt.getTime()) / 86400000
                )
              );
              const avgDaily =
                total > 0 ? Math.round(total / daysSinceJoined) : 0;
              const isMe = m.userId === userId;

              return (
                <div
                  key={m.userId}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{
                    backgroundColor: isMe ? "var(--cream)" : "var(--old-lace)",
                    borderTop:
                      i === 0
                        ? "none"
                        : isMe
                        ? "2px solid #c8913a"
                        : "1px solid var(--border-default)",
                    borderLeft: isMe ? "3px solid #c8913a" : "none",
                  }}
                >
                  <span
                    className="text-sm tabular-nums w-5 text-center shrink-0"
                    style={{
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    {i + 1}
                  </span>
                  {m.avatarUrl ? (
                    <img
                      src={m.avatarUrl}
                      alt={m.displayName ?? ""}
                      className="w-7 h-7 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                      style={{
                        backgroundColor: "#e4d8c4",
                        color: "var(--text-muted)",
                      }}
                    >
                      {m.displayName?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm truncate"
                      style={{
                        color: isMe ? "var(--espresso)" : "var(--text-primary)",
                        fontWeight: isMe ? 700 : 500,
                        fontFamily: "var(--font-inter)",
                      }}
                    >
                      {m.displayName?.split(" ")[0]}
                      {isMe ? " (you)" : ""}
                    </p>
                    <p
                      className="text-[11px]"
                      style={{
                        color: "var(--text-muted)",
                        fontFamily: "var(--font-inter)",
                      }}
                    >
                      {avgDaily} pg/day avg
                    </p>
                  </div>
                  <span
                    className="text-sm font-semibold tabular-nums"
                    style={{
                      color: isMe ? "var(--espresso)" : "var(--text-primary)",
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    {total.toLocaleString()}
                  </span>
                  <span
                    className="text-[11px]"
                    style={{
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    pg
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bookshelves */}
        {Object.keys(booksByMember).length > 0 && (
          <div>
            <p
              className="text-[10px] font-semibold uppercase mb-3"
              style={{
                letterSpacing: "0.1em",
                color: "#9c826a",
                fontFamily: "var(--font-inter)",
              }}
            >
              Bookshelves
            </p>
            <div className="flex flex-col gap-4">
              {members.map((m) => {
                const memberBooks = booksByMember[m.userId];
                if (!memberBooks?.length) return null;
                const readingBooks = memberBooks.filter((b) => !b.finished);
                const finishedBooks = memberBooks.filter((b) => b.finished);
                const isMe = m.userId === userId;

                return (
                  <div key={m.userId}>
                    <div className="flex items-center gap-2 mb-2">
                      {m.avatarUrl ? (
                        <img
                          src={m.avatarUrl}
                          alt={m.displayName ?? ""}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold"
                          style={{
                            backgroundColor: "#e4d8c4",
                            color: "var(--text-muted)",
                          }}
                        >
                          {m.displayName?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <p
                        className="text-xs font-medium"
                        style={{
                          color: "var(--text-secondary)",
                          fontFamily: "var(--font-inter)",
                        }}
                      >
                        {m.displayName?.split(" ")[0]}
                        {isMe ? " (you)" : ""}
                      </p>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {readingBooks.map((b) => (
                        <BookCover
                          key={b.bookId}
                          title={b.title}
                          coverUrl={b.coverUrl}
                        />
                      ))}
                      {finishedBooks.map((b) => (
                        <BookCover
                          key={b.bookId}
                          title={b.title}
                          coverUrl={b.coverUrl}
                          faded
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {challenge.inviteActive && (
          <div>
            <p
              className="text-[10px] font-semibold uppercase mb-2"
              style={{
                letterSpacing: "0.1em",
                color: "#9c826a",
                fontFamily: "var(--font-inter)",
              }}
            >
              Invite link
            </p>
            <InviteLinkCopy url={inviteUrl} />
          </div>
        )}

        {/* Activity feed */}
        {recentSessions.length > 0 && (
          <div>
            <p
              className="text-[10px] font-semibold uppercase mb-3"
              style={{
                letterSpacing: "0.1em",
                color: "#9c826a",
                fontFamily: "var(--font-inter)",
              }}
            >
              Recent Activity
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
                  pagesRead={s.pagesRead}
                  loggedAt={s.loggedAt.toISOString()}
                  reactions={reactionsBySession[s.id] ?? {}}
                  myReaction={myReactionBySession[s.id] ?? null}
                  currentUserId={userId}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BookCover({
  title,
  coverUrl,
  faded,
}: {
  title: string;
  coverUrl: string | null;
  faded?: boolean;
}) {
  return (
    <div className="shrink-0 w-12" style={{ opacity: faded ? 0.5 : 1 }}>
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={title}
          className="w-12 rounded-[4px] object-cover shadow-sm"
          style={{ aspectRatio: "2/3" }}
        />
      ) : (
        <div
          className="w-12 rounded-[4px]"
          style={{ aspectRatio: "2/3", backgroundColor: "var(--espresso)" }}
        />
      )}
    </div>
  );
}
