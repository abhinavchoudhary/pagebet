import Link from "next/link";

import { Card } from "@/components/ui/card";
import { LinearProgress } from "@/components/ui/linear-progress";

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
  currentUserId?: string;
}

export function ChallengeCard({
  id,
  name,
  members,
  currentUserId,
}: ChallengeCardProps) {
  const myRank =
    members.findIndex((m) => m.user_id === currentUserId) + 1;

  return (
    <Card variant="elevated" className="overflow-hidden">

      <Link
        href={`/challenges/${id}`}
        className="md-state-layer block rounded-corner-lg p-4"
      >
        <div className="mb-1 flex items-start justify-between gap-2">
          <p className="md-title-large text-on-surface">{name}</p>
          {myRank > 0 && (
            <span className="shrink-0 rounded-corner-xs bg-primary px-1.5 py-0.5 md-label-small text-on-primary">
              #{myRank}
            </span>
          )}
        </div>
        <p className="mb-3 md-body-small text-on-surface-variant">
          {members.length} reader{members.length !== 1 ? "s" : ""}
        </p>

        <div className="flex flex-col gap-2">
          {members.slice(0, 4).map((m, i) => {
            const frac = Math.min(1, m.pages_this_week / m.weekly_goal);
            const isMe = m.user_id === currentUserId;
            const isLeader = i === 0;
            return (
              <div key={m.user_id} className="flex items-center gap-2">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-corner-full bg-surface-container-highest md-label-small text-on-surface-variant">
                  {m.display_name[0]?.toUpperCase()}
                </div>
                <LinearProgress
                  value={frac}
                  thickness={5}
                  indicatorClassName={
                    isLeader
                      ? "bg-primary"
                      : isMe
                        ? "bg-secondary"
                        : "bg-outline"
                  }
                />
                <span
                  className={`w-7 text-right tabular-nums md-body-small ${
                    isMe ? "font-semibold text-on-surface" : "text-on-surface-variant"
                  }`}
                >
                  {m.pages_this_week}
                </span>
              </div>
            );
          })}
        </div>
      </Link>
    </Card>
  );
}
