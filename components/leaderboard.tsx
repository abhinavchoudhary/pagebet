interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  pages_this_week: number;
  weekly_goal: number;
  penalty_exposure: number;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  penaltyCurrency: string;
  currentUserId: string;
}

export function Leaderboard({ entries, penaltyCurrency, currentUserId }: LeaderboardProps) {
  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry, i) => {
        const pct = Math.min(1, entry.pages_this_week / entry.weekly_goal);
        const done = entry.pages_this_week >= entry.weekly_goal;
        const isMe = entry.user_id === currentUserId;

        return (
          <div
            key={entry.user_id}
            className="flex items-center gap-3 p-3 rounded-[12px]"
            style={{
              backgroundColor: isMe ? "var(--app-accent-light)" : "var(--bg-card)",
              border: `1px solid ${isMe ? "var(--app-accent)" : "var(--border-default)"}`,
            }}
          >
            <span
              className="text-sm font-medium w-5 text-center tabular-nums"
              style={{ color: "var(--text-muted)" }}
            >
              {i + 1}
            </span>

            {entry.avatar_url ? (
              <img
                src={entry.avatar_url}
                alt={entry.display_name}
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}
              >
                {entry.display_name[0]?.toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                {entry.display_name}{isMe ? " (you)" : ""}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-subtle)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct * 100}%`,
                      backgroundColor: done ? "#4A7C59" : "var(--app-accent)",
                    }}
                  />
                </div>
                <span className="text-xs tabular-nums shrink-0" style={{ color: "var(--text-muted)" }}>
                  {entry.pages_this_week}/{entry.weekly_goal}
                </span>
              </div>
            </div>

            {entry.penalty_exposure > 0 ? (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
                style={{ backgroundColor: "var(--penalty-bg)", color: "var(--penalty)" }}
              >
                {penaltyCurrency}{entry.penalty_exposure}
              </span>
            ) : (
              <span className="text-sm shrink-0">✓</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
