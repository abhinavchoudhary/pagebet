import * as React from "react";

import { cn } from "@/lib/utils";

interface CircularProgressProps {
  /** 0–1 */
  value: number;
  size?: number;
  thickness?: number;
  className?: string;
  trackClassName?: string;
  indicatorClassName?: string;
  children?: React.ReactNode;
}

/**
 * Material 3 determinate circular progress. Renders a centred label / children
 * inside the ring. The sweep animates via stroke-dashoffset.
 */
export function CircularProgress({
  value,
  size = 128,
  thickness = 10,
  className,
  trackClassName,
  indicatorClassName,
  children,
}: CircularProgressProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - clamped);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={thickness}
          className={cn("stroke-surface-container-highest", trackClassName)}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            "stroke-primary transition-[stroke-dashoffset] duration-[var(--md-sys-motion-duration-medium-4)] ease-[var(--ease-out-quart)]",
            indicatorClassName
          )}
        />
      </svg>
      {children != null && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
