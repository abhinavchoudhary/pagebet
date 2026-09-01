import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const chipVariants = cva(
  "md-state-layer relative inline-flex items-center gap-1.5 overflow-hidden rounded-corner-sm border md-label-large h-8 px-3 outline-none transition-colors duration-[var(--md-sys-motion-duration-short-3)] ease-[var(--md-sys-motion-easing-standard)] focus-visible:ring-2 focus-visible:ring-primary/60 disabled:pointer-events-none disabled:opacity-40 [&_svg]:z-[1] [&_svg]:size-[18px] [&>span]:z-[1]",
  {
    variants: {
      selected: {
        true: "border-transparent bg-secondary-container text-on-secondary-container",
        false: "border-outline bg-transparent text-on-surface-variant",
      },
    },
    defaultVariants: { selected: false },
  }
);

export interface ChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof chipVariants> {}

const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, selected, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-pressed={selected ?? undefined}
      className={cn(chipVariants({ selected }), className)}
      {...props}
    />
  )
);
Chip.displayName = "Chip";

export { Chip, chipVariants };
