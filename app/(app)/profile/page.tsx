import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings } from "lucide-react";
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

  const [memberships, totalPagesResult, firstSessionResult, allBooks] =
    await Promise.all([
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
    ? Math.max(
        1,
        Math.ceil(
          (Date.now() - firstSessionResult[0].loggedAt.getTime()) / 86400000
        )
      )
    : 1;
  const avgDaily = totalPages > 0 ? Math.round(totalPages / daysActive) : 0;

  const reading = allBooks.filter((b) => !b.finished);
  const finished = allBooks.filter((b) => b.finished);

  return (
    <div className="flex flex-col gap-6 px-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 24px)" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1
          className="font-serif font-semibold"
          style={{ fontSize: 24, color: "var(--espresso)" }}
        >
          Your Reading
        </h1>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="flex items-center justify-center w-8 h-8 rounded-full"
            style={{ color: "var(--text-muted)", backgroundColor: "var(--bg-subtle)" }}
          >
            <Settings size={16} />
          </button>
        </form>
      </div>

      {/* Profile block */}
      <div
        className="flex flex-col items-center gap-3 pb-5"
        style={{ borderBottom: "1px solid var(--border-default)" }}
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name ?? ""}
            className="w-[72px] h-[72px] rounded-full object-cover"
            style={{ border: "3px solid #c8913a" }}
          />
        ) : (
          <div
            className="w-[72px] h-[72px] rounded-full flex items-center justify-center font-semibold"
            style={{
              backgroundColor: "#3b2412",
              border: "3px solid #c8913a",
              color: "#ffffff",
              fontSize: 28,
              fontFamily: "var(--font-inter)",
            }}
          >
            {user.name?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div className="text-center">
          <p
            className="font-serif font-semibold"
            style={{ fontSize: 22, color: "var(--espresso)" }}
          >
            {user.name}
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}
          >
            {memberships.length} challenge{memberships.length !== 1 ? "s" : ""} joined
          </p>
        </div>
      </div>

      {/* Stats 2×2 grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <StatCard
          label="Pages Read"
          value={totalPages.toLocaleString()}
        />
        <StatCard label="Avg / day" value={`${avgDaily}`} />
        <StatCard label="Books Read" value={`${finished.length}`} />
        <StatCard label="Reading Now" value={`${reading.length}`} accent />
      </div>

      {/* Currently Reading */}
      {reading.length > 0 && (
        <div>
          <p
            className="text-[10px] font-semibold uppercase mb-3"
            style={{
              letterSpacing: "0.1em",
              color: "var(--text-muted)",
              fontFamily: "var(--font-inter)",
            }}
          >
            Currently Reading
          </p>
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {reading.map((book) => (
              <BookCover key={book.id} title={book.title} coverUrl={book.coverUrl} />
            ))}
          </div>
        </div>
      )}

      {/* Finished */}
      {finished.length > 0 && (
        <div>
          <p
            className="text-[10px] font-semibold uppercase mb-3"
            style={{
              letterSpacing: "0.1em",
              color: "var(--text-muted)",
              fontFamily: "var(--font-inter)",
            }}
          >
            Finished
          </p>
          <div className="flex gap-2.5 overflow-x-auto pb-1 opacity-60">
            {finished.map((book) => (
              <BookCover key={book.id} title={book.title} coverUrl={book.coverUrl} />
            ))}
          </div>
        </div>
      )}

      {/* Past challenges */}
      <div>
        <p
          className="text-[10px] font-semibold uppercase mb-3"
          style={{
            letterSpacing: "0.1em",
            color: "var(--text-muted)",
            fontFamily: "var(--font-inter)",
          }}
        >
          My Challenges
        </p>
        <div
          className="rounded-[4px] overflow-hidden"
          style={{ border: "1px solid var(--border-default)" }}
        >
          {memberships.map((m, i) => (
            <Link
              key={m.challengeId}
              href={`/challenges/${m.challengeId}`}
              className="flex items-center justify-between px-4 py-3"
              style={{
                backgroundColor: "var(--cream)",
                borderTop: i === 0 ? "none" : "1px solid var(--border-default)",
              }}
            >
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-inter)" }}
                >
                  {m.name}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}
                >
                  {m.weeklyGoal} pg/wk · {m.penaltyCurrency}
                  {Number(m.penaltyAmount)}/pg
                </p>
              </div>
              <span style={{ color: "var(--text-muted)" }}>›</span>
            </Link>
          ))}
          {memberships.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p
                className="text-sm"
                style={{ color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}
              >
                No challenges yet
              </p>
            </div>
          )}
        </div>
        <Link
          href="/challenges/new"
          className="flex items-center justify-center mt-2 py-3 rounded-[4px] text-sm font-medium"
          style={{
            border: "1px dashed var(--border-strong)",
            color: "var(--text-muted)",
            fontFamily: "var(--font-inter)",
          }}
        >
          + Create a challenge
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className="flex flex-col gap-1 p-4 rounded-[4px]"
      style={{
        backgroundColor: "var(--cream)",
        border: "1px solid var(--border-default)",
        boxShadow: "var(--shadow-card)",
        borderLeft: accent ? "3px solid #c8913a" : undefined,
      }}
    >
      <p
        className="font-serif font-semibold"
        style={{ fontSize: 28, color: "var(--espresso)", lineHeight: 1 }}
      >
        {value}
      </p>
      <p
        className="text-[10px] font-semibold uppercase mt-1"
        style={{
          letterSpacing: "0.1em",
          color: "var(--text-muted)",
          fontFamily: "var(--font-inter)",
        }}
      >
        {label}
      </p>
    </div>
  );
}

function BookCover({
  title,
  coverUrl,
}: {
  title: string;
  coverUrl: string | null;
}) {
  return (
    <div className="shrink-0 w-14 flex flex-col gap-1">
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={title}
          className="w-14 rounded-[4px] object-cover shadow-sm"
          style={{ aspectRatio: "2/3" }}
        />
      ) : (
        <div
          className="w-14 rounded-[4px]"
          style={{ aspectRatio: "2/3", backgroundColor: "var(--espresso)" }}
        />
      )}
      <p
        className="text-[10px] leading-tight line-clamp-2"
        style={{ color: "var(--text-secondary)", fontFamily: "var(--font-inter)" }}
      >
        {title}
      </p>
    </div>
  );
}
