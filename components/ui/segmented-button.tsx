"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedButtonProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/**
 * Material 3 single-select segmented button. Selected segment fills with
 * secondary-container and shows a check.
 */
export function SegmentedButton<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedButtonProps<T>) {
  return (
    <div
      role="group"
      className={cn(
        "flex h-10 w-full overflow-hidden rounded-corner-full border border-outline",
        className
      )}
    >
      {options.map((opt, i) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(opt.value)}
            className={cn(
              "md-state-layer relative flex flex-1 items-center justify-center gap-1.5 md-label-large transition-colors duration-[var(--md-sys-motion-duration-short-3)]",
              i > 0 && "border-l border-outline",
              selected
                ? "bg-secondary-container text-on-secondary-container"
                : "bg-transparent text-on-surface"
            )}
          >
            {selected && <Check className="z-[1] size-[18px]" />}
            <span className="z-[1]">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
