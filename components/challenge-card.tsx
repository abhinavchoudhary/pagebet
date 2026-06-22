import Link from "next/link";

interface Member {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  pages_this_week: number;
  weekly_goal: number;
  penalty_exposure: number;
  penalty_currency: string;
}

interface ChallengeCardProps {
  id: string;
  name: string;
  members: Member[];
}

export function ChallengeCard({ id, name, members }: ChallengeCardProps) {
  return (
    <Link
      href={`/challenges/${id}`}
      className="block rounded-[12px] p-4"
      style={{
        backgroundColor: "var(--bg-card)",
        boxShadow: "var(--shadow-card)",
        border: "1px solid var(--border-default)",
      }}
    >
      <p className="font-serif text-base font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
        {name}
      </p>
      <div className="flex flex-col gap-2">
        {members.map((m) => {
          const pct = Math.min(1, m.pages_this_week / m.weekly_goal);
          const done = m.pages_this_week >= m.weekly_goal;
          return (
            <div key={m.user_id} className="flex items-center gap-2">
              <span
                className="text-xs font-medium truncate w-20 shrink-0"
                style={{ color: "var(--text-secondary)" }}
              >
                {m.display_name.split(" ")[0]}
              </span>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-subtle)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct * 100}%`,
                    backgroundColor: done ? "#4A7C59" : "var(--app-accent)",
                  }}
                />
              </div>
              <span className="text-xs tabular-nums w-8 text-right" style={{ color: done ? "#4A7C59" : "var(--text-secondary)" }}>
                {m.pages_this_week}
              </span>
              {m.penalty_exposure > 0 && (
                <span
                  className="text-[11px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: "var(--penalty-bg)",
                    color: "var(--penalty)",
                  }}
                >
                  {m.penalty_currency}{m.penalty_exposure}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Link>
  );
}
