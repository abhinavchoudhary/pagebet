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
} from "@/lib/db/schema";
import { eq, and, sum } from "drizzle-orm";
import { Leaderboard } from "@/components/leaderboard";
import { InviteLinkCopy } from "@/components/invite-link-copy";
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

  const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id));
  if (!challenge) notFound();

  const [membership] = await db
    .select({ joinedAt: challengeMembers.joinedAt })
    .from(challengeMembers)
    .where(and(eq(challengeMembers.challengeId, id), eq(challengeMembers.userId, userId)));

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

  // This week leaderboard + all-time totals in parallel
  const [leaderboard, allTimeTotals, challengeBooks] = await Promise.all([
    Promise.all(
      members.map(async (m) => {
        const { weekStart } = getRollingWeek(m.joinedAt, now);
        const [creditSum] = await db
          .select({ total: sum(challengeSessionCredits.pagesCredited) })
          .from(challengeSessionCredits)
          .where(and(
            eq(challengeSessionCredits.challengeId, id),
            eq(challengeSessionCredits.userId, m.userId),
            eq(challengeSessionCredits.weekStart, weekStart.toISOString().split("T")[0])
          ));

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
  ]);

  // Build lookup maps
  const allTimePagesMap = Object.fromEntries(allTimeTotals.map((r) => [r.userId, Number(r.total ?? 0)]));

  const booksByMember: Record<string, typeof challengeBooks> = {};
  for (const b of challengeBooks) {
    if (!booksByMember[b.userId]) booksByMember[b.userId] = [];
    booksByMember[b.userId].push(b);
  }

  const isCreator = challenge.creatorId === userId;
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/join/${challenge.inviteToken}`;

  const sortedLeaderboard = leaderboard.sort((a, b) => b.pages_this_week - a.pages_this_week);
  const allTimeSorted = [...members].sort(
    (a, b) => (allTimePagesMap[b.userId] ?? 0) - (allTimePagesMap[a.userId] ?? 0)
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/"><ChevronLeft size={20} style={{ color: "var(--text-secondary)" }} /></Link>
          <h1 className="font-serif text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            {challenge.name}
          </h1>
        </div>
        {isCreator && (
          <Link href={`/challenges/${id}/settings`}>
            <Settings size={20} style={{ color: "var(--text-muted)" }} />
          </Link>
        )}
      </div>

      {challenge.description && (
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {challenge.description}
        </p>
      )}

      <div className="grid grid-cols-3 gap-3 p-4 rounded-[12px]"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
        <Stat label="Daily goal" value={`${challenge.dailyGoal} pg`} />
        <Stat label="Weekly goal" value={`${challenge.weeklyGoal} pg`} />
        <Stat label="Penalty" value={`${challenge.penaltyCurrency}${challenge.penaltyAmount}/pg`} />
      </div>

      {/* This week */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
          This week
        </p>
        <Leaderboard entries={sortedLeaderboard} penaltyCurrency={challenge.penaltyCurrency} currentUserId={userId} />
      </div>

      {/* All-time stats */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
          All-time
        </p>
        <div className="flex flex-col gap-2">
          {allTimeSorted.map((m, i) => {
            const total = allTimePagesMap[m.userId] ?? 0;
            const daysSinceJoined = Math.max(1, Math.ceil((now.getTime() - m.joinedAt.getTime()) / 86400000));
            const avgDaily = total > 0 ? Math.round(total / daysSinceJoined) : 0;
            const isMe = m.userId === userId;

            return (
              <div key={m.userId} className="flex items-center gap-3 p-3 rounded-[12px]"
                style={{
                  backgroundColor: isMe ? "var(--app-accent-light)" : "var(--bg-card)",
                  border: `1px solid ${isMe ? "var(--app-accent)" : "var(--border-default)"}`,
                }}>
                <span className="text-sm font-medium w-5 text-center tabular-nums" style={{ color: "var(--text-muted)" }}>
                  {i + 1}
                </span>
                {m.avatarUrl ? (
                  <img src={m.avatarUrl} alt={m.displayName ?? ""} className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                    style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                    {m.displayName?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {m.displayName?.split(" ")[0]}{isMe ? " (you)" : ""}
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{avgDaily} pg/day avg</p>
                </div>
                <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                  {total.toLocaleString()}
                </span>
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>pg</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bookshelves */}
      {Object.keys(booksByMember).length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
            Bookshelves
          </p>
          <div className="flex flex-col gap-4">
            {members.map((m) => {
              const memberBooks = booksByMember[m.userId];
              if (!memberBooks?.length) return null;
              const reading = memberBooks.filter((b) => !b.finished);
              const finished = memberBooks.filter((b) => b.finished);
              const isMe = m.userId === userId;

              return (
                <div key={m.userId}>
                  <div className="flex items-center gap-2 mb-2">
                    {m.avatarUrl ? (
                      <img src={m.avatarUrl} alt={m.displayName ?? ""} className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold"
                        style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                        {m.displayName?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                      {m.displayName?.split(" ")[0]}{isMe ? " (you)" : ""}
                    </p>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {reading.map((b) => (
                      <BookCover key={b.bookId} title={b.title} coverUrl={b.coverUrl} />
                    ))}
                    {finished.map((b) => (
                      <BookCover key={b.bookId} title={b.title} coverUrl={b.coverUrl} faded />
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
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
            Invite link
          </p>
          <InviteLinkCopy url={inviteUrl} />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{value}</p>
    </div>
  );
}

function BookCover({ title, coverUrl, faded }: { title: string; coverUrl: string | null; faded?: boolean }) {
  return (
    <div className="shrink-0 w-12" style={{ opacity: faded ? 0.5 : 1 }}>
      {coverUrl ? (
        <img src={coverUrl} alt={title} className="w-12 rounded-[6px] object-cover shadow-sm" style={{ aspectRatio: "2/3" }} />
      ) : (
        <div className="w-12 rounded-[6px] flex items-center justify-center"
          style={{ aspectRatio: "2/3", backgroundColor: "var(--app-accent-light)" }}>
          <span className="text-base">📖</span>
        </div>
      )}
    </div>
  );
}
