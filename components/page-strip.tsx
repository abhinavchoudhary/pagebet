"use client";

interface PageStripProps {
  pagesRead: number;
  weeklyGoal: number;
  completed?: boolean;
}

export function PageStrip({ pagesRead, weeklyGoal, completed = false }: PageStripProps) {
  const total = weeklyGoal;
  const filled = Math.min(pagesRead, total);
  const milestones = [0, Math.floor(total * 0.2), Math.floor(total * 0.4), Math.floor(total * 0.6), total];

  return (
    <div className="w-full">
      <div className="flex items-end gap-[2px]">
        {Array.from({ length: total }).map((_, i) => {
          const isRead = i < filled;
          const isCurrentPage = i === filled - 1 && pagesRead > 0 && pagesRead <= total;
          const isMilestone = milestones.includes(i + 1);

          let bgColor = "#F0EAE3";
          let height = "16px";

          if (completed) {
            bgColor = "#4A7C59";
            height = "28px";
          } else if (isCurrentPage && !completed) {
            bgColor = "#C4919F";
            height = "20px";
          } else if (isRead) {
            bgColor = "#7B3B52";
            height = "28px";
          }

          return (
            <div
              key={i}
              className="flex-1 rounded-[1px] transition-all duration-300"
              style={{
                height,
                backgroundColor: bgColor,
                minWidth: "2px",
              }}
              aria-label={isMilestone ? `Page ${i + 1}` : undefined}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        {milestones.map((m) => (
          <span key={m} className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}
