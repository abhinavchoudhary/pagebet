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
import { ChallengeCard } from "@/components/challenge-card";
import { HomeLogButton } from "@/components/home-log-button";
import { getRollingWeek } from "@/lib/rolling-week";
import { computePenalty } from "@/lib/penalty";

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

  const pct =
    weekSummary.goal > 0
      ? Math.min(100, Math.round((weekSummary.pages / weekSummary.goal) * 100))
      : 0;

  const validLeaderboards = leaderboards.filter(Boolean);
  const firstLb = validLeaderboards[0];

  const showStickyNote =
    firstChallenge &&
    (weekSummary.penalty > 0 || weekSummary.daysRemaining <= 4);

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Dark espresso header ── */}
      <div
        className="relative px-5 pt-5"
        style={{ backgroundColor: "#3b2412", paddingBottom: "60px" }}
      >
        {/* Greeting + avatar */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p
              className="text-xs"
              style={{
                color: "rgba(255,255,255,0.5)",
                fontFamily: "var(--font-inter)",
              }}
            >
              {greeting}
            </p>
            <h1
              className="font-serif font-semibold leading-none mt-0.5"
              style={{ color: "#ffffff", fontSize: "30px", letterSpacing: "-0.01em" }}
            >
              {firstName}
            </h1>
          </div>
          <div
            className="flex items-center justify-center font-semibold text-base"
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(200,145,58,0.2)",
              border: "2px solid rgba(200,145,58,0.45)",
              color: "#ffffff",
              fontFamily: "var(--font-inter)",
            }}
          >
            {userInitial}
          </div>
        </div>

        {/* Hero stat */}
        <p
          className="text-xs mb-1"
          style={{
            color: "rgba(255,255,255,0.5)",
            fontFamily: "var(--font-inter)",
          }}
        >
          This week you&apos;ve read
        </p>
        <p
          className="font-serif font-semibold leading-none"
          style={{
            fontSize: "68px",
            color: "#ffffff",
            letterSpacing: "-0.03em",
          }}
        >
          {weekSummary.pages}
        </p>
        <p
          className="text-base mt-1"
          style={{ color: "rgba(255,255,255,0.75)", fontFamily: "var(--font-inter)" }}
        >
          pages
        </p>
        {/* Amber underline */}
        <div
          style={{
            width: 52,
            height: 4,
            backgroundColor: "#c8913a",
            borderRadius: 2,
            marginTop: 6,
          }}
        />

        {/* Progress bar */}
        <div className="flex items-center gap-2 mt-4">
          <div
            className="flex-1 rounded-full overflow-hidden"
            style={{ height: 4, backgroundColor: "rgba(255,255,255,0.12)" }}
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
          <span
            className="text-[11px]"
            style={{
              color: "rgba(255,255,255,0.45)",
              fontFamily: "var(--font-inter)",
            }}
          >
            {pct}%
          </span>
        </div>
      </div>

      {/* ── Ivory panel ── */}
      <div
        className="relative flex flex-col gap-5 px-5 pt-6 flex-1"
        style={{
          backgroundColor: "#fdf5e6",
          borderRadius: "28px 28px 0 0",
          marginTop: -28,
        }}
      >
        {/* Sticky note */}
        {showStickyNote && (
          <div
            className="absolute"
            style={{
              top: -16,
              right: 20,
              backgroundColor: "#c8913a",
              padding: "10px 14px",
              transform: "rotate(1.8deg)",
              boxShadow: "3px 4px 0 rgba(59,36,18,0.14)",
            }}
          >
            <span
              className="text-[11px] font-bold"
              style={{ color: "#3b2412", fontFamily: "var(--font-inter)" }}
            >
              {weekSummary.penalty > 0
                ? `${weekSummary.currency}${weekSummary.penalty} · `
                : ""}
              {weekSummary.daysRemaining}{" "}
              {weekSummary.daysRemaining === 1 ? "day" : "days"} to go
            </span>
          </div>
        )}

        {/* Active Challenges section */}
        {validLeaderboards.length > 0 ? (
          <>
            <div>
              <p
                className="text-[10px] font-semibold uppercase mb-3"
                style={{
                  letterSpacing: "0.1em",
                  color: "#9c826a",
                  fontFamily: "var(--font-inter)",
                }}
              >
                Active Challenge
              </p>

              {firstLb && (
                <Link
                  href={`/challenges/${firstLb.id}`}
                  className="block rounded-[4px] p-4"
                  style={{
                    backgroundColor: "#fefaf2",
                    boxShadow: "0 2px 12px rgba(59,36,18,0.07)",
                  }}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p
                      className="font-serif font-semibold"
                      style={{ fontSize: 17, color: "#3b2412" }}
                    >
                      {firstLb.name}
                    </p>
                    {(() => {
                      const myRank =
                        firstLb.entries.findIndex((e) => e.user_id === userId) + 1;
                      return myRank > 0 ? (
                        <span
                          className="text-[11px] font-bold px-1.5 py-0.5 shrink-0"
                          style={{
                            backgroundColor: "#3b2412",
                            color: "#ffffff",
                            borderRadius: 2,
                            fontFamily: "var(--font-inter)",
                          }}
                        >
                          #{myRank}
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <p
                    className="text-[11px] mb-3"
                    style={{ color: "#5a3e28", fontFamily: "var(--font-inter)" }}
                  >
                    {firstLb.entries.length} reader
                    {firstLb.entries.length !== 1 ? "s" : ""}
                  </p>

                  {/* Mini leaderboard */}
                  <div className="flex flex-col gap-2">
                    {firstLb.entries.slice(0, 4).map((entry, i) => {
                      const p = Math.min(
                        1,
                        entry.pages_this_week / entry.weekly_goal
                      );
                      const isMe = entry.user_id === userId;
                      const isLeader = i === 0;
                      const barColor = isLeader
                        ? "#c8913a"
                        : isMe
                        ? "#7a4a1e"
                        : "#9c826a";

                      return (
                        <div key={entry.user_id} className="flex items-center gap-2">
                          <div
                            className="flex items-center justify-center shrink-0 text-[10px] font-semibold"
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: "50%",
                              backgroundColor: isMe
                                ? "rgba(200,145,58,0.18)"
                                : "#e4d8c4",
                              color: isMe ? "#c8913a" : "#9c826a",
                              fontFamily: "var(--font-inter)",
                            }}
                          >
                            {entry.display_name[0]?.toUpperCase()}
                          </div>
                          <div
                            className="flex-1 rounded-full overflow-hidden"
                            style={{ height: 5, backgroundColor: "#dfd0b8" }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${p * 100}%`,
                                backgroundColor: barColor,
                                borderRadius: "inherit",
                              }}
                            />
                          </div>
                          <span
                            className="text-[11px] tabular-nums w-8 text-right"
                            style={{
                              color: isMe ? "#3b2412" : "#9c826a",
                              fontWeight: isMe ? 600 : 400,
                              fontFamily: "var(--font-inter)",
                            }}
                          >
                            {entry.pages_this_week}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Link>
              )}

              {/* Additional challenge cards */}
              {validLeaderboards.length > 1 && (
                <div className="flex flex-col gap-3 mt-3">
                  {validLeaderboards.slice(1).map((c) => (
                    <ChallengeCard
                      key={c!.id}
                      id={c!.id}
                      name={c!.name}
                      members={c!.entries}
                      currentUserId={userId}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 py-12">
            <p
              className="font-serif text-lg text-center"
              style={{ color: "#5a3e28" }}
            >
              Start a reading challenge with friends
            </p>
            <Link
              href="/challenges/new"
              className="px-5 py-3 rounded-[4px] text-sm font-semibold text-white"
              style={{ backgroundColor: "#7a4a1e", fontFamily: "var(--font-inter)" }}
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
