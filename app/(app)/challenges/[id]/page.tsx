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

  const leaderboard = await Promise.all(
    members.map(async (m) => {
      const { weekStart } = getRollingWeek(m.joinedAt, now);
      const [creditSum] = await db
        .select({ total: sum(challengeSessionCredits.pagesCredited) })
        .from(challengeSessionCredits)
        .where(
          and(
            eq(challengeSessionCredits.challengeId, id),
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
      };
    })
  );

  const isCreator = challenge.creatorId === userId;
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/join/${challenge.inviteToken}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/">
            <ChevronLeft size={20} style={{ color: "var(--text-secondary)" }} />
          </Link>
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

      <div
        className="grid grid-cols-3 gap-3 p-4 rounded-[12px]"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-default)" }}
      >
        <Stat label="Daily goal" value={`${challenge.dailyGoal} pg`} />
        <Stat label="Weekly goal" value={`${challenge.weeklyGoal} pg`} />
        <Stat label="Penalty" value={`${challenge.penaltyCurrency}${challenge.penaltyAmount}/pg`} />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
          This week
        </p>
        <Leaderboard
          entries={leaderboard.sort((a, b) => b.pages_this_week - a.pages_this_week)}
          penaltyCurrency={challenge.penaltyCurrency}
          currentUserId={userId}
        />
      </div>

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
