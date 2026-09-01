import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  challengeMembers,
  challenges,
  books,
  challengeSessionCredits,
  users,
} from "@/lib/db/schema";
import { eq, and, sum, inArray } from "drizzle-orm";
import { ChallengeCard } from "@/components/challenge-card";
import { HomeLogButton } from "@/components/home-log-button";
import { LinearProgress } from "@/components/ui/linear-progress";
import { CircularProgress } from "@/components/ui/circular-progress";
import { getRollingWeek } from "@/lib/rolling-week";
import { computePenalty } from "@/lib/penalty";
import { bookProgress } from "@/lib/book-progress";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const now = new Date();

  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = session.user?.name?.split(" ")[0] ?? "Reader";
  const userInitial = session.user?.name?.[0]?.toUpperCase() ?? "?";

  const [myBooks, memberships] = await Promise.all([
    db
      .select()
      .from(books)
      .where(and(eq(books.userId, userId), eq(books.finished, false)))
      .orderBy(books.addedAt),
    db
      .select({
        challengeId: challengeMembers.challengeId,
        joinedAt: challengeMembers.joinedAt,
      })
      .from(challengeMembers)
      .where(eq(challengeMembers.userId, userId)),
  ]);

  const challengeIds = memberships.map((m) => m.challengeId);

  const [activeChallenges, allMembers, allCredits] =
    challengeIds.length > 0
      ? await Promise.all([
          db
            .select()
            .from(challenges)
            .where(
              and(
                inArray(challenges.id, challengeIds),
                eq(challenges.archived, false)
              )
            ),
          db
            .select({
              challengeId: challengeMembers.challengeId,
              userId: challengeMembers.userId,
              displayName: users.name,
              avatarUrl: users.image,
              joinedAt: challengeMembers.joinedAt,
            })
            .from(challengeMembers)
            .innerJoin(users, eq(challengeMembers.userId, users.id))
            .where(inArray(challengeMembers.challengeId, challengeIds)),
          db
            .select({
              challengeId: challengeSessionCredits.challengeId,
              userId: challengeSessionCredits.userId,
              weekStart: challengeSessionCredits.weekStart,
              total: sum(challengeSessionCredits.pagesCredited),
            })
            .from(challengeSessionCredits)
            .where(inArray(challengeSessionCredits.challengeId, challengeIds))
            .groupBy(
              challengeSessionCredits.challengeId,
              challengeSessionCredits.userId,
              challengeSessionCredits.weekStart
            ),
        ])
      : ([[], [], []] as const);

  const firstMembership = memberships[0];
  const firstChallenge = firstMembership
    ? activeChallenges.find((c) => c.id === firstMembership.challengeId)
    : null;

  let weekSummary = {
    pages: 0,
    goal: 35,
    penalty: 0,
    daysRemaining: 7,
    currency: "₹",
  };

  if (firstChallenge && firstMembership) {
    const { weekStart, daysRemaining } = getRollingWeek(
      firstMembership.joinedAt,
      now
    );
    const weekStartStr = weekStart.toISOString().split("T")[0];
    const myWeekRow = allCredits.find(
      (c) =>
        c.challengeId === firstChallenge.id &&
        c.userId === userId &&
        c.weekStart === weekStartStr
    );
    const pagesThisWeek = Number(myWeekRow?.total ?? 0);
    const { penaltyExposure } = computePenalty({
      weeklyGoal: firstChallenge.weeklyGoal,
      pagesThisWeek,
      penaltyAmount: Number(firstChallenge.penaltyAmount),
      carryOver: firstChallenge.carryOver,
    });
    weekSummary = {
      pages: pagesThisWeek,
      goal: firstChallenge.weeklyGoal,
      penalty: penaltyExposure,
      daysRemaining,
      currency: firstChallenge.penaltyCurrency,
    };
  }

  const leaderboards = activeChallenges.slice(0, 3).map((challenge) => {
    const membership = memberships.find((m) => m.challengeId === challenge.id);
    if (!membership) return null;
    const members = allMembers.filter((m) => m.challengeId === challenge.id);
    const challengeCredits = allCredits.filter(
      (c) => c.challengeId === challenge.id
    );

    const entries = members.map((m) => {
      const { weekStart } = getRollingWeek(m.joinedAt, now);
      const weekStartStr = weekStart.toISOString().split("T")[0];
      const weekRow = challengeCredits.find(
        (c) => c.userId === m.userId && c.weekStart === weekStartStr
      );
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
        penalty_currency: challenge.penaltyCurrency,
      };
    });

    return {
      id: challenge.id,
      name: challenge.name,
      entries: entries.sort((a, b) => b.pages_this_week - a.pages_this_week),
    };
  });

  const pct =
    weekSummary.goal > 0
      ? Math.min(1, weekSummary.pages / weekSummary.goal)
      : 0;

  const validLeaderboards = leaderboards.filter(
    (l): l is NonNullable<typeof l> => Boolean(l)
  );

  const readingNow = myBooks
    .map((b) => ({
      book: b,
      progress: bookProgress({
        currentPage: b.currentPage,
        totalPages: b.totalPages,
        finished: b.finished,
      }),
    }))
    .filter((x) => x.progress.state !== "not-started")
    .slice(0, 6);

  const showChip =
    !!firstChallenge &&
    (weekSummary.penalty > 0 || weekSummary.daysRemaining <= 4);

  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section
        className="rounded-b-[28px] bg-surface-container-highest px-5 pb-7"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)" }}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="md-label-medium text-on-surface-variant">{greeting}</p>
            <h1 className="md-headline-medium text-on-surface">{firstName}</h1>
          </div>
          <Link
            href="/profile"
            className="flex size-11 items-center justify-center rounded-corner-full bg-primary-container md-title-medium text-on-primary-container"
          >
            {userInitial}
          </Link>
        </div>

        <p className="md-label-medium text-on-surface-variant">
          This week you&apos;ve read
        </p>
        <div className="flex items-end gap-3">
          <p className="md-display-large text-on-surface">{weekSummary.pages}</p>
          <p className="pb-2 md-body-large text-on-surface-variant">
            / {weekSummary.goal} pages
          </p>
        </div>

        <div className="mt-3">
          <LinearProgress value={pct} thickness={8} />
        </div>

        {showChip && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-corner-sm border border-outline px-3 py-1.5">
            <span className="md-label-large text-on-surface">
              {weekSummary.penalty > 0 &&
                `${weekSummary.currency}${weekSummary.penalty} at risk · `}
              {weekSummary.daysRemaining}{" "}
              {weekSummary.daysRemaining === 1 ? "day" : "days"} left
            </span>
          </div>
        )}
      </section>

      <div className="flex flex-col gap-8 px-5 py-6">
        {/* ── Reading now ── */}
        {readingNow.length > 0 && (
          <section>
            <p className="mb-3 md-label-medium text-on-surface-variant">
              Reading now
            </p>
            <div className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-1">
              {readingNow.map(({ book, progress }) => (
                <Link
                  key={book.id}
                  href={`/library/${book.id}`}
                  className="flex w-16 shrink-0 flex-col items-center gap-2"
                >
                  <div className="relative">
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-16 rounded-corner-xs object-cover md-elevation-1"
                        style={{ aspectRatio: "2 / 3" }}
                      />
                    ) : (
                      <div
                        className="w-16 rounded-corner-xs bg-primary-container"
                        style={{ aspectRatio: "2 / 3" }}
                      />
                    )}
                  </div>
                  {progress.unknownTotal ? (
                    <span className="md-label-small text-on-surface-variant">
                      p.{progress.currentPage}
                    </span>
                  ) : (
                    <CircularProgress
                      value={progress.fraction}
                      size={30}
                      thickness={4}
                    >
                      <span className="text-[9px] font-semibold text-on-surface">
                        {progress.pct}
                      </span>
                    </CircularProgress>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Challenges ── */}
        {validLeaderboards.length > 0 ? (
          <section>
            <p className="mb-3 md-label-medium text-on-surface-variant">
              {validLeaderboards.length > 1
                ? "Your challenges"
                : "Active challenge"}
            </p>
            <div className="flex flex-col gap-3">
              {validLeaderboards.map((c) => (
                <ChallengeCard
                  key={c.id}
                  id={c.id}
                  name={c.name}
                  members={c.entries}
                  currentUserId={userId}
                />
              ))}
            </div>
          </section>
        ) : (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="md-title-large text-on-surface-variant">
              Start a reading challenge with friends
            </p>
            <Link
              href="/challenges/new"
              className="md-state-layer rounded-corner-full bg-primary px-6 py-3 md-label-large text-on-primary"
            >
              Create a challenge
            </Link>
          </div>
        )}
      </div>

      <HomeLogButton books={myBooks} userId={userId} />
    </div>
  );
}
