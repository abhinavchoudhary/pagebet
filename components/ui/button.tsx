import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Material 3 button. Variants map to M3's five button styles plus a FAB.
 * Press feedback (scale 0.97) is global in globals.css (Emil Kowalski #1);
 * hover/focus/press state layers come from `.md-state-layer`.
 */
const buttonVariants = cva(
  "md-state-layer relative inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-corner-full md-label-large outline-none transition-[background-color,box-shadow,color] duration-[var(--md-sys-motion-duration-short-3)] ease-[var(--md-sys-motion-easing-standard)] focus-visible:ring-2 focus-visible:ring-primary/60 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:z-[1] [&_svg]:shrink-0 [&>span]:z-[1]",
  {
    variants: {
      variant: {
        filled: "bg-primary text-on-primary",
        tonal: "bg-secondary-container text-on-secondary-container",
        elevated:
          "bg-surface-container-low text-primary md-elevation-1 hover:md-elevation-2",
        outlined:
          "border border-outline bg-transparent text-primary",
        text: "bg-transparent text-primary px-3",
        "filled-tertiary": "bg-tertiary text-on-tertiary",
        danger: "bg-error-container text-on-error-container",
        fab: "bg-primary-container text-on-primary-container md-elevation-3 hover:md-elevation-4 rounded-corner-lg",
      },
      size: {
        sm: "h-9 px-4 text-[0.8125rem]",
        md: "h-10 px-6",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10 p-0",
        fab: "h-14 w-14 p-0",
        "fab-extended": "h-14 px-5",
      },
    },
    defaultVariants: {
      variant: "filled",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
