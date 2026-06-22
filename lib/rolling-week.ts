export function getRollingWeek(joinedAt: Date, now: Date = new Date()) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const msPerWeek = 7 * msPerDay;

  const elapsed = now.getTime() - joinedAt.getTime();
  const weekNumber = Math.floor(elapsed / msPerWeek);

  const weekStart = new Date(joinedAt.getTime() + weekNumber * msPerWeek);
  const weekEnd = new Date(weekStart.getTime() + msPerWeek);
  const daysRemaining = Math.ceil((weekEnd.getTime() - now.getTime()) / msPerDay);

  return {
    weekNumber,
    weekStart,
    weekEnd,
    daysRemaining: Math.max(0, daysRemaining),
  };
}

export function weekStartDateString(joinedAt: Date, now: Date = new Date()): string {
  const { weekStart } = getRollingWeek(joinedAt, now);
  return weekStart.toISOString().split("T")[0];
}
