export interface PenaltyInput {
  weeklyGoal: number;
  pagesThisWeek: number;
  penaltyAmount: number;
  carryOver: boolean;
  pagesLastWeek?: number;
}

export function computePenalty(input: PenaltyInput): {
  pagesOwed: number;
  penaltyExposure: number;
  effectiveGoal: number;
  surplusLastWeek: number;
} {
  const { weeklyGoal, pagesThisWeek, penaltyAmount, carryOver, pagesLastWeek = 0 } = input;

  let surplusLastWeek = 0;
  let effectiveGoal = weeklyGoal;

  if (carryOver) {
    surplusLastWeek = Math.max(0, pagesLastWeek - weeklyGoal);
    effectiveGoal = Math.max(0, weeklyGoal - surplusLastWeek);
  }

  const pagesOwed = Math.max(0, effectiveGoal - pagesThisWeek);
  const penaltyExposure = pagesOwed * penaltyAmount;

  return { pagesOwed, penaltyExposure, effectiveGoal, surplusLastWeek };
}
