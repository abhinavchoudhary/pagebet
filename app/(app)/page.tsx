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
import { eq, and, sum } from "drizzle-orm";
import { PageStrip } from "@/components/page-strip";
import { ChallengeCard } from "@/components/challenge-card";
import { HomeLogButton } from "@/components/home-log-button";
import { getRollingWeek } from "@/lib/rolling-week";
import { computePenalty } from "@/lib/penalty";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const now = new Date();

  const [myBooks, memberships] = await Promise.all([
    db
      .select()
      .from(books)
      .where(and(eq(books.userId, userId), eq(books.finished, false)))
      .orderBy(books.addedAt),
    db
      .select({ challengeId: challengeMembers.challengeId, joinedAt: challengeMembers.joinedAt })
      .from(challengeMembers)
      .where(eq(challengeMembers.userId, userId)),
  ]);

  const challengeIds = memberships.map((m) => m.challengeId);

  const myChallenges =
    challengeIds.length > 0
      ? await db
          .select()
          .from(challenges)
          .where(eq(challenges.archived, false))
      : [];

  const activeChallenges = myChallenges.filter((c) =>
    challengeIds.includes(c.id)
  );

  const firstMembership = memberships[0];
  const firstChallenge = firstMembership
    ? activeChallenges.find((c) => c.id === firstMembership.challengeId)
    : null;

  let weekSummary = { pages: 0, goal: 35, penalty: 0, daysRemaining: 7, currency: "₹" };

  if (firstChallenge && firstMembership) {
    const { weekStart, daysRemaining } = getRollingWeek(firstMembership.joinedAt, now);
    const weekStartStr = weekStart.toISOString().split("T")[0];

    const [creditSum] = await db
      .select({ total: sum(challengeSessionCredits.pagesCredited) })
      .from(challengeSessionCredits)
      .where(
        and(
          eq(challengeSessionCredits.challengeId, firstChallenge.id),
          eq(challengeSessionCredits.userId, userId),
          eq(challengeSessionCredits.weekStart, weekStartStr)
        )
      );

    const pagesThisWeek = Number(creditSum?.total ?? 0);
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

  const leaderboards = await Promise.all(
    activeChallenges.slice(0, 3).map(async (challenge) => {
      const membership = memberships.find((m) => m.challengeId === challenge.id);
      if (!membership) return null;

      const members = await db
        .select({
          userId: challengeMembers.userId,
          displayName: users.name,
          avatarUrl: users.image,
          joinedAt: challengeMembers.joinedAt,
        })
        .from(challengeMembers)
        .innerJoin(users, eq(challengeMembers.userId, users.id))
        .where(eq(challengeMembers.challengeId, challenge.id));

      const entries = await Promise.all(
        members.map(async (m) => {
          const { weekStart } = getRollingWeek(m.joinedAt, now);
          const [creditSum] = await db
            .select({ total: sum(challengeSessionCredits.pagesCredited) })
            .from(challengeSessionCredits)
            .where(
              and(
                eq(challengeSessionCredits.challengeId, challenge.id),
                eq(challengeSessionCredits.userId, m.userId),
                eq(challengeSessionCredits.weekStart, weekStart.toISOString().split("T")[0])
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
            penalty_currency: challenge.penaltyCurrency,
          };
        })
      );

      return {
        id: challenge.id,
        name: challenge.name,
        entries: entries.sort((a, b) => b.pages_this_week - a.pages_this_week),
      };
    })
  );

  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = now.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const activeBooks = myBooks.slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          {dayName}, {dateStr}
        </p>
        <h1 className="font-serif text-2xl font-semibold italic mt-0.5" style={{ color: "var(--text-primary)" }}>
          Your reading corner
        </h1>
      </div>

      <div
        className="rounded-[16px] p-5"
        style={{
          backgroundColor: "var(--bg-card)",
          boxShadow: "var(--shadow-card)",
          border: "1px solid var(--border-default)",
        }}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p
              className="font-serif font-semibold leading-none"
              style={{ fontSize: "64px", color: "var(--text-primary)", lineHeight: 1 }}
            >
              {weekSummary.pages}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              pages read this week
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 pt-1">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              of {weekSummary.goal} pg
            </p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {weekSummary.daysRemaining} days left
            </p>
            {weekSummary.penalty > 0 && (
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "var(--penalty-bg)", color: "var(--penalty)" }}
              >
                {weekSummary.currency}{weekSummary.penalty} risk
              </span>
            )}
          </div>
        </div>

        <PageStrip
          pagesRead={weekSummary.pages}
          weeklyGoal={weekSummary.goal}
          completed={weekSummary.pages >= weekSummary.goal}
        />
      </div>

      {activeBooks.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
            Reading now
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {activeBooks.map((book) => (
              <Link
                key={book.id}
                href="/library"
                className="flex items-center gap-2 px-3 py-2 rounded-full shrink-0 text-sm"
                style={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-secondary)",
                }}
              >
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt={book.title} className="w-5 h-7 object-cover rounded" />
                ) : (
                  <span>📗</span>
                )}
                <span className="line-clamp-1 max-w-[120px]">{book.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {leaderboards.filter(Boolean).length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
            My challenges
          </p>
          <div className="flex flex-col gap-3">
            {leaderboards.filter(Boolean).map((c) => (
              <ChallengeCard key={c!.id} id={c!.id} name={c!.name} members={c!.entries} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-10">
          <span className="text-4xl">📚</span>
          <p className="font-serif text-lg text-center" style={{ color: "var(--text-secondary)" }}>
            Start a challenge with friends
          </p>
          <Link
            href="/challenges/new"
            className="px-5 py-2.5 rounded-[10px] text-sm font-medium text-white"
            style={{ backgroundColor: "var(--app-accent)" }}
          >
            Create a challenge
          </Link>
        </div>
      )}

      <HomeLogButton books={myBooks} userId={userId} />
    </div>
  );
}
