import { auth } from "@/auth";
import { db } from "@/lib/db";
import { challenges, challengeMembers, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

  const [challenge] = await db
    .select()
    .from(challenges)
    .where(eq(challenges.id, id));

  if (!challenge) return NextResponse.json({}, { status: 404 });

  const members = await db
    .select({
      userId: challengeMembers.userId,
      displayName: users.name,
      avatarUrl: users.image,
    })
    .from(challengeMembers)
    .innerJoin(users, eq(challengeMembers.userId, users.id))
    .where(eq(challengeMembers.challengeId, id));

  return NextResponse.json({
    name: challenge.name,
    description: challenge.description ?? "",
    dailyGoal: challenge.dailyGoal,
    penaltyAmount: Number(challenge.penaltyAmount),
    penaltyCurrency: challenge.penaltyCurrency,
    carryOver: challenge.carryOver,
    inviteActive: challenge.inviteActive,
    isCreator: challenge.creatorId === session.user.id,
    members: members.map((m) => ({
      userId: m.userId,
      displayName: m.displayName ?? "Reader",
      avatarUrl: m.avatarUrl ?? null,
    })),
    currentUserId: session.user.id,
  });
}
