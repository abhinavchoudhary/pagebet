import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { db } from "@/lib/db";
import {
  challengeMembers,
  challenges,
  readingSessions,
  books as booksSchema,
} from "@/lib/db/schema";
import { eq, sum } from "drizzle-orm";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = session.user;
  const userId = user.id!;

  const [memberships, totalPagesResult, firstSessionResult, allBooks] = await Promise.all([
    db
      .select({
        challengeId: challengeMembers.challengeId,
        name: challenges.name,
        weeklyGoal: challenges.weeklyGoal,
        penaltyAmount: challenges.penaltyAmount,
        penaltyCurrency: challenges.penaltyCurrency,
      })
      .from(challengeMembers)
      .innerJoin(challenges, eq(challengeMembers.challengeId, challenges.id))
      .where(eq(challengeMembers.userId, userId)),

    db
      .select({ total: sum(readingSessions.pagesRead) })
      .from(readingSessions)
      .where(eq(readingSessions.userId, userId)),

    db
      .select({ loggedAt: readingSessions.loggedAt })
      .from(readingSessions)
      .where(eq(readingSessions.userId, userId))
      .orderBy(readingSessions.loggedAt)
      .limit(1),

    db
      .select()
      .from(booksSchema)
      .where(eq(booksSchema.userId, userId))
      .orderBy(booksSchema.addedAt),
  ]);

  const totalPages = Number(totalPagesResult[0]?.total ?? 0);
  const daysActive = firstSessionResult[0]
    ? Math.max(1, Math.ceil((Date.now() - firstSessionResult[0].loggedAt.getTime()) / 86400000))
    : 1;
  const avgDaily = totalPages > 0 ? Math.round(totalPages / daysActive) : 0;

  const reading = allBooks.filter((b) => !b.finished);
  const finished = allBooks.filter((b) => b.finished);

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

      {/* User card */}
      <div className="flex items-center gap-4 p-5 rounded-[16px]"
        style={{ backgroundColor: "var(--bg-card)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-default)" }}>
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

      {/* Analytics */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total pages" value={totalPages.toLocaleString()} />
        <StatCard label="Avg / day" value={`${avgDaily}`} />
        <StatCard label="Books read" value={`${finished.length}`} />
      </div>

      {/* Bookshelves */}
      {allBooks.length > 0 && (
        <div className="flex flex-col gap-4">
          {reading.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                Reading now
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {reading.map((book) => (
                  <BookCover key={book.id} title={book.title} coverUrl={book.coverUrl} />
                ))}
              </div>
            </div>
          )}
          {finished.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                Finished
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {finished.map((book) => (
                  <BookCover key={book.id} title={book.title} coverUrl={book.coverUrl} faded />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Challenges */}
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 p-4 rounded-[12px]"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
      <p className="font-serif text-xl font-semibold" style={{ color: "var(--text-primary)" }}>{value}</p>
      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{label}</p>
    </div>
  );
}

function BookCover({ title, coverUrl, faded }: { title: string; coverUrl: string | null; faded?: boolean }) {
  return (
    <div className="shrink-0 w-14" style={{ opacity: faded ? 0.6 : 1 }}>
      {coverUrl ? (
        <img src={coverUrl} alt={title} className="w-14 rounded-[6px] object-cover shadow-sm" style={{ aspectRatio: "2/3" }} />
      ) : (
        <div className="w-14 rounded-[6px] flex items-center justify-center"
          style={{ aspectRatio: "2/3", backgroundColor: "var(--app-accent-light)" }}>
          <span className="text-xl">📖</span>
        </div>
      )}
    </div>
  );
}
