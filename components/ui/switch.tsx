"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  className?: string;
}

/**
 * Material 3 switch — the handle grows when pressed / on, the track fills
 * with primary when checked.
 */
export function Switch({
  checked,
  onCheckedChange,
  disabled,
  id,
  className,
  ...aria
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-8 w-[52px] shrink-0 items-center rounded-corner-full border-2 outline-none transition-colors duration-[var(--md-sys-motion-duration-short-4)] ease-[var(--md-sys-motion-easing-standard)] focus-visible:ring-2 focus-visible:ring-primary/60 disabled:opacity-40",
        checked
          ? "border-primary bg-primary"
          : "border-outline bg-surface-container-highest",
        className
      )}
      {...aria}
    >
      <span
        className={cn(
          "pointer-events-none block rounded-corner-full transition-all duration-[var(--md-sys-motion-duration-short-4)] ease-[var(--md-sys-motion-easing-emphasized)]",
          checked
            ? "ml-[22px] size-6 bg-on-primary"
            : "ml-1 size-4 bg-outline"
        )}
      />
    </button>
  );
}
