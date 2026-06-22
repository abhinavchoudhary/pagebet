import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageStrip } from "@/components/page-strip";
import { ChallengeCard } from "@/components/challenge-card";
import { HomeLogButton } from "@/components/home-log-button";
import { getRollingWeek } from "@/lib/rolling-week";
import { computePenalty } from "@/lib/penalty";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, challengeRes, booksRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("challenge_members")
      .select("challenge_id, joined_at, challenges(*)")
      .eq("user_id", user.id),
    supabase
      .from("books")
      .select("*")
      .eq("user_id", user.id)
      .eq("finished", false)
      .order("added_at", { ascending: false }),
  ]);

  const profile = profileRes.data;
  const memberships = challengeRes.data ?? [];
  const books = booksRes.data ?? [];

  const now = new Date();
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = now.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  const activeMemberships = memberships.filter(
    (m) => m.challenges && !(m.challenges as Record<string, unknown>).archived
  );

  const firstChallenge = activeMemberships[0];
  let weekSummary = { pages: 0, goal: 35, penalty: 0, daysRemaining: 7 };

  if (firstChallenge) {
    const { weekStart, daysRemaining } = getRollingWeek(
      new Date(firstChallenge.joined_at),
      now
    );
    const c = firstChallenge.challenges as Record<string, unknown>;
    const { data: credits } = await supabase
      .from("challenge_session_credits")
      .select("pages_credited")
      .eq("challenge_id", firstChallenge.challenge_id)
      .eq("user_id", user.id)
      .eq("week_start", weekStart.toISOString().split("T")[0]);

    const pagesThisWeek = (credits ?? []).reduce((s, r) => s + r.pages_credited, 0);
    const weeklyGoal = (c.weekly_goal as number) ?? 35;
    const { penaltyExposure } = computePenalty({
      weeklyGoal,
      pagesThisWeek,
      penaltyAmount: (c.penalty_amount as number) ?? 10,
      carryOver: (c.carry_over as boolean) ?? false,
    });

    weekSummary = {
      pages: pagesThisWeek,
      goal: weeklyGoal,
      penalty: penaltyExposure,
      daysRemaining,
    };
  }

  const challengeLeaderboards = await Promise.all(
    activeMemberships.slice(0, 3).map(async (m) => {
      const c = m.challenges as Record<string, unknown>;
      const { data: entries } = await supabase.rpc("get_leaderboard", {
        p_challenge_id: m.challenge_id,
      });

      return {
        id: m.challenge_id,
        name: (c.name as string) ?? "",
        currency: (c.penalty_currency as string) ?? "₹",
        entries: (entries ?? []).map((e) => ({
          user_id: e.user_id,
          display_name: e.display_name,
          avatar_url: e.avatar_url,
          pages_this_week: Number(e.pages_this_week),
          weekly_goal: e.weekly_goal,
          penalty_exposure: Number(e.penalty_exposure),
          penalty_currency: (c.penalty_currency as string) ?? "₹",
        })),
      };
    })
  );

  const activeBooks = books.slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          {dayName}, {dateStr}
        </p>
        <h1 className="font-serif text-2xl font-semibold italic mt-0.5" style={{ color: "var(--text-primary)" }}>
          Your reading corner
        </h1>
      </div>

      <div
        className="rounded-[16px] p-5"
        style={{
          backgroundColor: "var(--bg-card)",
          boxShadow: "var(--shadow-card)",
          border: "1px solid var(--border-default)",
        }}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p
              className="font-serif font-semibold leading-none"
              style={{ fontSize: "64px", color: "var(--text-primary)", lineHeight: 1 }}
            >
              {weekSummary.pages}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}>
              pages read this week
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 pt-1">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              of {weekSummary.goal} pg
            </p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {weekSummary.daysRemaining} days left
            </p>
            {weekSummary.penalty > 0 && (
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "var(--penalty-bg)", color: "var(--penalty)" }}
              >
                ₹{weekSummary.penalty} risk
              </span>
            )}
          </div>
        </div>

        <PageStrip
          pagesRead={weekSummary.pages}
          weeklyGoal={weekSummary.goal}
          completed={weekSummary.pages >= weekSummary.goal}
        />
      </div>

      {activeBooks.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
            Reading now
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {activeBooks.map((book) => (
              <Link
                key={book.id}
                href="/library"
                className="flex items-center gap-2 px-3 py-2 rounded-full shrink-0 text-sm"
                style={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-secondary)",
                }}
              >
                {book.cover_url ? (
                  <img src={book.cover_url} alt={book.title} className="w-5 h-7 object-cover rounded" />
                ) : (
                  <span>📗</span>
                )}
                <span className="line-clamp-1 max-w-[120px]">{book.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {challengeLeaderboards.length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
            My challenges
          </p>
          <div className="flex flex-col gap-3">
            {challengeLeaderboards.map((c) => (
              <ChallengeCard
                key={c.id}
                id={c.id}
                name={c.name}
                members={c.entries}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-10">
          <span className="text-4xl">📚</span>
          <p className="font-serif text-lg text-center" style={{ color: "var(--text-secondary)" }}>
            Start a challenge with friends
          </p>
          <Link
            href="/challenges/new"
            className="px-5 py-2.5 rounded-[10px] text-sm font-medium text-white"
            style={{ backgroundColor: "var(--app-accent)" }}
          >
            Create a challenge
          </Link>
        </div>
      )}

      <HomeLogButton
        books={books}
        challenges={activeMemberships.map((m) => ({
          id: m.challenge_id,
          name: ((m.challenges as Record<string, unknown>)?.name as string) ?? "",
          joined_at: m.joined_at,
        }))}
        userId={user.id}
      />
    </div>
  );
}
