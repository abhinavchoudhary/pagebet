import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { db } from "@/lib/db";
import { challengeMembers, challenges } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = session.user;

  const memberships = await db
    .select({
      challengeId: challengeMembers.challengeId,
      name: challenges.name,
      weeklyGoal: challenges.weeklyGoal,
      penaltyAmount: challenges.penaltyAmount,
      penaltyCurrency: challenges.penaltyCurrency,
    })
    .from(challengeMembers)
    .innerJoin(challenges, eq(challengeMembers.challengeId, challenges.id))
    .where(eq(challengeMembers.userId, user.id));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Profile
        </h1>
        <form action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}>
          <button type="submit"
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-[8px]"
            style={{ color: "var(--text-muted)", backgroundColor: "var(--bg-subtle)" }}>
            <LogOut size={16} /> Sign out
          </button>
        </form>
      </div>

      <div
        className="flex items-center gap-4 p-5 rounded-[16px]"
        style={{ backgroundColor: "var(--bg-card)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-default)" }}
      >
        {user.image ? (
          <img src={user.image} alt={user.name ?? ""} className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-semibold"
            style={{ backgroundColor: "var(--app-accent-light)", color: "var(--app-accent)" }}>
            {user.name?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div>
          <p className="font-serif text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            {user.name}
          </p>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {memberships.length} challenge{memberships.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
          My challenges
        </p>
        <div className="flex flex-col gap-2">
          {memberships.map((m) => (
            <Link key={m.challengeId} href={`/challenges/${m.challengeId}`}
              className="flex items-center justify-between p-4 rounded-[12px]"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{m.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {m.weeklyGoal} pages/week · {m.penaltyCurrency}{Number(m.penaltyAmount)}/page
                </p>
              </div>
              <span style={{ color: "var(--text-muted)" }}>›</span>
            </Link>
          ))}

          <Link href="/challenges/new"
            className="flex items-center justify-center p-4 rounded-[12px] text-sm font-medium"
            style={{ border: "1px dashed var(--border-strong)", color: "var(--text-muted)" }}>
            + Create a challenge
          </Link>
        </div>
      </div>
    </div>
  );
}
