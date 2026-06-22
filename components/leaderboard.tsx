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
    <div
      className="rounded-[4px] overflow-hidden"
      style={{ border: "1px solid var(--border-default)" }}
    >
      {entries.map((entry, i) => {
        const pct = Math.min(1, entry.pages_this_week / entry.weekly_goal);
        const isMe = entry.user_id === currentUserId;
        const isLeader = i === 0;
        const barColor = isLeader ? "#c8913a" : isMe ? "#7a4a1e" : "#9c826a";

        return (
          <div
            key={entry.user_id}
            className="flex items-center gap-3 px-4 py-3"
            style={{
              backgroundColor: isMe ? "var(--cream)" : "var(--old-lace)",
              borderTop: i === 0 ? "none" : isMe ? "2px solid #c8913a" : "1px solid var(--border-default)",
              borderLeft: isMe ? "3px solid #c8913a" : "none",
            }}
          >
            <span
              className="text-sm tabular-nums w-5 text-center shrink-0"
              style={{
                color: "var(--text-muted)",
                fontFamily: "var(--font-inter)",
                fontWeight: isLeader ? 700 : 400,
              }}
            >
              {i + 1}
            </span>

            {entry.avatar_url ? (
              <img
                src={entry.avatar_url}
                alt={entry.display_name}
                className="w-7 h-7 rounded-full object-cover shrink-0"
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                style={{ backgroundColor: "#e4d8c4", color: "var(--text-muted)" }}
              >
                {entry.display_name[0]?.toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p
                className="text-sm truncate"
                style={{
                  color: isMe ? "var(--espresso)" : "var(--text-primary)",
                  fontWeight: isMe ? 700 : 500,
                  fontFamily: "var(--font-inter)",
                }}
              >
                {entry.display_name.split(" ")[0]}{isMe ? " (you)" : ""}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="flex-1 rounded-full overflow-hidden"
                  style={{ height: 4, backgroundColor: "#dfd0b8" }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct * 100}%`,
                      backgroundColor: barColor,
                      borderRadius: "inherit",
                    }}
                  />
                </div>
                <span
                  className="text-[11px] tabular-nums shrink-0"
                  style={{ color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}
                >
                  {entry.pages_this_week}/{entry.weekly_goal}
                </span>
              </div>
            </div>

            {entry.penalty_exposure > 0 ? (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-[2px] shrink-0"
                style={{
                  backgroundColor: "var(--penalty-bg)",
                  color: "var(--penalty)",
                  fontFamily: "var(--font-inter)",
                }}
              >
                {penaltyCurrency}{entry.penalty_exposure}
              </span>
            ) : (
              <span
                className="text-[11px] font-semibold shrink-0"
                style={{ color: "#c8913a", fontFamily: "var(--font-inter)" }}
              >
                ✓
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
