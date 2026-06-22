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
  currentUserId?: string;
}

export function ChallengeCard({ id, name, members, currentUserId }: ChallengeCardProps) {
  return (
    <Link
      href={`/challenges/${id}`}
      className="block rounded-[4px] p-4"
      style={{
        backgroundColor: "var(--cream)",
        boxShadow: "var(--shadow-card)",
        border: "1px solid var(--border-default)",
      }}
    >
      <p className="font-serif font-semibold mb-1" style={{ fontSize: 17, color: "var(--espresso)" }}>
        {name}
      </p>
      <p className="text-[11px] mb-3" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-inter)" }}>
        {members.length} reader{members.length !== 1 ? "s" : ""}
      </p>
      <div className="flex flex-col gap-2">
        {members.map((m, i) => {
          const pct = Math.min(1, m.pages_this_week / m.weekly_goal);
          const isMe = m.user_id === currentUserId;
          const isLeader = i === 0;
          const barColor = isLeader ? "#c8913a" : isMe ? "#7a4a1e" : "#9c826a";
          return (
            <div key={m.user_id} className="flex items-center gap-2">
              <div
                className="flex items-center justify-center shrink-0 text-[10px] font-semibold"
                style={{
                  width: 22, height: 22, borderRadius: "50%",
                  backgroundColor: isMe ? "rgba(200,145,58,0.18)" : "#e4d8c4",
                  color: isMe ? "#c8913a" : "#9c826a",
                  fontFamily: "var(--font-inter)",
                }}
              >
                {m.display_name[0]?.toUpperCase()}
              </div>
              <div
                className="flex-1 rounded-full overflow-hidden"
                style={{ height: 5, backgroundColor: "#dfd0b8" }}
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
                className="text-[11px] tabular-nums w-7 text-right"
                style={{
                  color: isMe ? "var(--espresso)" : "var(--text-muted)",
                  fontWeight: isMe ? 600 : 400,
                  fontFamily: "var(--font-inter)",
                }}
              >
                {m.pages_this_week}
              </span>
            </div>
          );
        })}
      </div>
    </Link>
  );
}
