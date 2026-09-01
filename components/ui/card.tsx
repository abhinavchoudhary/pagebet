import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva("rounded-corner-lg transition-shadow", {
  variants: {
    variant: {
      filled: "bg-surface-container-highest text-on-surface",
      elevated: "bg-surface-container-low text-on-surface md-elevation-1",
      outlined: "bg-surface border border-outline-variant text-on-surface",
    },
  },
  defaultVariants: { variant: "elevated" },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

export { Card, cardVariants };
