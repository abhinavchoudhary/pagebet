"use client";

interface PageStripProps {
  pagesRead: number;
  weeklyGoal: number;
  completed?: boolean;
}

export function PageStrip({ pagesRead, weeklyGoal, completed = false }: PageStripProps) {
  const total = weeklyGoal;
  const filled = Math.min(pagesRead, total);
  const milestones = [0, Math.floor(total * 0.25), Math.floor(total * 0.5), Math.floor(total * 0.75), total];

  return (
    <div className="w-full">
      <div className="flex items-end gap-[2px]">
        {Array.from({ length: total }).map((_, i) => {
          const isRead = i < filled;
          const isCurrentPage = i === filled - 1 && pagesRead > 0 && pagesRead <= total;

          let bgColor = "#e4d8c4";
          let height = "14px";

          if (completed) {
            bgColor = "#c8913a";
            height = "26px";
          } else if (isCurrentPage) {
            bgColor = "#b07040";
            height = "18px";
          } else if (isRead) {
            bgColor = "#7a4a1e";
            height = "26px";
          }

          return (
            <div
              key={i}
              className="flex-1 rounded-[1px] transition-all duration-300"
              style={{ height, backgroundColor: bgColor, minWidth: "2px" }}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        {milestones.map((m) => (
          <span key={m} className="text-[10px]" style={{ color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}>
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}
