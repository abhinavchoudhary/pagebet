export type LogMode = "cumulative" | "direct";

export function computePagesRead(
  mode: LogMode,
  input: number,
  lastCumulativePosition: number | null
): number {
  if (mode === "direct") {
    return Math.max(0, input);
  }

  if (lastCumulativePosition === null) {
    return Math.max(0, input);
  }

  return Math.max(0, input - lastCumulativePosition);
}
