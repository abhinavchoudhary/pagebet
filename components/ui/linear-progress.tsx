import * as React from "react";

import { cn } from "@/lib/utils";

interface LinearProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 0–1 */
  value: number;
  trackClassName?: string;
  indicatorClassName?: string;
  /** height in px */
  thickness?: number;
}

/**
 * Material 3 determinate linear progress — rounded ends, a small gap between
 * the active indicator and the track stop, and a smooth width transition.
 */
export function LinearProgress({
  value,
  className,
  trackClassName,
  indicatorClassName,
  thickness = 4,
  ...props
}: LinearProgressProps) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("flex w-full items-center gap-1", className)}
      {...props}
    >
      <div
        className={cn(
          "relative flex-1 overflow-hidden rounded-corner-full bg-surface-container-highest",
          trackClassName
        )}
        style={{ height: thickness }}
      >
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-corner-full bg-primary transition-[width] duration-[var(--md-sys-motion-duration-medium-2)] ease-[var(--ease-out-quart)]",
            indicatorClassName
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
