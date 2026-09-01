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

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LinearProgress } from "@/components/ui/linear-progress";
import { ThemeToggle } from "@/components/theme-toggle";
import { bookProgress } from "@/lib/book-progress";

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
  const nowMs = new Date().getTime();
  const daysActive = firstSessionResult[0]
    ? Math.max(
        1,
        Math.ceil(
          (nowMs - firstSessionResult[0].loggedAt.getTime()) / 86400000
        )
      )
    : 1;
  const avgDaily = totalPages > 0 ? Math.round(totalPages / daysActive) : 0;

  const reading = allBooks.filter((b) => !b.finished);
  const finished = allBooks.filter((b) => b.finished);

  return (
    <div
      className="flex flex-col gap-6 px-4"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)" }}
    >
      <div className="flex items-center justify-between px-1">
        <h1 className="md-headline-medium text-on-surface">You</h1>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <Button type="submit" variant="text" size="sm">
            <LogOut className="size-4" /> Sign out
          </Button>
        </form>
      </div>

      <div className="flex flex-col items-center gap-3 border-b border-outline-variant pb-6">
        {user.image ? (
          <img
            src={user.image}
            alt={user.name ?? ""}
            className="size-[72px] rounded-corner-full object-cover"
          />
        ) : (
          <div className="flex size-[72px] items-center justify-center rounded-corner-full bg-primary-container md-headline-small text-on-primary-container">
            {user.name?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div className="text-center">
          <p className="md-title-large text-on-surface">{user.name}</p>
          <p className="md-body-small text-on-surface-variant">
            {memberships.length} challenge{memberships.length !== 1 ? "s" : ""}{" "}
            joined
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Pages read" value={totalPages.toLocaleString()} />
        <StatCard label="Avg / day" value={`${avgDaily}`} />
        <StatCard label="Books read" value={`${finished.length}`} />
        <StatCard label="Reading now" value={`${reading.length}`} accent />
      </div>

      {reading.length > 0 && (
        <section>
          <p className="mb-3 md-label-medium text-on-surface-variant">
            Currently reading
          </p>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {reading.map((book) => {
              const p = bookProgress({
                currentPage: book.currentPage,
                totalPages: book.totalPages,
                finished: book.finished,
              });
              return (
                <Link
                  key={book.id}
                  href={`/library/${book.id}`}
                  className="w-16 shrink-0"
                >
                  {book.coverUrl ? (
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="w-16 rounded-corner-xs object-cover md-elevation-1"
                      style={{ aspectRatio: "2 / 3" }}
                    />
                  ) : (
                    <div
                      className="w-16 rounded-corner-xs bg-primary-container"
                      style={{ aspectRatio: "2 / 3" }}
                    />
                  )}
                  {!p.unknownTotal && (
                    <div className="mt-1">
                      <LinearProgress value={p.fraction} thickness={3} />
                    </div>
                  )}
                  <p className="mt-1 line-clamp-2 md-label-small leading-tight text-on-surface-variant">
                    {book.title}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <ThemeToggle />
      </section>

      <section>
        <p className="mb-3 md-label-medium text-on-surface-variant">
          My challenges
        </p>
        <div className="overflow-hidden rounded-corner-lg border border-outline-variant">
          {memberships.map((m, i) => (
            <Link
              key={m.challengeId}
              href={`/challenges/${m.challengeId}`}
              className="md-state-layer flex items-center justify-between px-4 py-3"
              style={{
                borderTop:
                  i === 0
                    ? undefined
                    : "1px solid var(--md-sys-color-outline-variant)",
              }}
            >
              <div className="z-[1]">
                <p className="md-body-large text-on-surface">{m.name}</p>
                <p className="md-body-small text-on-surface-variant">
                  {m.weeklyGoal} pg/wk · {m.penaltyCurrency}
                  {Number(m.penaltyAmount)}/pg
                </p>
              </div>
              <span className="z-[1] text-on-surface-variant">›</span>
            </Link>
          ))}
          {memberships.length === 0 && (
            <p className="px-4 py-8 text-center md-body-medium text-on-surface-variant">
              No challenges yet
            </p>
          )}
        </div>
        <Link
          href="/challenges/new"
          className="mt-2 flex items-center justify-center rounded-corner-lg border border-dashed border-outline py-3 md-label-large text-on-surface-variant"
        >
          + Create a challenge
        </Link>
      </section>
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
    <Card
      variant={accent ? "filled" : "outlined"}
      className={`p-4 ${accent ? "bg-tertiary-container text-on-tertiary-container" : ""}`}
    >
      <p className="md-display-small">{value}</p>
      <p className="mt-1 md-label-medium opacity-80">{label}</p>
    </Card>
  );
}
