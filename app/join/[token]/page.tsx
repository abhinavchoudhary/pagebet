import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { challenges, challengeMembers, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { JoinButton } from "@/components/join-button";
import { Card } from "@/components/ui/card";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const [challenge] = await db
    .select({
      id: challenges.id,
      name: challenges.name,
      description: challenges.description,
      dailyGoal: challenges.dailyGoal,
      weeklyGoal: challenges.weeklyGoal,
      penaltyAmount: challenges.penaltyAmount,
      penaltyCurrency: challenges.penaltyCurrency,
      carryOver: challenges.carryOver,
      inviteActive: challenges.inviteActive,
      creatorId: challenges.creatorId,
    })
    .from(challenges)
    .where(
      and(eq(challenges.inviteToken, token), eq(challenges.inviteActive, true))
    );

  if (!challenge) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-surface px-6 text-center">
        <p className="mb-4 text-4xl">🔒</p>
        <h1 className="mb-2 md-headline-small text-on-surface">Link not found</h1>
        <p className="md-body-medium text-on-surface-variant">
          This invite link may have expired or been disabled.
        </p>
      </div>
    );
  }

  const [creator] = await db
    .select({ name: users.name, image: users.image })
    .from(users)
    .where(eq(users.id, challenge.creatorId));

  const session = await auth();

  if (session?.user?.id) {
    const [existing] = await db
      .select()
      .from(challengeMembers)
      .where(
        and(
          eq(challengeMembers.challengeId, challenge.id),
          eq(challengeMembers.userId, session.user.id)
        )
      );
    if (existing) redirect(`/challenges/${challenge.id}`);
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-surface px-6 py-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="text-center">
          <span className="text-5xl">📖</span>
          <h1 className="mt-4 md-headline-large leading-tight text-on-surface">
            {challenge.name}
          </h1>
          {challenge.description && (
            <p className="mt-2 md-body-medium text-on-surface-variant">
              {challenge.description}
            </p>
          )}
        </div>

        <Card variant="outlined" className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-3">
            {creator?.image ? (
              <img
                src={creator.image}
                alt={creator.name ?? ""}
                className="size-10 rounded-corner-full object-cover"
              />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-corner-full bg-primary-container md-title-medium text-on-primary-container">
                {creator?.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="md-body-small text-on-surface-variant">Created by</p>
              <p className="md-body-large text-on-surface">{creator?.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t border-outline-variant pt-3">
            <StatBox label="Daily goal" value={`${challenge.dailyGoal} pg`} />
            <StatBox label="Weekly goal" value={`${challenge.weeklyGoal} pg`} />
            <StatBox
              label="Penalty"
              value={`${challenge.penaltyCurrency}${challenge.penaltyAmount}/pg`}
            />
          </div>

          {challenge.carryOver && (
            <p className="text-center md-body-small text-on-surface-variant">
              Surplus pages carry over to next week
            </p>
          )}
        </Card>

        <JoinButton
          challengeId={challenge.id}
          token={token}
          isLoggedIn={!!session?.user}
        />

        {!session?.user && (
          <p className="text-center md-body-small text-on-surface-variant">
            You&apos;ll be asked to sign in with Google first
          </p>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="md-body-small text-on-surface-variant">{label}</p>
      <p className="md-title-small text-on-surface">{value}</p>
    </div>
  );
}
