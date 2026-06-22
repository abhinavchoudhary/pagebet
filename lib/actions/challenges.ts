"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { challenges, challengeMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(12)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createChallenge(data: {
  name: string;
  description: string;
  dailyGoal: number;
  penaltyAmount: number;
  penaltyCurrency: string;
  carryOver: boolean;
}): Promise<{ id: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  const [challenge] = await db
    .insert(challenges)
    .values({
      name: data.name,
      description: data.description || null,
      creatorId: userId,
      dailyGoal: data.dailyGoal,
      weeklyGoal: data.dailyGoal * 7,
      penaltyAmount: String(data.penaltyAmount),
      penaltyCurrency: data.penaltyCurrency,
      carryOver: data.carryOver,
      inviteToken: generateToken(),
    })
    .returning({ id: challenges.id });

  await db.insert(challengeMembers).values({
    challengeId: challenge.id,
    userId,
  });

  return { id: challenge.id };
}

export async function joinChallenge(challengeId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .insert(challengeMembers)
    .values({ challengeId, userId: session.user.id })
    .onConflictDoNothing();

  revalidatePath("/");
}

export async function updateChallenge(
  challengeId: string,
  data: {
    name: string;
    description: string;
    dailyGoal: number;
    penaltyAmount: number;
    penaltyCurrency: string;
    carryOver: boolean;
    inviteActive: boolean;
  }
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .update(challenges)
    .set({
      name: data.name,
      description: data.description || null,
      dailyGoal: data.dailyGoal,
      weeklyGoal: data.dailyGoal * 7,
      penaltyAmount: String(data.penaltyAmount),
      penaltyCurrency: data.penaltyCurrency,
      carryOver: data.carryOver,
      inviteActive: data.inviteActive,
    })
    .where(
      and(
        eq(challenges.id, challengeId),
        eq(challenges.creatorId, session.user.id)
      )
    );

  revalidatePath(`/challenges/${challengeId}`);
}

export async function regenerateInviteToken(challengeId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .update(challenges)
    .set({ inviteToken: generateToken() })
    .where(
      and(
        eq(challenges.id, challengeId),
        eq(challenges.creatorId, session.user.id)
      )
    );

  revalidatePath(`/challenges/${challengeId}/settings`);
}

export async function removeMember(challengeId: string, memberId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [c] = await db
    .select({ creatorId: challenges.creatorId })
    .from(challenges)
    .where(eq(challenges.id, challengeId));

  if (c?.creatorId !== session.user.id) throw new Error("Unauthorized");

  await db
    .delete(challengeMembers)
    .where(
      and(
        eq(challengeMembers.challengeId, challengeId),
        eq(challengeMembers.userId, memberId)
      )
    );
}

export async function archiveChallenge(challengeId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .update(challenges)
    .set({ archived: true })
    .where(
      and(
        eq(challenges.id, challengeId),
        eq(challenges.creatorId, session.user.id)
      )
    );

  redirect("/");
}
