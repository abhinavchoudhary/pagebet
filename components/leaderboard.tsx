import { Check } from "lucide-react";

import { LinearProgress } from "@/components/ui/linear-progress";

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

export function Leaderboard({
  entries,
  penaltyCurrency,
  currentUserId,
}: LeaderboardProps) {
  return (
    <div className="overflow-hidden rounded-corner-lg border border-outline-variant">
      {entries.map((entry, i) => {
        const frac = Math.min(1, entry.pages_this_week / entry.weekly_goal);
        const isMe = entry.user_id === currentUserId;
        const isLeader = i === 0;

        return (
          <div
            key={entry.user_id}
            className="flex items-center gap-3 px-4 py-3"
            style={{
              backgroundColor: isMe
                ? "var(--md-sys-color-surface-container-highest)"
                : "var(--md-sys-color-surface-container-low)",
              borderTop:
                i === 0
                  ? undefined
                  : "1px solid var(--md-sys-color-outline-variant)",
            }}
          >
            <span
              className={`w-5 shrink-0 text-center tabular-nums md-body-small ${
                isLeader ? "font-bold text-primary" : "text-on-surface-variant"
              }`}
            >
              {i + 1}
            </span>

            {entry.avatar_url ? (
              <img
                src={entry.avatar_url}
                alt={entry.display_name}
                className="size-7 shrink-0 rounded-corner-full object-cover"
              />
            ) : (
              <div className="flex size-7 shrink-0 items-center justify-center rounded-corner-full bg-primary-container md-label-small text-on-primary-container">
                {entry.display_name[0]?.toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p
                className={`truncate md-body-medium ${
                  isMe ? "font-semibold text-on-surface" : "text-on-surface"
                }`}
              >
                {entry.display_name.split(" ")[0]}
                {isMe ? " (you)" : ""}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <LinearProgress
                  value={frac}
                  thickness={4}
                  indicatorClassName={isLeader ? "bg-primary" : "bg-secondary"}
                />
                <span className="shrink-0 tabular-nums md-label-small text-on-surface-variant">
                  {entry.pages_this_week}/{entry.weekly_goal}
                </span>
              </div>
            </div>

            {entry.penalty_exposure > 0 ? (
              <span className="shrink-0 rounded-corner-xs bg-error-container px-2 py-0.5 md-label-medium text-on-error-container">
                {penaltyCurrency}
                {entry.penalty_exposure}
              </span>
            ) : (
              <Check className="size-4 shrink-0 text-tertiary" />
            )}
          </div>
        );
      })}
    </div>
  );
}
